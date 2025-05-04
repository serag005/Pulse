const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise'); // Use promise-based version
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Secret key for JWT - MUST match the one in auth.js
const JWT_SECRET = 'your_hardcoded_secret_here';

// Create a pool instead of a single connection for better stability
let pool;
let connectionTested = false;

async function initializeDatabase() {
  if (pool) return; // Don't reinitialize if already exists
  
  try {
    // Ensure MySQL connection uses the correct charset and timezone
    pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '4420041234@a',
      database: 'prosthetics',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
      timezone: 'Z'
    });
    
    console.log('Database pool created in profile.js');
    
    // Test connection
    const connection = await pool.getConnection();
    connectionTested = true;
    console.log('✅ Connected to MySQL in Profile.js');
    connection.release();
    
    // Also verify the database tables exist
    try {
      const [tables] = await pool.query('SHOW TABLES');
      console.log('Available tables:', tables.map(t => Object.values(t)[0]));
    } catch (tableErr) {
      console.error('Error listing tables:', tableErr);
    }
  } catch (err) {
    console.error('❌ Database connection failed in profile.js:', err);
    // Don't reset the pool - it will retry on next request
  }
}

// Initialize the database connection
initializeDatabase();

// Check database connection before handling requests
async function ensureDatabaseConnection(req, res, next) {
  try {
    if (!pool) {
      await initializeDatabase();
      if (!pool) {
        return res.status(500).json({ message: 'Database connection not available' });
      }
    }
    
    // If connection hasn't been tested yet, test it now
    if (!connectionTested) {
      try {
        const connection = await pool.getConnection();
        connectionTested = true;
        connection.release();
      } catch (err) {
        console.error('Database connection test failed:', err);
        return res.status(500).json({ message: 'Database connection test failed: ' + err.message });
      }
    }
    
    next();
  } catch (err) {
    console.error('Error in ensureDatabaseConnection:', err);
    return res.status(500).json({ message: 'Database connection error: ' + err.message });
  }
}

// Setup upload directory for @uploads
const uploadsDir = path.join(__dirname, '@uploads');
// Create directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from the @uploads directory
router.use('/@uploads', express.static(uploadsDir));

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Initialize multer
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 800 * 1024 // 800KB max size
  }
});

// Middleware to check if user is authenticated via JWT token
const tokenAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    console.log('No authorization header provided');
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  
  // Format should be "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    console.log('Invalid authorization format', parts);
    return res.status(401).json({ message: 'Invalid authorization format' });
  }
  
  const token = parts[1];
  console.log('Token received:', token.substring(0, 15) + '...');
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token verified successfully. User ID:', decoded.id);
    req.user = decoded; // Store user info from token
    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Add a test endpoint to verify routing
router.get('/test', async (req, res) => {
  console.log('Profile test endpoint reached');
  console.log('Auth header:', req.headers.authorization);
  
  try {
    const authHeader = req.headers.authorization;
    let userId = null;
    
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const decoded = jwt.verify(parts[1], JWT_SECRET);
        userId = decoded.id;
      }
    }
    
    // Test database connection
    let dbStatus = 'Unknown';
    try {
      if (pool) {
        const connection = await pool.getConnection();
        try {
          const [rows] = await connection.query('SELECT 1 as test');
          dbStatus = rows[0].test === 1 ? 'Connected' : 'Error';
        } finally {
          connection.release();
        }
      } else {
        dbStatus = 'No pool';
      }
    } catch (dbError) {
      dbStatus = 'Error: ' + dbError.message;
    }
    
    res.json({ 
      message: 'Profile API is working',
      authHeaderExists: !!req.headers.authorization,
      userId: userId,
      databaseStatus: dbStatus
    });
  } catch (error) {
    res.json({
      message: 'Profile API is working, but token validation failed',
      error: error.message
    });
  }
});

// Get user profile data
router.get('/user-data', tokenAuth, ensureDatabaseConnection, async (req, res) => {
  console.log('User data endpoint reached, user:', req.user);
  try {
    const userId = req.user.id;
    console.log('Looking up profile for userId:', userId);
    
    // First, log database tables to confirm structure
    let tables;
    try {
      [tables] = await pool.query('SHOW TABLES');
      console.log('Database tables:', tables.map(t => Object.values(t)[0]));
    } catch (error) {
      console.error('Error listing tables:', error);
      return res.status(500).json({ message: 'Error listing database tables: ' + error.message });
    }
    
    // Check if registrations table exists
    const registrationsTable = tables.find(t => Object.values(t)[0] === 'registrations');
    if (!registrationsTable) {
      console.error('registrations table not found in database');
      return res.status(500).json({ message: 'registrations table not found in database' });
    }
    
    // Then, log the structure of the registrations table
    let columns;
    try {
      [columns] = await pool.query('SHOW COLUMNS FROM registrations');
      console.log('Registrations table columns:', columns.map(c => c.Field));
    } catch (error) {
      console.error('Error getting table structure:', error);
      return res.status(500).json({ message: 'Error getting table structure: ' + error.message });
    }
    
    // Get user data with proper error handling
    let rows;
    try {
      [rows] = await pool.query(
        'SELECT * FROM registrations WHERE id = ?',
        [userId]
      );
      console.log('Query results found:', rows.length, 'rows');
      if (rows.length > 0) {
        console.log('Found user data, fields:', Object.keys(rows[0]));
      }
    } catch (error) {
      console.error('Database query error:', error.message);
      return res.status(500).json({ message: 'Database error: ' + error.message });
    }

    if (rows.length === 0) {
      console.log('No user found with ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    // Format birthDate for proper display
    if (rows[0].birthDate) {
      const date = new Date(rows[0].birthDate);
      rows[0].birthDate = date.toISOString().split('T')[0];
    }

    // Return all user data
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error while fetching profile: ' + error.message });
  }
});

// Update general profile info - support both PUT and POST methods
router.post('/update-general', tokenAuth, ensureDatabaseConnection, async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    
    // Validate input
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ message: 'First name, last name, and email are required' });
    }
    
    const userId = req.user.id;
    
    // Check if email is already in use by another user
    const [existingUsers] = await pool.query(
      'SELECT id FROM registrations WHERE email = ? AND id != ?',
      [email, userId]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email is already in use' });
    }
    
    await pool.query(
      'UPDATE registrations SET firstName = ?, lastName = ?, email = ? WHERE id = ?',
      [firstName, lastName, email, userId]
    );
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
});

// Update password
router.put('/password', tokenAuth, ensureDatabaseConnection, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All password fields are required' });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }
    
    const userId = req.user.id;
    
    // Get current password hash
    const [rows] = await pool.query(
      'SELECT newPassword FROM registrations WHERE id = ?',
      [userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Compare passwords
    const isMatch = await bcrypt.compare(currentPassword, rows[0].newPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password
    await pool.query(
      'UPDATE registrations SET newPassword = ? WHERE id = ?',
      [hashedPassword, userId]
    );
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Server error while updating password' });
  }
});

// Update profile info (bio, birthDate, etc.)
router.put('/info', tokenAuth, ensureDatabaseConnection, async (req, res) => {
  try {
    const { bio, birthDate, country, phone, address } = req.body;
    const userId = req.user.id;
    
    await pool.query(
      'UPDATE registrations SET bio = ?, birthDate = ?, country = ?, phone = ?, address = ? WHERE id = ?',
      [bio, birthDate, country, phone, address, userId]
    );
    
    res.json({ message: 'Profile info updated successfully' });
  } catch (error) {
    console.error('Error updating profile info:', error);
    res.status(500).json({ message: 'Server error while updating profile info' });
  }
});

// Update social links
router.put('/social', tokenAuth, ensureDatabaseConnection, async (req, res) => {
  try {
    const { twitter, facebook, instagram } = req.body;
    const userId = req.user.id;
    
    await pool.query(
      'UPDATE registrations SET twitter = ?, facebook = ?, instagram = ? WHERE id = ?',
      [twitter, facebook, instagram, userId]
    );
    
    res.json({ message: 'Social links updated successfully' });
  } catch (error) {
    console.error('Error updating social links:', error);
    res.status(500).json({ message: 'Server error while updating social links' });
  }
});

// Upload profile picture
router.post('/upload-photo', tokenAuth, upload.single('profilePicture'), ensureDatabaseConnection, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const userId = req.user.id;
    
    // Create the relative file path for the database and client using @uploads format
    const relativeFilePath = `/@uploads/${req.file.filename}`;
    console.log('Uploaded file:', req.file);
    console.log('Relative path for DB:', relativeFilePath);
    
    // Update profile picture path in database
    await pool.query(
      'UPDATE registrations SET profilePicture = ? WHERE id = ?',
      [relativeFilePath, userId]
    );
    
    // Return success with the path that the frontend can use
    res.json({ 
      message: 'Profile picture updated successfully',
      filePath: relativeFilePath
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ message: 'Server error while uploading profile picture: ' + error.message });
  }
});

// Get user order history
router.get('/orders', tokenAuth, ensureDatabaseConnection, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Getting orders for userId:', userId);
    
    // Debug: Check table structures
    console.log('Debug: Checking database tables...');
    const [tables] = await pool.query('SHOW TABLES');
    console.log('Available tables:', tables.map(t => Object.values(t)[0]));
    
    // Count orders for this user
    console.log('Debug: Counting orders for user...');
    const [orderCount] = await pool.query('SELECT COUNT(*) as count FROM orders WHERE user_id = ?', [userId]);
    console.log(`Found ${orderCount[0].count} orders for user ${userId}`);
    
    // Get all orders for this user - FIXED: Remove non-existent fields
    const orderQuery = `
      SELECT o.id, o.order_date, o.status, o.total_amount,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      WHERE o.user_id = ?
      ORDER BY o.order_date DESC
    `;
    
    let orders;
    try {
      [orders] = await pool.query(orderQuery, [userId]);
      console.log(`Found ${orders.length} orders for user ${userId} after check`);
      
      // Debug: show the raw orders data
      console.log('Raw orders data:', JSON.stringify(orders, null, 2));
    } catch (error) {
      console.error('Error querying orders:', error);
      return res.status(500).json({ message: 'Error querying orders: ' + error.message });
    }
    
    if (!orders || orders.length === 0) {
      console.log('No orders found for this user in the database.');
      return res.json([]); // Return empty array if no orders found
    }
    
    // For each order, get its items with product details
    const orderHistory = [];
    
    for (const order of orders) {
      try {
        console.log(`Fetching items for order ${order.id}, reported item count: ${order.item_count}`);
        
        // Join order_items with products to get product details - FIXED: Match actual field names
        const [items] = await pool.query(`
          SELECT 
            oi.product_id, 
            oi.quantity, 
            oi.price,
            p.name as product_name, 
            p.image as product_image,
            p.description as product_description,
            p.Category as product_category
          FROM order_items oi
          LEFT JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = ?
        `, [order.id]);
        
        console.log(`Found ${items.length} items for order ${order.id}`);
        
        // Debug: log the raw items data
        if (items.length > 0) {
          console.log('First item data:', JSON.stringify(items[0], null, 2));
        } else {
          console.log('No items found for this order - checking directly in order_items table');
          
          // Try a direct query without joins as a fallback
          const [directItems] = await pool.query(`
            SELECT * FROM order_items WHERE order_id = ?
          `, [order.id]);
          
          console.log(`Direct query found ${directItems.length} items for order ${order.id}`);
          if (directItems.length > 0) {
            console.log('First direct item:', JSON.stringify(directItems[0], null, 2));
          }
        }
        
        // Format the date for display
        const orderDate = new Date(order.order_date);
        const formattedDate = orderDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        
        // Calculate order total if it's not already in the database
        const orderTotal = order.total_amount || 
          items.reduce((sum, item) => sum + (parseFloat(item.price || 0) * (item.quantity || 1)), 0);
        
        // Build the order data with items
        const orderData = {
          id: order.id,
          order_date: formattedDate,
          status: order.status || 'pending',
          total_amount: parseFloat(orderTotal).toFixed(2),
          items: items.map(item => {
            // Fetch additional product info if needed - this handles cases where the JOIN didn't work
            if (!item.product_name && item.product_id) {
              console.log(`Product name missing for item with product_id ${item.product_id}, fetching directly`);
              // Note: this would normally be a direct DB query, but we'll skip for simplicity
            }
            
            return {
              product_id: item.product_id,
              product_name: item.product_name || `Product #${item.product_id}`,
              product_image: item.product_image || null,
              product_description: item.product_description || null,
              product_category: item.product_category || null,
              quantity: parseInt(item.quantity || 1),
              price: parseFloat(item.price || 0).toFixed(2),
              subtotal: parseFloat((item.price || 0) * (item.quantity || 1)).toFixed(2)
            };
          })
        };
        
        orderHistory.push(orderData);
      } catch (error) {
        console.error(`Error getting items for order ${order.id}:`, error);
        // Include the order even if we can't get items
        orderHistory.push({
          id: order.id,
          order_date: new Date(order.order_date).toLocaleDateString(),
          status: order.status || 'pending',
          total_amount: parseFloat(order.total_amount || 0).toFixed(2),
          items: []
        });
      }
    }
    
    console.log(`Returning ${orderHistory.length} orders with items`);
    console.log('First order data:', orderHistory.length > 0 ? JSON.stringify(orderHistory[0], null, 2) : 'No orders');
    
    // Count total number of items across all orders
    const totalItems = orderHistory.reduce((count, order) => {
      return count + (order.items?.length || 0);
    }, 0);
    console.log(`Total items across all orders: ${totalItems}`);
    
    res.json(orderHistory);
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ message: 'Server error while fetching order history: ' + error.message });
  }
});

// Add a debug endpoint to check profile pictures in the database
router.get('/debug-pictures', async (req, res) => {
  try {
    console.log('Debug pictures endpoint reached');
    
    // Query users with profile pictures
    const [users] = await pool.query(
      'SELECT id, CONCAT(firstName, " ", lastName) as name, profilePicture FROM registrations WHERE profilePicture IS NOT NULL'
    );
    
    console.log('Users with profile pictures:', users);
    
    res.json({
      message: 'Debug information for profile pictures',
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        profilePicture: user.profilePicture
      }))
    });
  } catch (error) {
    console.error('Error in debug-pictures endpoint:', error);
    res.status(500).json({ message: 'Error fetching debug information' });
  }
});

module.exports = router;
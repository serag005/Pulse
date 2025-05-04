// server.js - Main application server
const express = require('express');
const path    = require('path');
const router = express.Router();

const app  = express();
const PORT = process.env.PORT || 3019;

// 1) Parse JSON bodies
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Special diagnostics for order-related requests
app.use('/api/profile/orders', (req, res, next) => {
  console.log('🔍 Order history request received');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

// 2) Serve all front-end static files (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname)));

// Serve the @uploads directory from the backend.pulse folder for profile pictures
app.use('/@uploads', express.static(path.join(__dirname, 'backend.pulsee/backend.pulse/@uploads')));

// Also serve without the leading slash to handle path inconsistencies
app.use('@uploads', express.static(path.join(__dirname, 'backend.pulsee/backend.pulse/@uploads')));

// Add enhanced logging for profile picture requests
app.use(['/@uploads', '@uploads'], (req, res, next) => {
  console.log(`📸 Profile image accessed: ${req.url}`);
  console.log(`  Full path: ${path.join(__dirname, 'backend.pulsee/backend.pulse/@uploads', req.url)}`);
  console.log(`  File exists: ${require('fs').existsSync(path.join(__dirname, 'backend.pulsee/backend.pulse/@uploads', req.url)) ? 'Yes' : 'No'}`);
  next();
});

// Serve product images with proper caching
app.use('/images', express.static(path.join(__dirname, 'images'), {
  maxAge: '1d', // Cache for 1 day
  etag: true
}));

// Import required routers
const profileRouter = require('./backend.pulsee/backend.pulse/profile');

// Mount API routes
app.use('/api/products', require('./backend.pulsee/backend.pulse/products'));
app.use('/api/users', require('./backend.pulsee/backend.pulse/auth'));
app.use('/api/orders', require('./backend.pulsee/backend.pulse/orderRoutes'));
app.use('/api/profile', profileRouter);
app.use('/api/contact', require('./backend.pulsee/backend.pulse/contact'));
app.use('/api/checkout', require('./backend.pulsee/backend.pulse/checkout'));
app.use('/api/suppliers', require('./backend.pulsee/backend.pulse/suppliers'));
app.use('/api/register', require('./backend.pulsee/backend.pulse/regist'));
app.use('/api/auth', require('./backend.pulsee/backend.pulse/auth'));
app.use('/api/login', require('./backend.pulsee/backend.pulse/login'));
app.use('/api/volunteers', require('./backend.pulsee/backend.pulse/volunt'));
app.use('/api/cart', require('./backend.pulsee/backend.pulse/cartRoutes'));

// Special handler for JSON parse errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  next(err);
});

// Detailed error handling for API endpoints
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).send('Server Error: ' + (process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'));
});

// Handle GET requests for product routes
router.get('/', (req, res) => {
  try {
    console.log('GET /api/products - Fetching all products');
    
    // Check if database connection exists
    if (!global.db) {
      console.error('Database connection not available');
      return res.status(500).json({ error: 'Database connection not available' });
    }
    
    // Log the query we're about to execute
    console.log('Executing query: SELECT * FROM products');
    
    global.db.query('SELECT * FROM products', (err, results) => {
      if (err) {
        console.error('Error fetching products:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      
      console.log(`Query successful, found ${results.length} products`);
      res.json(results);
    });
  } catch (error) {
    console.error('Unexpected error in products route:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Handle all other routes - serve the main index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
  console.log(`Profile API available at: http://localhost:${PORT}/api/profile`);
  console.log(`Profile Order History API: http://localhost:${PORT}/api/profile/orders`);
  console.log(`Profile Images Path: http://localhost:${PORT}/@uploads/`);
});


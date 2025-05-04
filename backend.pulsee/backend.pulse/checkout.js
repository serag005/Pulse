// checkout.js
const express = require('express');
const cors    = require('cors');
const mysql   = require('mysql2');
const axios   = require('axios').default;
// const { validatePhoneNumber, validateEmail } = require('../../JS/validators');
// const { applyCoupon } = require('./couponService');
// const { saveOrder }     = require('./orderService');

const router = express.Router();

// Enable CORS and JSON parsing
router.use(cors());
router.use(express.json());
router.use(express.urlencoded({ extended: false }));

// MySQL connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '4420041234@a',
  database: 'prosthetics'
});

connection.connect(err => {
  if (err) console.error('❌ Checkout DB connection failed:', err);
  else     console.log('✅ Connected to MySQL in checkout.js');
});

// Serve checkout page HTML if you still need to
// (But static-serving should live in your main server.js)
router.get('/page', (req, res) => {
  // Adjust path as needed relative to your server.js static root
  res.sendFile(path.join(__dirname, '..', 'public', 'checkout.html'));
});

// Validate coupon
router.post('/validate-coupon', (req, res) => {
  const { couponCode, subtotal } = req.body;
  if (!couponCode || !subtotal) {
    return res.status(400).json({ success: false, message: 'Coupon code and subtotal are required' });
  }
  const result = applyCoupon(couponCode, parseFloat(subtotal));
  res.json(result);
});

// Place order - forwards to the orders API
router.post('/', async (req, res) => {
  try {
    console.log('Checkout request received:', req.body);
    
    const {
      items,
      totalPrice,
      countItems,
      email,
      name,
      address,
      phone,
      couponCode
    } = req.body;

    if (!email || !name || !address || !phone || !items) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    // Basic validation
    if (!Array.isArray(JSON.parse(items)) || JSON.parse(items).length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Forward to the orders API with our authentication token
    const token = req.headers.authorization;
    
    try {
      // Get user ID from database
      const [users] = await connection.promise().query(
        'SELECT id FROM users WHERE email = ? LIMIT 1',
        [email]
      );
      
      let userId = users.length > 0 ? users[0].id : 6; // Default to user ID 6 if not found
      
      console.log(`Found user ID ${userId} for email ${email}`);
      
      // Prepare order data for orders API
      const orderData = {
        items: JSON.parse(items),
        totalAmount: parseFloat(totalPrice || 0),
        count_items: parseInt(countItems || 0),
        shipping_address: address,
        phone,
        email,
        name,
        user_id: userId,
        status: 'pending',
        couponCode: couponCode || null
      };
      
      console.log('Forwarding order to orders API:', orderData);
      
      // Make an internal request to the orders API
      // You would typically use axios or node-fetch for this
      // For simplicity, we're directly importing and using the order creation logic
      
      // Send a direct request to the orders endpoint
      const ordersEndpoint = 'http://localhost:3019/api/orders';
      
      const response = await axios.post(ordersEndpoint, orderData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || `Bearer dummy-token-for-user-${userId}`
        }
      });
      
      console.log('Orders API response:', response.data);
      
      res.status(201).json({
        success: true,
        message: 'Order placed successfully',
        orderId: response.data.orderId
      });
    } catch (forwardError) {
      console.error('Error forwarding to orders API:', forwardError);
      res.status(500).json({
        success: false,
        message: 'Failed to create order',
        error: forwardError.message
      });
    }
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while processing your order' });
  }
});


module.exports = router;

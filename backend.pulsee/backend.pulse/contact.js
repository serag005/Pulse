/* This code snippet is a JavaScript file named `contact.js` that has been converted into an Express
Router module. It sets up a route to handle POST requests for a contact form submission. Here's a
breakdown of what the code does: */
// contact.js
// Converted to Express Router module

const express = require('express');
const cors    = require('cors');
const mysql   = require('mysql2');

const router = express.Router();

// Enable CORS and JSON parsing for this router
router.use(cors());
router.use(express.json());

// Create MySQL connection for contact messages
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '4420041234@a',
  database: 'prosthetics'
});

connection.connect(err => {
  if (err) {
    console.error('❌ Contact DB connection failed:', err);
  } else {
    console.log('✅ Connected to MySQL for contact.js');
  }
});

// POST /api/contact - This route will be mounted at /api/contact in the main server file
router.post('/', (req, res) => {
  const { name, email, message } = req.body;

  // Validate required fields
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required!' });
  }

  const query = `
    INSERT INTO contact_messages (name, email, message)
    VALUES (?, ?, ?)
  `;

  connection.query(query, [name, email, message], (err, results) => {
    if (err) {
      console.error('❌ Error inserting message:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    console.log('✅ Message saved to DB.');
    res.status(200).json({ success: true, message: 'Message received successfully!' });
  });
});

// Export the router to be mounted in server.js
module.exports = router;

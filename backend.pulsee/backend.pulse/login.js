// login.js - Login router module

const express = require('express');
const mysql   = require('mysql2');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');

const router = express.Router();

// Use the same JWT secret as in orderRoutes.js
const JWT_SECRET = 'your_hardcoded_secret_here';

// Create MySQL connection (local to this module)
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '4420041234@a',
    database: 'prosthetics'
});
connection.connect(err => {
    if (err) {
        console.error('❌ Database connection failed in login.js:', err);
    } else {
        console.log('✅ Connected to MySQL in login.js');
    }
});

// Login endpoint
// Expecting POST /api/login with { email?, phone?, password }
router.post('/', (req, res) => {
    const { email, phone, password } = req.body;

    // Validate input
    if ((!email && !phone) || !password) {
        return res.status(400).json({ error: 'Email or phone and password are required!' });
    }

    // Build query against 'registrations' table (where we stored credentials)
    let query = '';
    let values = [];
    if (email) {
        query = 'SELECT id, firstName, lastName, email, phone, newPassword FROM registrations WHERE email = ?';
        values = [email];
    } else {
        query = 'SELECT id, firstName, lastName, email, phone, newPassword FROM registrations WHERE phone = ?';
        values = [phone];
    }

    connection.query(query, values, (err, results) => {
        if (err) {
            console.error('❌ Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid email/phone or password' });
        }

        const user = results[0];
        // Compare provided password with hashed password in newPassword column
        bcrypt.compare(password, user.newPassword, (hashErr, isMatch) => {
            if (hashErr) {
                console.error('❌ Error comparing passwords:', hashErr);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid email/phone or password' });
            }

            // Generate a JWT token for authenticated user
            const token = jwt.sign(
                { id: user.id, email: user.email }, 
                JWT_SECRET, 
                { expiresIn: '24h' }
            );

            // Success
            return res.status(200).json({
                success: true,
                message: 'Login successful!',
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                    token: token  // Include token in response
                }
            });
        });
    });
});

module.exports = router;

// suppliers.js
// Converted to Express Router module

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// CORS options for suppliers routes
const corsOptions = {
    origin: ['http://localhost:3019', 'http://127.0.0.1:3019', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

// Enable CORS for this router
router.use(cors(corsOptions));

// Add specific CORS headers to handle preflight
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
});

// Database connection (shared via global or imported db in server)
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '4420041234@a',
    database: 'prosthetics'
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Database connection error:', err);
        return;
    }
    console.log('✅ Connected to database (suppliers.js).');
    
    // Create the suppliers table if it doesn't exist
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS suppliers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            location VARCHAR(255),
            password VARCHAR(255) NOT NULL,
            sponsorshipTypes TEXT,
            otherSponsorship TEXT,
            collaboration TEXT,
            visibility VARCHAR(50),
            proposalFile VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    connection.query(createTableQuery, (err, result) => {
        if (err) {
            console.error('❌ Error creating suppliers table:', err);
            return;
        }
        console.log('✅ Suppliers table ready');
        
        // Describe the table to verify structure
        connection.query('DESCRIBE suppliers', (err, result) => {
            if (err) {
                console.error('❌ Error describing table:', err);
                return;
            }
            console.log('📊 Suppliers table structure:');
            console.table(result.map(col => ({ Field: col.Field, Type: col.Type })));
        });
    });
});

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = './uploads/';
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// POST /suppliers/register
router.post('/register', upload.single('proposal'), (req, res) => {
    const form = req.body;
    console.log("📥 Form data:", form);
    console.log("📎 Uploaded file:", req.file);

    if (!form.companyName || !form.email || !form.phone || !form.location || !form.newPassword || !form.collaboration || !form.visibility) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    const {
        companyName,
        email,
        phone,
        location,
        newPassword,
        collaboration,
        visibility
    } = form;

    let sponsorshipTypes = null;
    if (form.sponsorshipTypes) {
        try {
            const parsed = JSON.parse(form.sponsorshipTypes);
            sponsorshipTypes = JSON.stringify(parsed);
        } catch (err) {
            sponsorshipTypes = JSON.stringify(form.sponsorshipTypes.split(',').map(s => s.trim()));
        }
    }

    // Get selected sponsorship types from tags
    if (!sponsorshipTypes) {
        // If no sponsorshipTypes parsed from form data, check for selected tags
        const allTags = ['Financial Support', 'Product Supply', 'Technical Resources', 'Other'];
        const selectedTags = [];
        
        allTags.forEach(tag => {
            if (form[`tag-${tag.replace(/\s+/g, '-').toLowerCase()}`] === 'selected') {
                selectedTags.push(tag);
            }
        });
        
        if (selectedTags.length > 0) {
            sponsorshipTypes = JSON.stringify(selectedTags);
        }
    }

    const otherSponsorshipType = form['other-sponsorship-input'] || null;
    const proposalFile = req.file ? req.file.filename : null;

    const query = `
        INSERT INTO suppliers
        (name, email, phone, location, password, sponsorshipTypes, otherSponsorship, collaboration, visibility, proposalFile)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        companyName,
        email,
        phone,
        location,
        newPassword,
        sponsorshipTypes,
        otherSponsorshipType,
        collaboration,
        visibility,
        proposalFile
    ];

    connection.query(query, values, (err, results) => {
        if (err) {
            console.error('❌ Error inserting into DB:', err);
            return res.status(500).json({ message: "Database error.", error: err.sqlMessage });
        }
        console.log("✅ Registration successful.");
        res.status(200).json({ message: "Registration successful." });
    });
});

// Add test endpoint for connectivity check
router.get('/test', (req, res) => {
    res.json({ status: 'success', message: 'Supplier router is running properly!' });
});

module.exports = router;

// volunt.js
// Converted to Express Router module for volunteer submissions

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const router = express.Router();

// Debug output at module load time
console.log('🔄 Initializing volunteer routes module...');

// CORS options for volunteers routes
const corsOptions = {
    origin: ['http://localhost:3019', 'http://127.0.0.1:3019', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

// Enable CORS and body parsing for this router
router.use(cors(corsOptions));
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

// Request logger specific to volunteer routes
router.use((req, res, next) => {
    console.log(`📝 VOLUNTEER ROUTE: ${req.method} ${req.originalUrl}`);
    next();
});

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

// MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '4420041234@a',
    database: 'prosthetics'
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Failed to connect to the database:', err);
        return;
    }
    console.log('✅ Successfully connected to the database (volunt.js)');
    
    // Create the volunteers table if it doesn't exist
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS volunteers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(255) NOT NULL,
            age INT,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            location VARCHAR(255),
            password VARCHAR(255) NOT NULL,
            availability VARCHAR(100),
            volunteering_area TEXT,
            previous_experience VARCHAR(10),
            experience_details TEXT,
            languages TEXT,
            other_volunteering TEXT,
            other_language TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    connection.query(createTableQuery, (err, result) => {
        if (err) {
            console.error('❌ Error creating volunteers table:', err);
            return;
        }
        console.log('✅ Volunteers table ready');
        
        // Describe the table to verify structure
        connection.query('DESCRIBE volunteers', (err, result) => {
            if (err) {
                console.error('❌ Error describing table:', err);
                return;
            }
            console.log('📊 Volunteers table structure:');
            console.table(result.map(col => ({ Field: col.Field, Type: col.Type })));
        });
    });
});

// Test endpoint to verify router is working
router.get('/test', (req, res) => {
    console.log('🧪 Volunteer test endpoint hit');
    res.json({ status: 'success', message: 'Volunteer router is running properly!' });
});

// Handle volunteer form submission - main route 
router.post('/', (req, res) => {
    console.log('📥 Received volunteer POST request at: ' + new Date().toISOString());
    console.log('📄 Request headers:', req.headers);
    
    // Ensure content type is set
    res.setHeader('Content-Type', 'application/json');
    
    // Debug the request body - safely stringify with a replacer to handle circular references
    const safeStringify = (obj, indent = 2) => {
        const seen = new WeakSet();
        return JSON.stringify(obj, (key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) {
                    return '[Circular]';
                }
                seen.add(value);
            }
            return value;
        }, indent);
    };
    
    try {
        console.log('📦 Request body:', safeStringify(req.body));
    } catch (e) {
        console.log('📦 Request body: [Could not stringify]');
    }
    
    // Check if body is empty
    if (!req.body || Object.keys(req.body).length === 0) {
        console.error('❌ Empty request body received');
        return res.status(400).json({
            error: 'Invalid request',
            details: 'Empty request body'
        });
    }

    try {
        // First, check if the volunteers table exists and get its structure
        connection.query('DESCRIBE volunteers', (err, tableInfo) => {
            if (err) {
                console.error('❌ Error accessing volunteers table:', err);
                return res.status(500).json({ 
                    error: 'Database table error', 
                    details: 'Could not access volunteers table: ' + err.message 
                });
            }
            
            console.log('✓ Volunteers table structure:', tableInfo);
            
            // Extract column names
            const columns = tableInfo.map(col => col.Field);
            console.log('📋 Available columns:', columns);
            
            // Now proceed with the insert
            const {
                fullName,
                age,
                email,
                phone,
                location,
                password,
                availability,
                volunteeringAreas,
                previousExperience,
                experienceDetails,
                languages,
                otherVolunteering,
                otherLanguage
            } = req.body;

            // Log received data for debugging
            console.log('📋 Volunteer data received:', {
                fullName, 
                age, 
                email, 
                phone, 
                location,
                availability, 
                areas: volunteeringAreas, 
                languages
            });
            
            // Validate required fields
            if (!fullName || !email || !phone || !password || !availability) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    details: 'Please fill in all required fields'
                });
            }

            const areasString = Array.isArray(volunteeringAreas)
                ? JSON.stringify(volunteeringAreas)
                : volunteeringAreas;

            const languagesString = Array.isArray(languages)
                ? JSON.stringify(languages)
                : languages;

            console.log('📋 Processed data:', {
                fullName, age, email, phone, location,
                availability, areas: areasString, languages: languagesString
            });

            // Build query based on available columns
            let fields = [];
            let placeholders = [];
            let values = [];
            
            // Map form data to database columns
            const fieldMapping = {
                'full_name': fullName,
                'age': age,
                'email': email,
                'phone': phone,
                'location': location,
                'password': password,
                'availability': availability,
                'volunteering_area': areasString,
                'previous_experience': previousExperience,
                'experience_details': experienceDetails || null,
                'languages': languagesString,
                'other_volunteering': otherVolunteering || null,
                'other_language': otherLanguage || null
            };
            
            // Only include fields that exist in the table
            columns.forEach(column => {
                if (column in fieldMapping) {
                    fields.push(column);
                    placeholders.push('?');
                    values.push(fieldMapping[column]);
                }
            });
            
            // Construct the dynamic query
            const query = `
                INSERT INTO volunteers (${fields.join(', ')})
                VALUES (${placeholders.join(', ')})
            `;
            
            console.log('🔍 Final SQL Query:', query);
            console.log('🔢 Query Values:', values);

            connection.query(query, values, (err, result) => {
                if (err) {
                    console.error('❌ DB Error:', err);
                    console.error('❌ SQL State:', err.sqlState);
                    console.error('❌ SQL Message:', err.sqlMessage);
                    console.error('❌ SQL Code:', err.code);
                    return res.status(500).json({ 
                        error: 'Database error', 
                        details: err.message 
                    });
                }
                console.log('✅ Data inserted successfully! ID:', result.insertId);
                return res.status(200).json({
                    success: true,
                    message: 'Volunteer data successfully inserted!',
                    id: result.insertId
                });
            });
        });
    } catch (error) {
        console.error('❌ Server Error:', error);
        return res.status(500).json({ 
            error: 'Server error', 
            details: error.message 
        });
    }
});

// Add a POST handler at the root path as well, just to be safe
router.post('/register', (req, res) => {
    console.log('⚠️ POST to /volunteers/register received - redirecting to root handler');
    // Just call the main route handler
    router.handle(req, res);
});

// Log all routes
console.log('🔄 Volunteer routes initialized:');
router.stack.forEach((r) => {
    if (r.route && r.route.path) {
        console.log(`✅ ${Object.keys(r.route.methods)[0].toUpperCase()} /volunteers${r.route.path}`);
    }
});

module.exports = router;
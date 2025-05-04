// regist.js – Registration router module

const express  = require('express');
const router   = express.Router();
const mysql    = require('mysql2');
const multer   = require('multer');
const path     = require('path');
const bcrypt   = require('bcrypt');
const fs       = require('fs');

// ——— MySQL connection ———
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '4420041234@a',
  database: 'prosthetics'
});
connection.connect(err => {
  if (err) {
    console.error('❌ Database connection failed in regist.js:', err);
  } else {
    console.log('✅ Connected to MySQL in regist.js');
  }
});

// Setup upload directory for profile pictures
const uploadsDir = path.join(__dirname, '@uploads');
// Create directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ——— Multer setup for @uploads directory ———
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
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed.'));
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 800 * 1024 // 800KB max size
  }
});

// Make the uploaded files directory publicly accessible
router.use(
  '/@uploads',
  express.static(path.join(__dirname, '@uploads'))
);

// Log every incoming request for debugging
router.use((req, res, next) => {
  console.log(`${req.method} ${req.baseUrl}${req.url}`);
  next();
});

// ——— Registration endpoint ———
// Mounted at POST /api/register/
router.post('/', upload.single('profilePicture'), (req, res) => {
  const {
    firstName, lastName, email, phone, address,
    birthDate, newPassword, gender,
    hearAboutUs, otherSource, bio, termsAccepted
  } = req.body;

  // Update profile picture path to use the @uploads format
  let profilePicture = null;
  if (req.file) {
    profilePicture = `/@uploads/${req.file.filename}`;
    console.log('Profile picture saved at:', profilePicture);
  }

  console.log('📥 Registration data:', req.body);

  // Hash the password
  bcrypt.hash(newPassword, 10, (hashErr, hashedPassword) => {
    if (hashErr) {
      console.error('❌ Error hashing password:', hashErr);
      return res.status(500).json({ error: 'Error hashing password' });
    }

    // 1) Insert into registrations table
    const regQuery = `
      INSERT INTO registrations
        (firstName, lastName, email, phone, address, birthDate,
         newPassword, gender, profilePicture,
         hearAboutUs, otherSource, bio, termsAccepted)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    `;
    const regValues = [
      firstName, lastName, email, phone, address, birthDate,
      hashedPassword, // store the hashed version, not plaintext
      gender, profilePicture,
      hearAboutUs, otherSource, bio,
      termsAccepted ? 1 : 0    // ensure tinyint(1) gets 0/1
    ];

    connection.query(regQuery, regValues, (regErr, regResult) => {
      if (regErr) {
        console.error('❌ Error inserting into registrations:', regErr);
        return res.status(500).json({
          error: regErr.sqlMessage,
          query: regQuery,
          values: regValues
        });
      }

      console.log('✅ Registration record ID:', regResult.insertId);
      return res.status(200).json({
        message: 'Registration data saved successfully!',
        id: regResult.insertId
      });
    });
  });
});

module.exports = router;

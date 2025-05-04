const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

// Function to get products from JSON file as fallback
function getProductsFromJson() {
    try {
        const productsPath = path.join(__dirname, '..', '..', 'products.json');
        console.log('Reading products from:', productsPath);
        const productsData = fs.readFileSync(productsPath, 'utf8');
        return JSON.parse(productsData);
    } catch (error) {
        console.error('Error reading products.json:', error);
        return [];
    }
}

// Create connection for product routes
let db;

// Initialize database connection
function initDatabase() {
    if (!db) {
        db = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '4420041234@a',
            database: 'prosthetics'
        });
        
        db.connect(err => {
            if (err) {
                console.error('❌ Error connecting to MySQL in product.js:', err);
                return;
            }
            console.log('✅ Connected to MySQL in product.js');
        });
    }
    return db;
}

// Initialize database connection when routes are loaded
initDatabase();

// GET all products
router.get('/', (req, res) => {
    try {
        console.log('GET /api/products - Fetching all products');
        
        db.query('SELECT * FROM products', (err, results) => {
            if (err) {
                console.error('Error fetching products from database:', err);
                // Fall back to JSON file
                const jsonProducts = getProductsFromJson();
                console.log(`Falling back to JSON file, found ${jsonProducts.length} products`);
                return res.json(jsonProducts);
            }
            
            if (!results || results.length === 0) {
                console.log('No products found in database, falling back to JSON file');
                const jsonProducts = getProductsFromJson();
                return res.json(jsonProducts);
            }
            
            console.log(`Found ${results.length} products in database`);
            res.json(results);
        });
    } catch (error) {
        console.error('Server error in GET /products:', error);
        // Fall back to JSON file
        const jsonProducts = getProductsFromJson();
        res.json(jsonProducts);
    }
});

// GET products by category
router.get('/category/:Category', (req, res) => {
    try {
        const categoryName = req.params.Category;
        console.log(`GET /api/products/category/${categoryName} - Fetching products by category`);
        
        // Make the query case-insensitive and also check the misspelled 'catetory' field
        db.query(
            'SELECT * FROM products WHERE LOWER(`Category`) = LOWER(?) OR LOWER(`catetory`) = LOWER(?)', 
            [categoryName, categoryName], 
            (err, results) => {
                if (err) {
                    console.error('Error fetching products by category from database:', err);
                    // Fall back to JSON file
                    const allProducts = getProductsFromJson();
                    const filteredProducts = allProducts.filter(product => {
                        const cat = product.Category || product.catetory || '';
                        return cat.toLowerCase() === categoryName.toLowerCase();
                    });
                    console.log(`Falling back to JSON file, found ${filteredProducts.length} products for category ${categoryName}`);
                    return res.json(filteredProducts);
                }
                
                if (!results || results.length === 0) {
                    console.log(`No products found in database for category ${categoryName}, falling back to JSON file`);
                    const allProducts = getProductsFromJson();
                    const filteredProducts = allProducts.filter(product => {
                        const cat = product.Category || product.catetory || '';
                        return cat.toLowerCase() === categoryName.toLowerCase();
                    });
                    console.log(`Found ${filteredProducts.length} products in JSON file for category ${categoryName}`);
                    return res.json(filteredProducts);
                }
                
                console.log(`Found ${results.length} products for category ${categoryName} in database`);
                res.json(results);
            }
        );
    } catch (error) {
        console.error('Server error in GET /products/category:', error);
        // Fall back to JSON file
        const allProducts = getProductsFromJson();
        const categoryName = req.params.Category;
        const filteredProducts = allProducts.filter(product => {
            const cat = product.Category || product.catetory || '';
            return cat.toLowerCase() === categoryName.toLowerCase();
        });
        res.json(filteredProducts);
    }
});

// Search products
router.get('/search', (req, res) => {
    try {
        const query = req.query.q || req.query.term || '';
        db.query('SELECT * FROM products WHERE name LIKE ? OR description LIKE ?', 
            [`%${query}%`, `%${query}%`], (err, results) => {
                if (err) {
                    console.error('Error searching products:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json(results);
            });
    } catch (error) {
        console.error('Server error in GET /products/search:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add to cart
router.post('/cart/add', (req, res) => {
    try {
        const { userId, productId, quantity } = req.body;
        if (!userId || !productId || !quantity) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        db.query(
            `INSERT INTO order_items (user_id, product_id, quantity, price)
            VALUES (?, ?, ?, (SELECT price FROM products WHERE id = ?))
            ON DUPLICATE KEY UPDATE
              quantity = quantity + VALUES(quantity)`,
           [userId, productId, quantity, productId],
            (err, results) => {
                if (err) {
                    console.error('Error adding to cart:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json({ message: 'Product added to cart', results });
            }
        );
    } catch (error) {
        console.error('Server error in POST /products/cart/add:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get cart items for user
router.get('/cart/:userId', (req, res) => {
    try {
        const userId = req.params.userId;
        db.query(
            `SELECT oi.product_id    AS id,
                    p.name,
                    p.description,
                    oi.quantity,
                    oi.price,
                    p.image
             FROM order_items oi
             JOIN products p
               ON oi.product_id = p.id
             WHERE oi.user_id = ?`,
            [userId],
            (err, results) => {
                if (err) {
                    console.error('Error fetching cart:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json(results);
            }
        );
    } catch (error) {
        console.error('Server error in GET /products/cart/:userId:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update cart item quantity
router.put('/cart/:userId/:productId', (req, res) => {
    try {
        const { userId, productId } = req.params;
        const { quantity } = req.body;
        
        db.query(
            `UPDATE order_items
             SET quantity = ?
             WHERE user_id = ? AND product_id = ?`,
            [quantity, userId, productId],
            (err, results) => {
                if (err) {
                    console.error('Error updating cart:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json({ message: 'Cart updated', results });
            }
        );
    } catch (error) {
        console.error('Server error in PUT /products/cart/:userId/:productId:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Remove item from cart
router.delete('/cart/:userId/:productId', (req, res) => {
    try {
        const { userId, productId } = req.params;
        
        db.query(
            `DELETE FROM order_items
             WHERE user_id = ? AND product_id = ?`,
            [userId, productId],
            (err, results) => {
                if (err) {
                    console.error('Error removing from cart:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json({ message: 'Item removed from cart', results });
            }
        );
    } catch (error) {
        console.error('Server error in DELETE /products/cart/:userId/:productId:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
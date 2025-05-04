const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

// Create connection
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
                console.error('❌ Error connecting to MySQL in cartRoutes.js:', err);
                return;
            }
            console.log('✅ Connected to MySQL in cartRoutes.js');
        });
    }
    return db;
}

// Initialize database connection when routes are loaded
initDatabase();

// Get cart items for a user
router.get('/:userId', (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Validate user ID
        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        
        db.query(
            `SELECT oi.id AS cart_items_id,
                    oi.product_id,
                    p.name,
                    p.description,
                    oi.quantity,
                    oi.price,
                    p.image,
                    (oi.quantity * oi.price) AS total_price
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             WHERE oi.user_id = ? AND oi.order_id IS NULL`,
            [userId],
            (err, results) => {
                if (err) {
                    console.error('Error fetching cart items:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json(results);
            }
        );
    } catch (error) {
        console.error('Server error in GET /cart/:userId:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Sync cart (add/update multiple items at once)
router.post('/sync/:userId', (req, res) => {
    try {
        const userId = req.params.userId;
        const { items } = req.body;
        
        // Validate inputs
        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Invalid cart items' });
        }
        
        // Begin transaction
        db.beginTransaction(err => {
            if (err) {
                console.error('Error starting transaction:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            // First clear existing cart items
            db.query(
                'DELETE FROM order_items WHERE user_id = ? AND order_id IS NULL',
                [userId],
                (err) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error clearing cart:', err);
                            res.status(500).json({ error: 'Database error' });
                        });
                    }
                    
                    // Prepare batch insert values
                    const values = items.map(item => [
                        null, // order_id is NULL for cart items
                        item.id, // product_id
                        item.quantity,
                        item.price,
                        userId
                    ]);
                    
                    // Insert all new cart items
                    db.query(
                        `INSERT INTO order_items 
                        (order_id, product_id, quantity, price, user_id) 
                        VALUES ?`,
                        [values],
                        (err, results) => {
                            if (err) {
                                return db.rollback(() => {
                                    console.error('Error inserting cart items:', err);
                                    res.status(500).json({ error: 'Database error' });
                                });
                            }
                            
                            // Commit transaction
                            db.commit(err => {
                                if (err) {
                                    return db.rollback(() => {
                                        console.error('Error committing transaction:', err);
                                        res.status(500).json({ error: 'Database error' });
                                    });
                                }
                                
                                res.json({ 
                                    success: true, 
                                    message: 'Cart synced successfully',
                                    affectedRows: results.affectedRows
                                });
                            });
                        }
                    );
                }
            );
        });
    } catch (error) {
        console.error('Server error in POST /cart/sync/:userId:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add item to cart
router.post('/add/:userId', (req, res) => {
    try {
        const userId = req.params.userId;
        const { productId, quantity, price } = req.body;
        
        // Validate inputs
        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        
        if (!productId || !quantity || !price) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // First check if item already exists in cart
        db.query(
            `SELECT id, quantity FROM order_items 
             WHERE user_id = ? AND product_id = ? AND order_id IS NULL`,
            [userId, productId],
            (err, results) => {
                if (err) {
                    console.error('Error checking existing cart item:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                
                if (results.length > 0) {
                    // Update existing cart item
                    const newQuantity = results[0].quantity + parseInt(quantity);
                    
                    db.query(
                        `UPDATE order_items 
                         SET quantity = ? 
                         WHERE id = ?`,
                        [newQuantity, results[0].id],
                        (err, updateResult) => {
                            if (err) {
                                console.error('Error updating cart item:', err);
                                return res.status(500).json({ error: 'Database error' });
                            }
                            
                            res.json({ 
                                success: true, 
                                message: 'Item quantity updated in cart',
                                itemId: results[0].id,
                                newQuantity
                            });
                        }
                    );
                } else {
                    // Insert new cart item
                    db.query(
                        `INSERT INTO order_items 
                         (order_id, product_id, quantity, price, user_id)
                         VALUES (NULL, ?, ?, ?, ?)`,
                        [productId, quantity, price, userId],
                        (err, insertResult) => {
                            if (err) {
                                console.error('Error inserting cart item:', err);
                                return res.status(500).json({ error: 'Database error' });
                            }
                            
                            res.json({ 
                                success: true, 
                                message: 'Item added to cart',
                                itemId: insertResult.insertId
                            });
                        }
                    );
                }
            }
        );
    } catch (error) {
        console.error('Server error in POST /cart/add/:userId:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update cart item quantity
router.put('/update/:userId/:itemId', (req, res) => {
    try {
        const userId = req.params.userId;
        const itemId = req.params.itemId;
        const { quantity } = req.body;
        
        // Validate inputs
        if (!userId || isNaN(parseInt(userId)) || !itemId || isNaN(parseInt(itemId))) {
            return res.status(400).json({ error: 'Invalid parameters' });
        }
        
        if (!quantity || quantity < 1) {
            return res.status(400).json({ error: 'Invalid quantity' });
        }
        
        db.query(
            `UPDATE order_items 
             SET quantity = ? 
             WHERE id = ? AND user_id = ? AND order_id IS NULL`,
            [quantity, itemId, userId],
            (err, results) => {
                if (err) {
                    console.error('Error updating cart item:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                
                if (results.affectedRows === 0) {
                    return res.status(404).json({ error: 'Cart item not found' });
                }
                
                res.json({ 
                    success: true, 
                    message: 'Cart item updated',
                    affectedRows: results.affectedRows
                });
            }
        );
    } catch (error) {
        console.error('Server error in PUT /cart/update/:userId/:itemId:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Remove item from cart
router.delete('/remove/:userId/:itemId', (req, res) => {
    try {
        const userId = req.params.userId;
        const itemId = req.params.itemId;
        
        // Validate inputs
        if (!userId || isNaN(parseInt(userId)) || !itemId || isNaN(parseInt(itemId))) {
            return res.status(400).json({ error: 'Invalid parameters' });
        }
        
        db.query(
            `DELETE FROM order_items 
             WHERE id = ? AND user_id = ? AND order_id IS NULL`,
            [itemId, userId],
            (err, results) => {
                if (err) {
                    console.error('Error removing cart item:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                
                if (results.affectedRows === 0) {
                    return res.status(404).json({ error: 'Cart item not found' });
                }
                
                res.json({ 
                    success: true, 
                    message: 'Item removed from cart',
                    affectedRows: results.affectedRows
                });
            }
        );
    } catch (error) {
        console.error('Server error in DELETE /cart/remove/:userId/:itemId:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Clear cart
router.delete('/clear/:userId', (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Validate user ID
        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        
        db.query(
            'DELETE FROM order_items WHERE user_id = ? AND order_id IS NULL',
            [userId],
            (err, results) => {
                if (err) {
                    console.error('Error clearing cart:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                
                res.json({ 
                    success: true, 
                    message: 'Cart cleared',
                    affectedRows: results.affectedRows
                });
            }
        );
    } catch (error) {
        console.error('Server error in DELETE /cart/clear/:userId:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
/**
 * cartSync.js - Handles synchronization between localStorage cart and database cart
 */

// Global variables
let syncInProgress = false;
let cartSyncTimer = null;
const SYNC_DELAY = 2000; // 2 seconds delay between cart changes and sync

/**
 * Check if the user is logged in
 * @returns {Object|null} User object if logged in, null otherwise
 */
function getCurrentUser() {
    try {
        const userString = localStorage.getItem('user');
        if (!userString) return null;
        
        const user = JSON.parse(userString);
        return user && user.id ? user : null;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

/**
 * Get user ID if available
 * @returns {number|null} User ID if logged in, null otherwise
 */
function getUserId() {
    const user = getCurrentUser();
    return user ? user.id : null;
}

/**
 * Check if cart sync is enabled (user is logged in)
 * @returns {boolean} True if user is logged in and cart sync should be enabled
 */
function isCartSyncEnabled() {
    return !!getUserId();
}

/**
 * Load cart items from the server and update localStorage
 * @returns {Promise} Promise that resolves when cart is loaded
 */
async function loadCartFromServer() {
    const userId = getUserId();
    if (!userId) return Promise.resolve([]);
    
    try {
        const response = await fetch(`/api/cart/${userId}`);
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const items = await response.json();
        
        // Format server response to match localStorage cart format
        const formattedItems = items.map(item => ({
            id: item.product_id,
            name: item.name,
            description: item.description,
            price: parseFloat(item.price),
            image: item.image,
            quantity: item.quantity,
            cart_item_id: item.cart_item_id  // Store the server-side item ID
        }));
        
        // Update localStorage
        localStorage.setItem('cart', JSON.stringify(formattedItems));
        
        // Update UI if relevant functions exist
        if (typeof updateCart === 'function') {
            updateCart();
        }
        
        if (typeof updateCounts === 'function') {
            updateCounts();
        }
        
        return formattedItems;
    } catch (error) {
        console.error('Error loading cart from server:', error);
        return [];
    }
}

/**
 * Push all cart items to the server
 * @param {Array} items Cart items to push to server
 * @returns {Promise} Promise that resolves when cart is synced
 */
async function pushCartToServer(items) {
    const userId = getUserId();
    if (!userId) return Promise.resolve(false);
    
    try {
        const response = await fetch(`/api/cart/sync/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ items })
        });
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Error pushing cart to server:', error);
        return false;
    }
}

/**
 * Add a product to the cart with server sync
 * @param {Object} product Product to add to cart
 * @returns {Promise} Promise that resolves when item is added to cart
 */
async function addToCartWithSync(product) {
    // First update localStorage to maintain responsive UI
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItemIndex = cart.findIndex(item => item.id == product.id);
    
    // Make sure we store the image whether it's in "image" or "img" property
    const productWithImage = {
        ...product, 
        image: product.image || product.img,
        img: product.img || product.image
    };
    
    if (existingItemIndex >= 0) {
        // Update quantity if product already exists
        cart[existingItemIndex].quantity = (cart[existingItemIndex].quantity || 1) + 1;
    } else {
        // Add new product with quantity 1
        productWithImage.quantity = 1;
        cart.push(productWithImage);
    }
    
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart UI
    if (typeof updateCart === 'function') {
        updateCart();
    } else if (typeof updateCounts === 'function') {
        updateCounts();
    }
    
    // If user is logged in, sync with server after a delay
    scheduleCartSync();
    
    return true;
}

/**
 * Remove item from cart with server sync
 * @param {number} index Index of item to remove from localStorage cart
 * @returns {Promise} Promise that resolves when item is removed from cart
 */
async function removeFromCartWithSync(index) {
    // Update localStorage first
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const removedProduct = cart.splice(index, 1)[0];
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart UI
    if (typeof updateCart === 'function') {
        updateCart();
    } else if (typeof updateCounts === 'function') {
        updateCounts();
    }
    
    // Update button states if relevant functions exist
    if (typeof updateButtonsState === 'function' && removedProduct && removedProduct.id) {
        updateButtonsState(removedProduct.id);
    }
    
    // If user is logged in, sync with server after a delay
    scheduleCartSync();
    
    return true;
}

/**
 * Update item quantity in cart with server sync
 * @param {number} index Index of item in localStorage cart
 * @param {number} changeAmount Amount to change quantity by (positive or negative)
 * @returns {Promise} Promise that resolves when quantity is updated
 */
async function updateCartQuantityWithSync(index, changeAmount) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (index < 0 || index >= cart.length) {
        return false;
    }
    
    // Calculate new quantity
    cart[index].quantity = (cart[index].quantity || 1) + changeAmount;
    
    // Ensure quantity is at least 1
    if (cart[index].quantity < 1) {
        cart[index].quantity = 1;
    }
    
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart UI
    if (typeof updateCart === 'function') {
        updateCart();
    } else if (typeof updateCounts === 'function') {
        updateCounts();
    }
    
    // If user is logged in, sync with server after a delay
    scheduleCartSync();
    
    return true;
}

/**
 * Schedule a cart sync with debounce
 */
function scheduleCartSync() {
    // Only proceed if cart sync is enabled
    if (!isCartSyncEnabled()) return;
    
    // Clear any existing timer
    if (cartSyncTimer) {
        clearTimeout(cartSyncTimer);
    }
    
    // Set new timer
    cartSyncTimer = setTimeout(syncCartWithServer, SYNC_DELAY);
}

/**
 * Synchronize cart with server (called after delay)
 * @returns {Promise} Promise that resolves when cart is synced
 */
async function syncCartWithServer() {
    // Prevent multiple syncs
    if (syncInProgress || !isCartSyncEnabled()) return Promise.resolve(false);
    
    syncInProgress = true;
    
    try {
        // Get current cart from localStorage
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        // Sync with server
        await pushCartToServer(cart);
        
        return true;
    } catch (error) {
        console.error('Error syncing cart with server:', error);
        return false;
    } finally {
        syncInProgress = false;
    }
}

/**
 * Clear cart with server sync
 * @returns {Promise} Promise that resolves when cart is cleared
 */
async function clearCartWithSync() {
    const userId = getUserId();
    
    // Clear localStorage
    localStorage.setItem('cart', JSON.stringify([]));
    
    // Update UI
    if (typeof updateCart === 'function') {
        updateCart();
    } else if (typeof updateCounts === 'function') {
        updateCounts();
    }
    
    // Clear from server if user is logged in
    if (userId) {
        try {
            await fetch(`/api/cart/clear/${userId}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Error clearing cart on server:', error);
        }
    }
    
    return true;
}

/**
 * Initialize cart sync
 * Should be called on page load
 */
// The main issue is in how cart synchronization is handled
function initCartSync() {
    // This is missing in your code, but it appears to be called
    console.log("Initializing cart sync");
    
    // Get cart items using the correct localStorage key
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Update cart count in header
    const cartCountEl = document.querySelector('.count_item_header');
    if (cartCountEl) {
        let totalCount = 0;
        cart.forEach(item => {
            totalCount += (item.quantity || 1);
        });
        cartCountEl.textContent = totalCount;
    }
    
    // Update Add to Cart button states
    const cartIds = cart.map(item => item.id);
    document.querySelectorAll('.btn_add_cart').forEach(btn => {
        const pid = btn.dataset.id;
        if (cartIds.includes(Number(pid))) {
            btn.classList.add('active');
            btn.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> Item in cart`;
        }
    });
}

// Initialize on script load - wait for DOM to be ready if we're in a browser
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initCartSync);
} else {
    initCartSync();
}

// Export functions for global use
window.addToCartWithSync = addToCartWithSync;
// window.removeFromCartWithSync = removeFromCartWithSync;
window.updateCartQuantityWithSync = updateCartQuantityWithSync;
window.clearCartWithSync = clearCartWithSync;
window.loadCartFromServer = loadCartFromServer;
window.syncCartWithServer = syncCartWithServer;
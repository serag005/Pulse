// JavaScript for the Wishlist Functionality
console.log("Loading favorite.js");

// Toggle wishlist visibility
function open_close_wishlist() {
    console.log("Toggle wishlist called");
    // Try to find wishlist with any possible class or structure
    const wishlist = document.querySelector(".wishlist");
    
    if (wishlist) {
        wishlist.classList.toggle("active");
        console.log("Toggled wishlist panel:", wishlist.classList.contains("active"));
    } else {
        console.error("Wishlist panel not found - no element with class .wishlist exists in the DOM");
    }
}

// Get wishlist items from localStorage
function getWishlistItems() {
    // For compatibility, support both keys but use 'wishlistItems' as primary
    try {
        let items = JSON.parse(localStorage.getItem('wishlistItems')) || [];
        
        // Check the 'wishlist' key as fallback and copy it to 'wishlistItems' if needed
        if (items.length === 0) {
            const fallbackItems = JSON.parse(localStorage.getItem('wishlist')) || [];
            if (fallbackItems.length > 0) {
                console.log("Using items from 'wishlist' key");
                items = fallbackItems;
                localStorage.setItem('wishlistItems', JSON.stringify(items));
            }
        }
        
        // Always ensure both keys are synchronized
        localStorage.setItem('wishlist', JSON.stringify(items));
        localStorage.setItem('wishlistItems', JSON.stringify(items));
        
        return items;
    } catch (error) {
        console.error('Error retrieving wishlist items:', error);
        return [];
    }
}

// Update wishlist UI
function updateWishlist() {
    // Try to find the wishlist container with different possible selectors
    const wishlistItemsContainer = document.getElementById("wishlist_items") || 
                                  document.querySelector(".items_in_wishlist");
    
    if (!wishlistItemsContainer) {
        console.log("Wishlist container not found, updating counts only");
        updateWishlistCount();
        return;
    }
    
    console.log("Found wishlist container:", wishlistItemsContainer);
    
    // Get wishlist items and cart for comparison
    const wishlist = getWishlistItems();
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    console.log(`Updating wishlist UI with ${wishlist.length} items`);
    
    // Update wishlist counts
    updateWishlistCount();
    
    // Clear container
    wishlistItemsContainer.innerHTML = "";
    
    // Show empty message if no items
    if (wishlist.length === 0) {
        wishlistItemsContainer.innerHTML = '<div class="empty-wishlist"><p>Your wishlist is empty</p></div>';
        return;
    }
    
    // Add each item to the container
    wishlist.forEach((item, index) => {
        // Check if item is in cart
        const isInCart = cart.some(cartItem => cartItem.id == item.id);
        const cartButtonText = isInCart ? 'Added to Cart' : 'Add to Cart';
        const cartButtonClass = isInCart ? 'add_to_cart in-cart' : 'add_to_cart';
        
        // Ensure image path is valid
        const imgSrc = item.img || item.image || 'images/placeholder.png';
        
        // Create item HTML
        wishlistItemsContainer.innerHTML += `
            <div class="item_wishlist">
                <img src="${imgSrc}" alt="${item.name}" onerror="this.src='images/placeholder.png'">
                <div class="content">
                    <h4>${item.name}</h4>
                    <p class="price_wishlist">EGP ${item.price}</p>
                </div>
                <div class="action_buttons">
                    <button class="${cartButtonClass}" data-id="${item.id}">
                        <i class="fa-solid fa-cart-shopping"></i> ${cartButtonText}
                    </button>
                    <button class="remove_wishlist" data-index="${index}">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    // Add event listeners to buttons
    attachWishlistButtonListeners();
}

// Attach event listeners to wishlist buttons
function attachWishlistButtonListeners() {
    // Handle remove buttons
    document.querySelectorAll('.remove_wishlist').forEach(button => {
        button.addEventListener('click', function(e) {
            const itemIndex = this.getAttribute('data-index');
            removeFromWishlist(itemIndex);
        });
    });
    
    // Handle add to cart buttons
    document.querySelectorAll('.wishlist .add_to_cart').forEach(button => {
        button.addEventListener('click', function(e) {
            const productId = this.getAttribute('data-id');
            addToCartFromWishlist(productId, this);
        });
    });
}

// Remove item from wishlist
function removeFromWishlist(index) {
    const wishlist = getWishlistItems();
    if (index >= 0 && index < wishlist.length) {
        const removedItem = wishlist.splice(index, 1)[0];
        
        // Update localStorage
        localStorage.setItem('wishlistItems', JSON.stringify(wishlist));
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        
        // Update UI
        updateWishlist();
        
        // Update wishlist buttons on page
        updateWishlistButtons();
        
        console.log(`Removed item ${removedItem.name} from wishlist`);
    }
}

// Add item to cart from wishlist
function addToCartFromWishlist(productId, buttonElement) {
    const wishlist = getWishlistItems();
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Find product in wishlist
    const product = wishlist.find(item => item.id == productId);
    if (!product) {
        console.error("Product not found in wishlist:", productId);
        return;
    }
    
    // Check if already in cart
    const existingIndex = cart.findIndex(item => item.id == productId);
    if (existingIndex === -1) {
        // Add to cart with quantity 1
        cart.push({...product, quantity: 1});
        
        // Update cart in localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Update button state
        if (buttonElement) {
            buttonElement.classList.add('in-cart');
            buttonElement.innerHTML = '<i class="fa-solid fa-cart-shopping"></i> Added to Cart';
        }
        
        // Update cart buttons on page
        const allCartButtons = document.querySelectorAll(`.btn_add_cart[data-id="${productId}"]`);
        allCartButtons.forEach(btn => {
            btn.classList.add("active");
            btn.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> Item in cart`;
        });
        
        console.log(`Added ${product.name} to cart from wishlist`);
        
        // Update cart UI if function exists
        if (typeof updateCart === 'function') {
            updateCart();
        }
    }
}

// Update wishlist count in UI
function updateWishlistCount() {
    const wishlist = getWishlistItems();
    const count = wishlist.length;
    
    // Update all count elements
    document.querySelectorAll('.wishlist_count, .Count_item_wishlist, .total_wishlist_count').forEach(el => {
        if (el) el.textContent = count;
    });
}

// Update wishlist buttons on page
function updateWishlistButtons() {
    const wishlist = getWishlistItems();
    const wishlistIds = wishlist.map(item => String(item.id));
    
    // Get all wishlist buttons
    const buttons = document.querySelectorAll('.btn_add_wishlist');
    
    console.log(`Updating ${buttons.length} wishlist buttons with ${wishlistIds.length} wishlist items`);
    
    // Update their state
    buttons.forEach(button => {
        const productId = String(button.getAttribute('data-id'));
        const isInWishlist = wishlistIds.includes(productId);
        
        if (isInWishlist) {
            button.classList.add('active');
            // Update icon if it exists
            const icon = button.querySelector('i');
            if (icon) icon.className = 'fa-solid fa-heart';
        } else {
            button.classList.remove('active');
            // Update icon if it exists
            const icon = button.querySelector('i');
            if (icon) icon.className = 'fa-regular fa-heart';
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log("Initializing wishlist functionality in favorite.js");
    
    // Check for wishlist containers
    const mainWishlistContainer = document.querySelector('.wishlist');
    const itemsContainer = document.getElementById('wishlist_items') || 
                          document.querySelector('.items_in_wishlist');
    
    console.log("Main wishlist container found:", !!mainWishlistContainer);
    console.log("Wishlist items container found:", !!itemsContainer);
    
    // Get initial wishlist items to ensure localStorage is consistent
    const wishlistItems = getWishlistItems();
    console.log(`Found ${wishlistItems.length} items in wishlist`);
    
    // Update wishlist UI if container exists
    updateWishlist();
    
    // Update wishlist buttons on page
    updateWishlistButtons();
    
    // Add a mutation observer to detect when products are added to the page
    // This ensures we update wishlist buttons even when products load dynamically
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                // Check if any wishlist buttons were added
                let hasNewButtons = false;
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        if (node.classList && node.classList.contains('btn_add_wishlist')) {
                            hasNewButtons = true;
                        } else if (node.querySelector && node.querySelector('.btn_add_wishlist')) {
                            hasNewButtons = true;
                        }
                    }
                });
                
                if (hasNewButtons) {
                    console.log("New wishlist buttons detected, updating states");
                    updateWishlistButtons();
                }
            }
        });
    });
    
    // Observe the entire body for changes
    observer.observe(document.body, { 
        childList: true, 
        subtree: true 
    });
    
    // Also update periodically to catch any missed buttons (fallback)
    setTimeout(updateWishlistButtons, 500);
    setTimeout(updateWishlistButtons, 1000);
    setTimeout(updateWishlistButtons, 2000);
    
    // Allow time for header.js to insert the dynamic header before attaching event listeners
    setTimeout(function() {
        // Add event listener to header wishlist button
        const wishlistToggleButtons = document.querySelectorAll('.btn_wishlist_toggle');
        console.log(`Found ${wishlistToggleButtons.length} wishlist toggle buttons`);
        
        wishlistToggleButtons.forEach(button => {
            button.addEventListener('click', open_close_wishlist);
        });
    }, 500); // 500ms delay to ensure header.js has time to run
});

// Make functions available globally
window.open_close_wishlist = open_close_wishlist;
window.getWishlistItems = getWishlistItems;
window.updateWishlist = updateWishlist;
window.removeFromWishlist = removeFromWishlist;
window.updateWishlistCount = updateWishlistCount;
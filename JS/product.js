/**
 * The JavaScript code includes functions for loading and filtering products, managing wishlist items,
 * handling cart interactions, and displaying product modals on a web page.
 */
// Event listeners for search form and category select
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM content loaded - initializing product functionality');

    // Add the glow effect styles to the page
    addGlowStyles();

    const searchForm = document.querySelector('.search_box');
    const categorySelect = document.getElementById('category');

    // If we're on products.html, load and filter products
    if (window.location.pathname.includes('products.html')) {
        loadAndFilterProducts();
    }

    // Add event listeners for search form submissions
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Get search input value
            const searchValue = document.getElementById('search')?.value || '';
            const categoryValue = categorySelect?.value || 'All Categories';

            // Only navigate if there's a search value or category is selected
            if (searchValue.trim() !== '' || categoryValue !== 'All Categories') {
                // Navigate to products page with search parameters
                window.location.href = 'products.html' +
                    '?category=' + encodeURIComponent(categoryValue) +
                    '&search=' + encodeURIComponent(searchValue);
            }
        });
    }

    // Add event listener for category selection
    if (categorySelect) {
        categorySelect.addEventListener('change', function() {
            // Get the current search value if there is one
            const searchValue = document.getElementById('search')?.value || '';

            // Navigate to products page with category parameter (and search if present)
            if (searchValue.trim() !== '') {
                window.location.href = 'products.html' +
                    '?category=' + encodeURIComponent(this.value) +
                    '&search=' + encodeURIComponent(searchValue);
            } else {
                window.location.href = 'products.html' +
                    '?category=' + encodeURIComponent(this.value);
            }
        });
    }

    // Initialize product interactions (modal functionality)
    setTimeout(addProductCardListeners, 500);
});

// Function to add glow effect styles
function addGlowStyles() {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
        .glow-effect {
            animation: glow 3s ease-in-out;
        }
        @keyframes glow {
            0% { box-shadow: 0 0 5px rgba(0,123,255,0.3); }
            50% { box-shadow: 0 0 20px rgba(0,123,255,0.7); }
            100% { box-shadow: 0 0 5px rgba(0,123,255,0.3); }
        }
    `;
    document.head.appendChild(styleSheet);
}

// JS for products page: load and filter products
function loadAndFilterProducts() {
    console.log('Loading and filtering products');

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const categoryFilter = urlParams.get('category');
    const searchFilter = urlParams.get('search') ? urlParams.get('search').toLowerCase() : '';

    // Get the products container
    const productsContainer = document.querySelector('.products_page');
    if (!productsContainer) {
        console.error('Products container not found');
        return;
    }

    // Show loading indicator
    productsContainer.innerHTML = '<div class="loading">Loading products...</div>';

    // Restore form values from URL
    if (categoryFilter) {
        const categorySelect = document.getElementById('category');
        if (categorySelect) categorySelect.value = categoryFilter;
    }

    if (searchFilter) {
        const searchInput = document.getElementById('search');
        if (searchInput) searchInput.value = searchFilter;
    }

    // Fetch all products first, then filter on client side
    fetch('/api/products')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            // Clear loading indicator
            productsContainer.innerHTML = '';

            // Check if data is valid
            if (!data || !Array.isArray(data)) {
                throw new Error('Invalid data format received from server');
            }

            // Filter products based on search term and category
            let filteredProducts = [...data];

            // Apply category filter if present and not "All Categories"
            if (categoryFilter && categoryFilter !== 'All Categories') {
                filteredProducts = filteredProducts.filter(product =>
                    product.Category === categoryFilter
                );
            }

            // Apply search filter if present
            if (searchFilter) {
                filteredProducts = filteredProducts.filter(product =>
                    product.name.toLowerCase().includes(searchFilter) ||
                    (product.description && product.description.toLowerCase().includes(searchFilter))
                );
            }

            // Update product counter
            updateProductCounter(filteredProducts.length, searchFilter, categoryFilter);

            if (filteredProducts.length === 0) {
                productsContainer.innerHTML = '<div class="no-products">No products found matching your criteria.</div>';
                return;
            }

            console.log(`Displaying ${filteredProducts.length} products after filtering`);

            // Get current cart data from localStorage
            const cart = JSON.parse(localStorage.getItem('cart')) || [];

            // Generate HTML for each product
            filteredProducts.forEach(product => {
                productsContainer.innerHTML += generateProductHTML(product, cart);
            });

            // Attach event listeners to Add to Cart buttons
            attachCartButtonListeners(filteredProducts);

            // Add glow effects to product cards
            document.querySelectorAll('.product_page_Card').forEach(card => {
                card.classList.add('glow-effect');
                setTimeout(() => card.classList.remove('glow-effect'), 5000);
            });

            // Initialize modal functionality
            addProductCardListeners();

            // Update wishlist button states
            if (typeof window.updateWishlistButtons === 'function') {
                console.log('Calling updateWishlistButtons after products loaded');
                window.updateWishlistButtons();
            }
        })
        .catch(error => {
            console.error('Error loading products:', error);

            // Show error message to user
            productsContainer.innerHTML = `
                <div class="error-message">
                    <h3>Error loading products</h3>
                    <p>${error.message || 'An unexpected error occurred'}</p>
                    <button class="retry-button">Try Again</button>
                </div>
            `;

            // Add retry button functionality
            const retryButton = document.querySelector('.retry-button');
            if (retryButton) {
                retryButton.addEventListener('click', () => {
                    loadAndFilterProducts();
                });
            }
        });
}

// Add these helper functions to manage wishlist
function addToWishlist(product) {
    try {
        // Get existing wishlist
        let wishlist = JSON.parse(localStorage.getItem('wishlistItems')) || [];

        // Check if product already in wishlist
        const existingIndex = wishlist.findIndex(item => item.id == product.id);

        // If not in wishlist, add it
        if (existingIndex === -1) {
            wishlist.push(product);
            localStorage.setItem('wishlistItems', JSON.stringify(wishlist));
            console.log('Added to wishlist:', product.name || product.id);

            // Update count if the function exists (from favorite.js)
            if (typeof updateWishlistCount === 'function') {
                updateWishlistCount();
            }
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        return false;
    }
}

function removeFromWishlist(productId) {
    try {
        // Get existing wishlist
        let wishlist = JSON.parse(localStorage.getItem('wishlistItems')) || [];

        // Filter out the product
        const newWishlist = wishlist.filter(item => item.id != productId);

        // If an item was removed, update localStorage
        if (newWishlist.length < wishlist.length) {
            localStorage.setItem('wishlistItems', JSON.stringify(newWishlist));
            console.log('Removed from wishlist:', productId);

            // Update count if the function exists (from favorite.js)
            if (typeof updateWishlistCount === 'function') {
                updateWishlistCount();
            }
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        return false;
    }
}

function isInWishlist(productId) {
    try {
        const wishlist = JSON.parse(localStorage.getItem('wishlistItems')) || [];
        return wishlist.some(item => item.id == productId);
    } catch (error) {
        console.error('Error checking wishlist:', error);
        return false;
    }
}

// Attach event listeners to cart buttons
function attachCartButtonListeners(products) {
    console.log('Attaching cart button listeners from product.js');
    
    // Store products globally so they can be accessed by cart handlers
    window.productCatalog = window.productCatalog || {};
    
    // Add these products to the catalog
    products.forEach(product => {
        window.productCatalog[product.id] = product;
    });
    
    // Check if header.js already set up the event handlers
    if (window.cartButtonsInitialized) {
        console.log("Cart buttons already initialized by header.js");
        return;
    }
    
    // Set the flag to prevent duplicate initialization
    window.cartButtonsInitialized = true;
    
    // Create the safeAddToCart function if it doesn't exist
    window.safeAddToCart = window.safeAddToCart || function(productId, buttonElement) {
        // Prevent adding if already in cart (button is active)
        if (buttonElement && buttonElement.classList.contains('active')) {
            console.log(`Product ${productId} already in cart, skipping addition`);
            return false;
        }
        
        // Get current cart
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        // Check if product already in cart
        const existingItem = cart.find(item => item.id == productId);
        if (existingItem) {
            console.log(`Product ${productId} already in cart, updating quantity`);
            existingItem.quantity = (existingItem.quantity || 1) + 1;
            localStorage.setItem('cart', JSON.stringify(cart));
            
            // Update UI
            updateAllCartButtons(productId);
            
            // Call updateCart from header.js if it exists
            if (typeof updateCart === 'function') {
                updateCart();
            } else {
                updateCartCount(cart.reduce((total, item) => total + (item.quantity || 1), 0));
            }
            
            return true;
        }
        
        // Find the product in our catalog
        const product = window.productCatalog[productId];
        
        if (product) {
            console.log(`Adding product ${productId} to cart`);
            // Add to cart with quantity 1
            cart.push({...product, quantity: 1});
            localStorage.setItem('cart', JSON.stringify(cart));
            
            // Update UI
            updateAllCartButtons(productId);
            
            // Call updateCart from header.js if it exists
            if (typeof updateCart === 'function') {
                updateCart();
            } else {
                updateCartCount(cart.reduce((total, item) => total + (item.quantity || 1), 0));
            }
            
            return true;
        } else {
            console.error(`Product ${productId} not found in catalog`);
            return false;
        }
    };
    
    // Use event delegation to handle all cart button clicks
    document.addEventListener('click', function(event) {
        // Find closest cart button if there is one
        const cartButton = event.target.closest('.btn_add_cart');
        if (!cartButton) return; // Not a cart button click
        
        // Stop event propagation
        event.preventDefault();
        event.stopPropagation();
        
        // Check if button indicates item already in cart
        if (cartButton.classList.contains('active')) {
            console.log('Item already in cart, ignoring click');
            return;
        }
        
        // Get product ID and add to cart
        const productId = cartButton.getAttribute('data-id');
        if (!productId) {
            console.error('No product ID found on cart button');
            return;
        }
        
        console.log(`Cart button clicked for product ${productId}`);
        window.safeAddToCart(productId, cartButton);
    }, true); // Use capture phase to ensure we get the event first
}

// Function to update all cart buttons for a specific product
function updateAllCartButtons(productId) {
    const allButtons = document.querySelectorAll(`.btn_add_cart[data-id="${productId}"]`);
    console.log(`Updating ${allButtons.length} cart buttons for product ${productId}`);
    
    allButtons.forEach(button => {
        button.classList.add('active');
        button.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> Item in cart`;
    });
}

// Function to generate product HTML
function generateProductHTML(product, cart) {
    const isInCart = cart.some(cartItem => cartItem.id == product.id);

    // Get wishlist items from localStorage
    const wishlistItems = JSON.parse(localStorage.getItem('wishlistItems')) || [];
    const isInWishlist = wishlistItems.some(item => item.id == product.id);

    const oldPriceHTML = product.old_price ? `<p class="old_price">EGP ${product.old_price}</p>` : "";
    const discountHTML = product.old_price ? `<span class="sale_present">%${Math.floor((product.old_price - product.price) / product.old_price * 100)}</span>` : "";
    const usedLabelHTML = product.type === "Used" ? `<div class="used_label">Used Item</div>` : "";

    // Make sure to use proper image path - try different field names to be compatible with various data formats
    const imageSrc = product.image || product.img || "placeholder.jpg";

    return `
        <div class="product_page_Card" data-category="${product.Category}" data-product-id="${product.id}">
            ${discountHTML}
            ${usedLabelHTML}
            <div class="img_product">
                <a href="#"><img src="${imageSrc}" alt="${product.name}"></a>
            </div>
            <div class="stars">
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
            </div>
            <p class="name_product"><a href="#">${product.name}</a></p>
            <div class="price">
                <p><span>EGP ${product.price}</span></p>
                ${oldPriceHTML}
            </div>
            <div class="icons">
                <span class="btn_add_cart ${isInCart ? 'active' : ''}" data-id="${product.id}">
                    <i class="fa-solid fa-cart-shopping"></i> ${isInCart ? 'Item in cart' : 'add to cart'}
                </span>
                <button class="btn_add_wishlist ${isInWishlist ? 'active' : ''}" data-id="${product.id}">
                    <i class="fa-${isInWishlist ? 'solid' : 'regular'} fa-heart"></i>
                </button>
            </div>
        </div>
    `;
}

// Create the modal structure when page loads
function createProductModal() {
    // Check if modal already exists
    if (!document.querySelector('.product-modal-overlay2')) {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'product-modal-overlay';
        // Set proper centering styles
        modalOverlay.style.display = 'none';
        modalOverlay.style.position = 'fixed';
        modalOverlay.style.top = '0';
        modalOverlay.style.left = '0';
        modalOverlay.style.width = '100%';
        modalOverlay.style.height = '100%';
        modalOverlay.style.backgroundColor = 'rgba(0,0,0,0.7)';
        modalOverlay.style.zIndex = '9999';
        // Important for centering
        modalOverlay.style.justifyContent = 'center';
        modalOverlay.style.alignItems = 'center';

        const modalContent = document.createElement('div');
        modalContent.className = 'product-modal-content';
        // Center content styling
        modalContent.style.display = 'flex';
        modalContent.style.flexDirection = 'column';
        modalContent.style.alignItems = 'center';
        modalContent.style.justifyContent = 'center';
        modalContent.style.position = 'relative';
        modalContent.style.maxWidth = '90%';
        modalContent.style.margin = '0 auto';

        // No close button here since it's added directly to the card
        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        // Add event listeners for closing
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                closeProductModal();
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeProductModal();
            }
        });
    }
}

// Function to open product modal
function openProductModal(card) {
    const modalOverlay = document.querySelector('.product-modal-overlay');
    const modalContent = document.querySelector('.product-modal-content');

    if (!modalOverlay || !modalContent) {
        console.error('Modal elements not found');
        return;
    }

    // Clone the clicked card
    const cardClone = card.cloneNode(true);
    cardClone.classList.add('modal-product-card');
    
    // Ensure the card is scaled up and centered
    cardClone.style.transform = 'scale(1.5)';
    cardClone.style.margin = '0 auto';
    cardClone.style.maxWidth = '90%';
    cardClone.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
    cardClone.style.position = 'relative'; // Ensure proper positioning for the close button

    // Get product ID from original card
    const productId = card.getAttribute('data-product-id') ||
        card.getAttribute('data-id') ||
        card.querySelector('[data-id]')?.getAttribute('data-id');

    // Make sure we sync initial active states
    syncButtonStates(productId);

    // Update buttons in the modal to have the same functionality
    const addToCartBtn = cardClone.querySelector('.btn_add_cart');
    if (addToCartBtn) {
        const originalBtn = card.querySelector('.btn_add_cart');

        // Remove previous event listeners and add new one
        addToCartBtn.replaceWith(addToCartBtn.cloneNode(true));
        const newCartBtn = cardClone.querySelector('.btn_add_cart');

        newCartBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent modal from closing

            // Trigger click on the original button to maintain functionality
            if (originalBtn && !originalBtn.classList.contains('active')) {
                originalBtn.click();

                // Update the modal button state to match
                newCartBtn.classList.add('active');
                newCartBtn.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> Item in cart`;
            }
        });
    }

    // Do the same for wishlist button
    const wishlistBtn = cardClone.querySelector('.btn_add_wishlist');
    if (wishlistBtn) {
        const originalWishlistBtn = card.querySelector('.btn_add_wishlist');

        // Remove previous event listeners and add new one
        wishlistBtn.replaceWith(wishlistBtn.cloneNode(true));
        const newWishlistBtn = cardClone.querySelector('.btn_add_wishlist');

        newWishlistBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent modal from closing

            // Toggle wishlist state
            const productId = this.getAttribute('data-id');

            if (this.classList.contains('active')) {
                // Remove from wishlist
                if (removeFromWishlist(productId)) {
                    // Update UI for all matching buttons
                    document.querySelectorAll(`.btn_add_wishlist[data-id="${productId}"]`).forEach(el => {
                        el.classList.remove('active');
                        const icon = el.querySelector('i');
                        if (icon) {
                            icon.classList.remove('fa-solid');
                            icon.classList.add('fa-regular');
                        }
                    });
                }
            } else {
                // Get the product from original button's parent card
                const productCard = originalWishlistBtn.closest('.product_page_Card');
                const productName = productCard.querySelector('.name_product a').textContent;
                const productPrice = parseFloat(productCard.querySelector('.price span').textContent.replace('EGP ', ''));
                const productImage = productCard.querySelector('.img_product img').src;

                const productToAdd = {
                    id: productId,
                    name: productName,
                    price: productPrice,
                    image: productImage
                };

                // Add to wishlist
                if (addToWishlist(productToAdd)) {
                    // Update UI for all matching buttons
                    document.querySelectorAll(`.btn_add_wishlist[data-id="${productId}"]`).forEach(el => {
                        el.classList.add('active');
                        const icon = el.querySelector('i');
                        if (icon) {
                            icon.classList.remove('fa-regular');
                            icon.classList.add('fa-solid');
                        }
                    });
                }
            }

            // Make sure all buttons are synced
            syncButtonStates(productId);
        });
    }

    // Clear previous content and add the cloned card
    modalContent.innerHTML = '';

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'product-modal-close2';
    closeButton.innerHTML = '&times;';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '39px'; // Position under sale badge
    closeButton.style.right = '10px';
    closeButton.style.zIndex = '10';
    closeButton.style.width = '20px';
    closeButton.style.height = '20px';
    closeButton.style.fontSize = '14px';
    closeButton.style.lineHeight = '1';
    closeButton.style.padding = '0';
    closeButton.style.textAlign = 'center';
    closeButton.style.background = 'var(--main_color)';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '50%';
    closeButton.style.cursor = 'pointer';
    closeButton.style.display = 'flex';
    closeButton.style.alignItems = 'center';
    closeButton.style.justifyContent = 'center';
    closeButton.addEventListener('click', closeProductModal);
    
    // Append close button directly to the card instead of the modal content
    cardClone.appendChild(closeButton);
    
    // Add the product card to the modal content
    modalContent.appendChild(cardClone);

    // Show the modal with animation
    modalOverlay.style.display = 'flex';
    modalOverlay.style.justifyContent = 'center';
    modalOverlay.style.alignItems = 'center';

    // Trigger reflow for animation
    void modalOverlay.offsetWidth;

    // Add active classes for animation
    modalOverlay.classList.add('active');
    modalContent.classList.add('active');

    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
}

// Function to close product modal
function closeProductModal() {
    const modalOverlay = document.querySelector('.product-modal-overlay');
    const modalContent = document.querySelector('.product-modal-content');

    if (!modalOverlay || !modalContent) return;

    // Remove active classes to trigger exit animation
    modalOverlay.classList.remove('active');
    modalContent.classList.remove('active');

    // Wait for animation to complete before hiding
    setTimeout(() => {
        modalOverlay.style.display = 'none';
    }, 300);

    // Re-enable body scrolling
    document.body.style.overflow = '';
}

// Add click event listeners to product cards
function addProductCardListeners() {
    // Create modal on page load
    createProductModal();

    // Find all product containers
    const productContainers = document.querySelectorAll('.products_page');

    productContainers.forEach(container => {
        // Use event delegation to handle card clicks
        container.addEventListener('click', function(e) {
            // Find the closest product card to the click
            const card = e.target.closest('.product_page_Card');

            // If we found a card and the click wasn't on a button
            if (card && !e.target.closest('.btn_add_cart') && !e.target.closest('.btn_add_wishlist')) {
                openProductModal(card);
            }
        });
    });
}

// Utility function to sync button states between original and modal
function syncButtonStates(productId) {
    // Find all buttons with the same product ID
    const allCartButtons = document.querySelectorAll(`.btn_add_cart[data-id="${productId}"]`);
    const allWishlistButtons = document.querySelectorAll(`.btn_add_wishlist[data-id="${productId}"]`);

    // If one button is active, make all matching buttons active
    let isCartActive = false;
    let isWishlistActive = false;

    allCartButtons.forEach(btn => {
        if (btn.classList.contains('active')) isCartActive = true;
    });

    allWishlistButtons.forEach(btn => {
        if (btn.classList.contains('active')) isWishlistActive = true;
    });

    // Apply active state to all matching buttons
    if (isCartActive) {
        allCartButtons.forEach(btn => {
            btn.classList.add('active');
            btn.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> Item in cart`;
        });
    }

    if (isWishlistActive) {
        allWishlistButtons.forEach(btn => {
            btn.classList.add('active');
            const icon = btn.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-regular');
                icon.classList.add('fa-solid');
            }
        });
    } else {
        allWishlistButtons.forEach(btn => {
            btn.classList.remove('active');
            const icon = btn.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-solid');
                icon.classList.add('fa-regular');
            }
        });
    }
}

// Function to update cart count in the header
function updateCartCount(count) {
    const cartCountElements = document.querySelectorAll('.count_item_header');
    
    if (cartCountElements.length > 0) {
        cartCountElements.forEach(element => {
            element.textContent = count;
        });
    }
    
    console.log(`Updated cart count to ${count}`);
}
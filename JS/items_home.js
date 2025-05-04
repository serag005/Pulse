document.addEventListener('DOMContentLoaded', function() {
    // First ensure all containers exist to prevent errors
    ensureContainersExist();

    // Check if we're on the products.html page
    if (isRegularProductsPage()) {
        console.log('Regular products page detected - using special product page handling');

        // We still need to attach event handlers for cart and wishlist buttons on products page
        setTimeout(function() {
            attachCartEventHandlers();
        }, 500);

        // Load initial cart and wishlist state
        updateWishlistButtons();
        return;
    }

    // Check if we're on pages where we should skip product initialization
    if (isProfilePage() || isCheckoutPage() || isContactPage() || isAboutPage()) {
        console.log('Page detected that should not show product sliders - skipping product initialization');

        // On profile page, still initialize cart from localStorage for profile functionality
        if (isProfilePage()) {
            console.log('Profile page detected - only initializing cart for profile functionality');
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            // Update cart count display if elements exist
            const countItems = document.querySelectorAll('.count_item_header, .count-item-cart');
            countItems.forEach(element => {
                if (element) element.textContent = cart.length;
            });
        }

        return; // Exit early, don't load any products on these pages
    }

    // Initialize cart from localStorage
    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Load all product sections - ensure this doesn't reinitialize the swiper
    setTimeout(function() {
        loadSaleItems();
        loadLowerLimbProducts();
        loadUpperLimbProducts();
        loadUsedItems();
    }, 100);

    // Set up product modal functionality
    setupProductModal();
});

// Handle fetch errors globally
window.addEventListener('unhandledrejection', function(event) {
    console.warn('Unhandled promise rejection:', event.reason);
    // Don't let fetch errors crash the page
});

/**
 * Load products that have old_price (sale items)
 */
function loadSaleItems() {
    // Skip on profile page
    if (isProfilePage()) {
        console.log('Profile page detected - skipping loadSaleItems');
        return;
    }

    let swiperContainer = document.getElementById("swiper_items_sale");
    if (!swiperContainer) {
        console.log("Creating sale items container");
        const mainContent = document.querySelector('main') || document.body;
        const newContainer = document.createElement('div');
        newContainer.id = "swiper_items_sale";
        newContainer.className = 'swiper-container';
        mainContent.appendChild(newContainer);
        swiperContainer = newContainer;
    }

    // Use general products endpoint instead of the specific sales endpoint that doesn't exist
    fetch('/api/products')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data)) {
                console.warn('Expected array of products, but got:', typeof data);
                data = []; // Handle non-array response
            }

            const cart = JSON.parse(localStorage.getItem('cart')) || [];

            // Filter products with old_price (on sale)
            const saleProducts = data.filter(product => product.old_price);

            // Clear container before adding items
            swiperContainer.innerHTML = '';

            if (saleProducts.length === 0) {
                swiperContainer.innerHTML = '<p>No sale items found</p>';
                return;
            }

            // Render sale products
            saleProducts.forEach(product => {
                const isInCart = cart.some(cartItem => cartItem.id === product.id);
                const percentDisc = Math.floor((product.old_price - product.price) / product.old_price * 100);
                const usedLabel = product.type === "Used" ? `<div class="used_label">Used Item</div>` : "";

                swiperContainer.innerHTML += `
                    <div class="swiper-slide product" data-id="${product.id}">
                        <span class="sale_present">%${percentDisc}</span>
                        ${usedLabel}
                        <div class="img_product">
                            <a href="#"><img src="${product.image || 'images/placeholder.jpg'}" alt="${product.name}"></a>
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
                            <p class="old_price">EGP ${product.old_price}</p>
                        </div>

                        <div class="icons">
                            <span class="btn_add_cart ${isInCart ? 'active' : ''}" data-id="${product.id}">
                                <i class="fa-solid fa-cart-shopping"></i> ${isInCart ? 'Item in cart' : 'add to cart'}
                            </span>
                            <button class="btn_add_wishlist" data-id="${product.id}">
                                <i class="fa-regular fa-heart"></i>
                            </button>
                        </div>
                    </div>
                `;
            });

            // Initialize cart button click handlers
            attachCartEventHandlers();
        })
        .catch(error => console.error('Error loading sale products:', error));
}

/**
 * Load Lower Limb category products
 */
function loadLowerLimbProducts() {
    // Skip on profile page
    if (isProfilePage()) {
        console.log('Profile page detected - skipping loadLowerLimbProducts');
        return;
    }

    const swiperContainer = document.getElementById("swiper_Lower_Limb");
    if (!swiperContainer) {
        console.log("Creating lower limb container");
        const mainContent = document.querySelector('main') || document.body;
        const newContainer = document.createElement('div');
        newContainer.id = "swiper_Lower_Limb";
        newContainer.className = 'swiper-container';
        mainContent.appendChild(newContainer);
        swiperContainer = newContainer;
    }

    console.log("Loading Lower Limb products...");

    // Use general products endpoint since specific endpoint doesn't work
    fetch('/api/products')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            console.log("Received products data:", Array.isArray(data) ? data.length + " items" : "not an array");

            if (!Array.isArray(data)) {
                console.warn('Expected array of products, but got:', typeof data);
                data = []; // Handle non-array response
            }

            // Use mock data if no products are found
            if (data.length === 0) {
                data = getMockLowerLimbProducts();
                console.log("Using mock lower limb product data");
            }

            // More flexible filtering for lower limb products - try different property names
            const lowerLimbProducts = data.filter(product => {
                // Try different properties that might contain category information
                const categoryProps = [
                    product.category,
                    product.Category,
                    product.categoryName,
                    product.type,
                    product.productType,
                    product.name
                ];

                // Check if any property contains 'lower' or 'leg' or 'foot'
                return categoryProps.some(prop =>
                        prop && (
                            prop.toString().toLowerCase().includes('lower') ||
                            prop.toString().toLowerCase().includes('leg') ||
                            prop.toString().toLowerCase().includes('foot')
                        )
                );
            });

            // If still no products, use at least the first 3 products
            let productsToShow = lowerLimbProducts;
            if (productsToShow.length === 0 && data.length > 0) {
                console.log("No lower limb products found by filtering, using first products");
                productsToShow = data.slice(0, 5);
            }

            const cart = JSON.parse(localStorage.getItem('cart')) || [];

            // Clear container before adding items
            swiperContainer.innerHTML = '';

            if (productsToShow.length === 0) {
                swiperContainer.innerHTML = '<p>No lower limb products found</p>';
                return;
            }

            console.log(`Rendering ${productsToShow.length} lower limb products`);

            // Render lower limb products
            productsToShow.forEach(product => {
                const isInCart = cart.some(cartItem => cartItem.id === product.id);
                const oldPriceParagraph = product.old_price ? `<p class="old_price">EGP ${product.old_price}</p>` : "";
                const percentDiscDiv = product.old_price ?
                    `<span class="sale_present">%${Math.floor((product.old_price - product.price) / product.old_price * 100)}</span>` : "";
                const usedLabel = product.type === "Used" ? `<div class="used_label">Used Item</div>` : "";

                swiperContainer.innerHTML += `
                    <div class="swiper-slide product" data-id="${product.id || 'mock-' + Math.random()}">
                        ${percentDiscDiv}
                        ${usedLabel}
                        <div class="img_product">
                            <a href="#"><img src="${product.image || 'images/placeholder.jpg'}" alt="${product.name}"></a>
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
                            ${oldPriceParagraph}
                        </div>

                        <div class="icons">
                            <span class="btn_add_cart ${isInCart ? 'active' : ''}" data-id="${product.id || 'mock-' + Math.random()}">
                                <i class="fa-solid fa-cart-shopping"></i> ${isInCart ? 'Item in cart' : 'add to cart'}
                            </span>
                            <button class="btn_add_wishlist" data-id="${product.id || 'mock-' + Math.random()}">
                                <i class="fa-regular fa-heart"></i>
                            </button>
                        </div>
                    </div>
                `;
            });

            // Initialize cart button click handlers
            attachCartEventHandlers();
        })
        .catch(error => {
            console.error('Error loading lower limb products:', error);
            // Use mock data in case of error
            const mockData = getMockLowerLimbProducts();
            renderMockProducts(mockData, swiperContainer, "lower limb");
        });
}

/**
 * Load Upper Limb category products
 */
function loadUpperLimbProducts() {
    // Skip on profile page
    if (isProfilePage()) {
        console.log('Profile page detected - skipping loadUpperLimbProducts');
        return;
    }

    const swiperContainer = document.getElementById("swiper_upper_Limb");
    if (!swiperContainer) {
        console.log("Creating upper limb container");
        const mainContent = document.querySelector('main') || document.body;
        const newContainer = document.createElement('div');
        newContainer.id = "swiper_upper_Limb";
        newContainer.className = 'swiper-container';
        mainContent.appendChild(newContainer);
        swiperContainer = newContainer;
    }

    console.log("Loading Upper Limb products...");

    // Use general products endpoint since specific endpoint doesn't work
    fetch('/api/products')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            console.log("Received products data:", Array.isArray(data) ? data.length + " items" : "not an array");

            if (!Array.isArray(data)) {
                console.warn('Expected array of products, but got:', typeof data);
                data = []; // Handle non-array response
            }

            // Use mock data if no products are found
            if (data.length === 0) {
                data = getMockUpperLimbProducts();
                console.log("Using mock upper limb product data");
            }

            // More flexible filtering for upper limb products - try different property names
            const upperLimbProducts = data.filter(product => {
                // Try different properties that might contain category information
                const categoryProps = [
                    product.category,
                    product.Category,
                    product.categoryName,
                    product.type,
                    product.productType,
                    product.name
                ];

                // Check if any property contains 'upper' or 'arm' or 'hand'
                return categoryProps.some(prop =>
                        prop && (
                            prop.toString().toLowerCase().includes('upper') ||
                            prop.toString().toLowerCase().includes('arm') ||
                            prop.toString().toLowerCase().includes('hand')
                        )
                );
            });

            // If still no products, use at least the first 3 products
            let productsToShow = upperLimbProducts;
            if (productsToShow.length === 0 && data.length > 0) {
                console.log("No upper limb products found by filtering, using first products");
                productsToShow = data.slice(5, 10);
            }

            const cart = JSON.parse(localStorage.getItem('cart')) || [];

            // Clear container before adding items
            swiperContainer.innerHTML = '';

            if (productsToShow.length === 0) {
                swiperContainer.innerHTML = '<p>No upper limb products found</p>';
                return;
            }

            console.log(`Rendering ${productsToShow.length} upper limb products`);

            // Render upper limb products
            productsToShow.forEach(product => {
                const isInCart = cart.some(cartItem => cartItem.id === product.id);
                const oldPriceParagraph = product.old_price ? `<p class="old_price">EGP ${product.old_price}</p>` : "";
                const percentDiscDiv = product.old_price ?
                    `<span class="sale_present">%${Math.floor((product.old_price - product.price) / product.old_price * 100)}</span>` : "";
                const usedLabel = product.type === "Used" ? `<div class="used_label">Used Item</div>` : "";

                swiperContainer.innerHTML += `
                    <div class="swiper-slide product" data-id="${product.id || 'mock-' + Math.random()}">
                        ${percentDiscDiv}
                        ${usedLabel}
                        <div class="img_product">
                            <a href="#"><img src="${product.image || 'images/placeholder.jpg'}" alt="${product.name}"></a>
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
                            ${oldPriceParagraph}
                        </div>

                        <div class="icons">
                            <span class="btn_add_cart ${isInCart ? 'active' : ''}" data-id="${product.id || 'mock-' + Math.random()}">
                                <i class="fa-solid fa-cart-shopping"></i> ${isInCart ? 'Item in cart' : 'add to cart'}
                            </span>
                            <button class="btn_add_wishlist" data-id="${product.id || 'mock-' + Math.random()}">
                                <i class="fa-regular fa-heart"></i>
                            </button>
                        </div>
                    </div>
                `;
            });

            // Initialize cart button click handlers
            attachCartEventHandlers();
        })
        .catch(error => {
            console.error('Error loading upper limb products:', error);
            // Use mock data in case of error
            const mockData = getMockUpperLimbProducts();
            renderMockProducts(mockData, swiperContainer, "Upper-Limb");
        });
}

// Helper function to render mock products
function renderMockProducts(products, container, category) {
    console.log(`Rendering mock ${category} products`);

    // Clear container
    container.innerHTML = '';

    // Render products
    products.forEach(product => {
        const oldPriceParagraph = product.old_price ? `<p class="old_price">EGP ${product.old_price}</p>` : "";
        const percentDiscDiv = product.old_price ?
            `<span class="sale_present">%${Math.floor((product.old_price - product.price) / product.old_price * 100)}</span>` : "";
        const usedLabel = product.type === "Used" ? `<div class="used_label">Used Item</div>` : "";

        container.innerHTML += `
            <div class="swiper-slide product" data-id="${product.id}">
                ${percentDiscDiv}
                ${usedLabel}
                <div class="img_product">
                    <a href="#"><img src="${product.image}" alt="${product.name}"></a>
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
                    ${oldPriceParagraph}
                </div>

                <div class="icons">
                    <span class="btn_add_cart" data-id="${product.id}">
                        <i class="fa-solid fa-cart-shopping"></i> add to cart
                    </span>
                    <button class="btn_add_wishlist" data-id="${product.id}">
                        <i class="fa-regular fa-heart"></i>
                    </button>
                </div>
            </div>
        `;
    });

    // Initialize cart button click handlers
    attachCartEventHandlers();
}





/**
 * Load Used Items category products
 */
function loadUsedItems() {
    // Skip on profile page
    if (isProfilePage()) {
        console.log('Profile page detected - skipping loadUsedItems');
        return;
    }

    let swiperContainer = document.getElementById("swiper_used_items");
    if (!swiperContainer) {
        console.log("Creating used items container");
        const mainContent = document.querySelector('main') || document.body;
        const newContainer = document.createElement('div');
        newContainer.id = "swiper_used_items";
        newContainer.className = 'swiper-container';
        mainContent.appendChild(newContainer);
        swiperContainer = newContainer;
    }

    // Use general products endpoint and filter instead
    fetch('/api/products')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data)) {
                console.warn('Expected array of products, but got:', typeof data);
                data = []; // Handle non-array response
            }

            // Filter for used items
            const usedItems = data.filter(product =>
                product.type === "Used" ||
                (product.category && product.category.toLowerCase().includes('used'))
            );

            const cart = JSON.parse(localStorage.getItem('cart')) || [];

            // Clear container before adding items
            swiperContainer.innerHTML = '';

            if (usedItems.length === 0) {
                swiperContainer.innerHTML = '<p>No used items found</p>';
                return;
            }

            // Render used items
            usedItems.forEach(product => {
                const isInCart = cart.some(cartItem => cartItem.id === product.id);
                const oldPriceParagraph = product.old_price ? `<p class="old_price">EGP ${product.old_price}</p>` : "";
                const percentDiscDiv = product.old_price ?
                    `<span class="sale_present">%${Math.floor((product.old_price - product.price) / product.old_price * 100)}</span>` : "";
                const usedLabel = `<div class="used_label">Used Item</div>`;

                swiperContainer.innerHTML += `
                    <div class="swiper-slide product" data-id="${product.id}">
                        ${percentDiscDiv}
                        ${usedLabel}
                        <div class="img_product">
                            <a href="#"><img src="${product.image || 'images/placeholder.jpg'}" alt="${product.name}"></a>
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
                            ${oldPriceParagraph}
                        </div>

                        <div class="icons">
                            <span class="btn_add_cart ${isInCart ? 'active' : ''}" data-id="${product.id}">
                                <i class="fa-solid fa-cart-shopping"></i> ${isInCart ? 'Item in cart' : 'add to cart'}
                            </span>
                            <button class="btn_add_wishlist" data-id="${product.id}">
                                <i class="fa-regular fa-heart"></i>
                            </button>
                        </div>
                    </div>
                `;
            });

            // Initialize cart button click handlers
            attachCartEventHandlers();
        })
        .catch(error => console.error('Error loading used items:', error));
}

/**
 * Attach click event listeners to cart buttons
 */
function attachCartEventHandlers() {
    const addToCartButtons = document.querySelectorAll(".btn_add_cart");

    addToCartButtons.forEach(button => {
        // Remove any existing event listeners to prevent duplicates
        button.removeEventListener("click", handleAddToCart);
        // Add new event listener
        button.addEventListener("click", handleAddToCart);
    });

    // Initialize wishlist buttons
    const wishlistButtons = document.querySelectorAll(".btn_add_wishlist");
    wishlistButtons.forEach(button => {
        button.removeEventListener("click", handleAddToWishlist);
        button.addEventListener("click", handleAddToWishlist);
    });
}

/**
 * Handle add to cart button clicks
 */
function handleAddToCart(event) {
    const button = event.currentTarget;
    const productId = button.getAttribute('data-id');

    // Fetch product details if not already in cart
    fetch('/api/products')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data)) {
                console.warn('Expected array of products, but got:', typeof data);
                throw new Error('Invalid product data');
            }

            const selectedProduct = data.find(product => product.id == productId);
            if (selectedProduct) {
                addToCart(selectedProduct);

                // Update all matching buttons
                const allMatchingButtons = document.querySelectorAll(`.btn_add_cart[data-id="${productId}"]`);
                allMatchingButtons.forEach(btn => {
                    btn.classList.add("active");
                    btn.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> Item in cart`;
                });
            } else {
                console.warn('Product not found:', productId);
            }
        })
        .catch(error => console.error('Error fetching product details:', error));
}

/**
 * Handle add to wishlist button clicks
 */
function handleAddToWishlist(event) {
    const button = event.currentTarget;
    const productId = button.getAttribute('data-id');
    console.log("Handling add to wishlist for product ID:", productId);

    // Use the unified getWishlistItems function if available
    let wishlist = [];
    if (typeof window.getWishlistItems === 'function') {
        wishlist = window.getWishlistItems();
    } else {
        // Fallback to local implementation
        wishlist = JSON.parse(localStorage.getItem('wishlistItems')) || [];
    }

    // Check if product is already in wishlist
    const isInWishlist = wishlist.some(item => item.id == productId);

    if (isInWishlist) {
        // Remove from wishlist
        wishlist = wishlist.filter(item => item.id != productId);
        button.classList.remove('active');

        // Update heart icon
        const heartIcon = button.querySelector('i');
        if (heartIcon) {
            heartIcon.className = 'fa-regular fa-heart';
        }

        // Save to both localStorage keys for compatibility
        localStorage.setItem('wishlistItems', JSON.stringify(wishlist));
        localStorage.setItem('wishlist', JSON.stringify(wishlist));

        // Update counts
        updateWishlistCount();

        // Update all wishlist buttons to ensure consistency
        updateWishlistButtons();

        // Update main wishlist UI if function exists
        if (typeof window.updateWishlist === 'function') {
            window.updateWishlist();
        }

        return;
    } else {
        // Add to wishlist - fetch product details
        fetch('/api/products')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                if (!Array.isArray(data)) {
                    console.warn('Expected array of products, but got:', typeof data);
                    throw new Error('Invalid product data');
                }

                const selectedProduct = data.find(product => product.id == productId);
                if (selectedProduct) {
                    wishlist.push(selectedProduct);

                    // Update button state
                    button.classList.add('active');

                    // Update heart icon
                    const heartIcon = button.querySelector('i');
                    if (heartIcon) {
                        heartIcon.className = 'fa-solid fa-heart';
                    }

                    // Save to both localStorage keys for compatibility
                    localStorage.setItem('wishlistItems', JSON.stringify(wishlist));
                    localStorage.setItem('wishlist', JSON.stringify(wishlist));

                    // Update counts and UI
                    updateWishlistCount();

                    // Update all wishlist buttons to ensure consistency
                    updateWishlistButtons();

                    // Update main wishlist UI if function exists
                    if (typeof window.updateWishlist === 'function') {
                        window.updateWishlist();
                    }
                }
            })
            .catch(error => console.error('Error fetching product for wishlist:', error));
        return;
    }
}

/**
 * Add product to cart
 */
function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Ensure product has valid price value
    if (product) {
        // Make sure price is a number
        if (product.price !== undefined) {
            try {
                const price = typeof product.price === 'number' ?
                    product.price : parseFloat(product.price);

                if (!isNaN(price)) {
                    product.price = price;
                } else {
                    product.price = 0;
                    console.warn('Invalid price converted to 0 for product:', product.name);
                }
            } catch (e) {
                product.price = 0;
                console.warn('Error parsing price, set to 0 for product:', product.name);
            }
        } else {
            product.price = 0;
        }
    }

    // Check if product is already in cart
    const existingProductIndex = cart.findIndex(item => item.id === product.id);

    if (existingProductIndex >= 0) {
        // Product already in cart, increase quantity
        cart[existingProductIndex].quantity = (cart[existingProductIndex].quantity || 1) + 1;
    } else {
        // Add new product to cart with normalized data
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image || product.img || 'images/placeholder.jpg',
            quantity: 1
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
}

/**
 * Update cart UI and counts
 */
function updateCart() {
    const cartItemsContainer = document.getElementById("cart_items");
    if (!cartItemsContainer) {
        console.error("Cart items container not found");
        return;
    }

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const checkoutItems = document.getElementById("checkout_items");

    if (checkoutItems) {
        checkoutItems.innerHTML = "";
    }

    let totalPrice = 0;
    let totalCount = 0;

    cartItemsContainer.innerHTML = "";

    cart.forEach((item, index) => {
        // Fix: Use item.image instead of item.img for consistency with database schema
        const itemImage = item.image || item.img || 'images/placeholder.jpg';

        // Make sure price is a valid number
        let itemPrice = 0;
        try {
            itemPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price || 0);
            if (isNaN(itemPrice)) itemPrice = 0;
        } catch (e) {
            console.warn('Invalid price value for cart item:', item.name, item.price);
            itemPrice = 0;
        }

        const itemQuantity = item.quantity || 1;
        const totalPriceItem = itemPrice * itemQuantity;

        totalPrice += totalPriceItem;
        totalCount += itemQuantity;

        // Format prices with toFixed only after ensuring they're numbers
        const formattedItemPrice = totalPriceItem.toFixed(2);

        cartItemsContainer.innerHTML += `
            <div class="item_cart">
                <img src="${itemImage}" alt="${item.name}">
                <div class="content">
                    <h4>${item.name}</h4>
                    <p class="price_cart">EGP ${formattedItemPrice}</p>
                    <div class="quantity_control">
                        <button class="decrease_quantity" data-index="${index}">-</button>
                        <span class="quantity">${itemQuantity}</span>
                        <button class="Increase_quantity" data-index="${index}">+</button>
                    </div>
                </div>
                <button class="delete_item" data-index="${index}"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        `;

        if (checkoutItems) {
            checkoutItems.innerHTML += `
                <div class="item_cart">
                    <div class="image_name">
                        <img src="${itemImage}" alt="${item.name}">
                        <div class="content">
                            <h4>${item.name}</h4>
                            <p class="price_cart">EGP ${formattedItemPrice}</p>
                            <div class="quantity_control">
                                <button class="decrease_quantity" data-index="${index}">-</button>
                                <span class="quantity">${itemQuantity}</span>
                                <button class="Increase_quantity" data-index="${index}">+</button>
                            </div>
                        </div>
                    </div>
                    <button class="delete_item" data-index="${index}"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            `;
        }
    });

    // Update price and count elements with safely formatted values
    const priceCartTotal = document.querySelector('.price_cart_toral');
    const countItemCart = document.querySelector('.count-item-cart');
    const countItemHeader = document.querySelector('.count_item_header');

    if (priceCartTotal) priceCartTotal.innerHTML = `EGP ${totalPrice.toFixed(2)}`;
    if (countItemCart) countItemCart.innerHTML = totalCount;
    if (countItemHeader) countItemHeader.innerHTML = totalCount;

    // Update checkout totals if on checkout page
    if (checkoutItems) {
        const subtotalCheckout = document.querySelector('.subtotal_checkout');
        const totalCheckout = document.querySelector('.total_checkout');

        if (subtotalCheckout) subtotalCheckout.innerHTML = `EGP ${totalPrice.toFixed(2)}`;
        if (totalCheckout) totalCheckout.innerHTML = `EGP ${(totalPrice + 50).toFixed(2)}`;
    }

    // Set up quantity control buttons
    const increaseButtons = document.querySelectorAll(".Increase_quantity");
    const decreaseButtons = document.querySelectorAll(".decrease_quantity");

    increaseButtons.forEach(button => {
        button.addEventListener("click", (event) => {
            const itemIndex = event.target.getAttribute("data-index");
            increaseQuantity(itemIndex);
        });
    });

    decreaseButtons.forEach(button => {
        button.addEventListener("click", (event) => {
            const itemIndex = event.target.getAttribute("data-index");
            decreaseQuantity(itemIndex);
        });
    });

    // Set up delete buttons
    const deleteButtons = document.querySelectorAll('.delete_item');
    deleteButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const itemIndex = event.target.closest('button').getAttribute('data-index');
            removeFromCart(itemIndex);
        });
    });
}

function getWishlistItems() {
    // Get wishlist items from local storage or return empty array if none
    const wishlistItems = localStorage.getItem('wishlistItems');
    return wishlistItems ? JSON.parse(wishlistItems) : [];
}

/**
 * Increase product quantity in cart
 */
function increaseQuantity(index) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart[index].quantity += 1;
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
}

/**
 * Decrease product quantity in cart
 */
function decreaseQuantity(index) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    if (cart[index].quantity > 1) {
        cart[index].quantity -= 1;
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
}

/**
 * Remove product from cart
 */
function removeFromCart(index) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const removedProduct = cart.splice(index, 1)[0];
    localStorage.setItem('cart', JSON.stringify(cart));

    // Update cart UI
    updateCart();

    // Update cart buttons state
    updateButtonsState(removedProduct.id);

    // Update wishlist buttons as well
    updateWishlistCartButtons(removedProduct.id, false);
}

/**
 * Update wishlist count in UI
 */
function updateWishlistCount() {
    // Get wishlist from multiple sources for compatibility
    let wishlistItems = [];
    if (typeof window.getWishlistItems === 'function') {
        wishlistItems = window.getWishlistItems();
    } else {
        wishlistItems = JSON.parse(localStorage.getItem('wishlistItems')) ||
            JSON.parse(localStorage.getItem('wishlist')) || [];
    }

    const count = wishlistItems.length;

    // Update all count elements on the page
    document.querySelectorAll('.wishlist_count, .Count_item_wishlist, .total_wishlist_count').forEach(el => {
        if (el) el.textContent = count;
    });

    console.log(`Updated wishlist count to ${count} across all elements`);
}

/**
 * Update wishlist cart buttons
 */
function updateWishlistCartButtons(productId, isInCart) {
    const wishlistCartButtons = document.querySelectorAll(`.wishlist .add_to_cart[data-id="${productId}"]`);

    wishlistCartButtons.forEach(button => {
        if (isInCart) {
            button.classList.add('in-cart');
            button.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> Added to Cart`;
        } else {
            button.classList.remove('in-cart');
            button.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> Add to Cart`;
        }
    });
}

/**
 * Update cart buttons state
 */
function updateButtonsState(productId) {
    const allMatchingButtons = document.querySelectorAll(`.btn_add_cart[data-id="${productId}"]`);
    allMatchingButtons.forEach(button => {
        button.classList.remove('active');
        button.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> Item in cart`;
    });
}

/**
 * Set up product modal functionality
 */
document.addEventListener('DOMContentLoaded', function() {
    // Create modal elements
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'product-modal-overlay';

    const modalContent = document.createElement('div');
    modalContent.className = 'product-modal-content';

    const closeButton = document.createElement('button');
    closeButton.className = 'product-modal-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', closeModal);

    modalContent.appendChild(closeButton);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Close modal when clicking outside content
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    // Function to set up event listeners for product cards
    function setupProductCardListeners() {
        const productCards = document.querySelectorAll('.product');

        productCards.forEach(card => {
            // If we've already set up this card, skip it
            if (card.dataset.modalInitialized) return;

            // Add click event to the product name and image
            const nameLink = card.querySelector('.name_product a');
            const imageLink = card.querySelector('.img_product a');

            [nameLink, imageLink].forEach(element => {
                if (!element) return;

                element.addEventListener('click', function(e) {
                    e.preventDefault();
                    openProductModal(card);
                });
            });

            // Make the entire card clickable
            card.addEventListener('click', function(e) {
                // Don't trigger if clicking on buttons
                if (!e.target.closest('.btn_add_cart') && !e.target.closest('.btn_add_wishlist')) {
                    openProductModal(card);
                }
            });

            // Mark card as initialized
            card.dataset.modalInitialized = 'true';
        });
    }

    // Function to open modal with product details
    function openProductModal(productCard) {
        // Clone the product card for the modal
        const productClone = productCard.cloneNode(true);
        productClone.classList.add('modal-product-card');

        // Make sure all links in the clone don't navigate away
        const cloneLinks = productClone.querySelectorAll('a');
        cloneLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
            });
        });

        // Make the "add to cart" button functional in the modal
        const addToCartBtn = productClone.querySelector('.btn_add_cart');
        if (addToCartBtn) {
            const originalBtn = productCard.querySelector('.btn_add_cart');
            addToCartBtn.addEventListener('click', function() {
                if (originalBtn && !originalBtn.classList.contains('active')) {
                    originalBtn.click();
                    this.classList.add('active');
                    this.innerHTML = '<i class="fa-solid fa-cart-shopping"></i> Item in cart';
                }
            });
        }

        // Make the wishlist button functional in the modal
        const wishlistBtn = productClone.querySelector('.btn_add_wishlist');
        if (wishlistBtn) {
            const originalWishlistBtn = productCard.querySelector('.btn_add_wishlist');
            wishlistBtn.addEventListener('click', function() {
                if (originalWishlistBtn) {
                    originalWishlistBtn.click();
                    // Toggle active class for visual feedback
                    if (originalWishlistBtn.classList.contains('active')) {
                        this.classList.add('active');
                    } else {
                        this.classList.remove('active');
                    }
                }
            });
        }

        // Clear previous content and add the cloned product
        modalContent.innerHTML = '';
        modalContent.appendChild(closeButton);
        modalContent.appendChild(productClone);

        // Show the modal with animation
        modalOverlay.style.display = 'flex';
        setTimeout(() => {
            modalOverlay.classList.add('active');
            modalContent.classList.add('active');
        }, 10);

        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
    }

    // Function to close modal
    function closeModal() {
        modalOverlay.classList.remove('active');
        modalContent.classList.remove('active');

        setTimeout(() => {
            modalOverlay.style.display = 'none';
        }, 300);

        // Re-enable body scrolling
        document.body.style.overflow = '';
    }

    // Set up event delegation for product containers
    const productContainers = [
        document.getElementById('swiper_items_sale'),
        document.getElementById('swiper_upper_Limb'),
        document.getElementById('swiper_Lower_Limb'),
        document.getElementById('swiper_used_items')
    ];

    // Use MutationObserver to detect when products are added
    productContainers.forEach(container => {
        if (!container) return;

        const observer = new MutationObserver(function() {
            setupProductCardListeners();
        });

        observer.observe(container, { childList: true });
    });

    // Initial setup for products already on the page
    setupProductCardListeners();
});

/**
 * Set up event listeners for product cards
 */
function setupProductCardListeners() {
    const productCards = document.querySelectorAll('.product');

    productCards.forEach(card => {
        // If we've already set up this card, skip it
        if (card.dataset.modalInitialized) return;

        // Add click event to the product name and image
        const nameLink = card.querySelector('.name_product a');
        const imageLink = card.querySelector('.img_product a');

        [nameLink, imageLink].forEach(element => {
            if (!element) return;

            element.addEventListener('click', function(e) {
                e.preventDefault();
                openProductModal(card);
            });
        });

        // Make the entire card clickable
        card.addEventListener('click', function(e) {
            // Don't trigger if clicking on buttons
            if (!e.target.closest('.btn_add_cart') && !e.target.closest('.btn_add_wishlist')) {
                openProductModal(card);
            }
        });

        // Mark card as initialized
        card.dataset.modalInitialized = 'true';
    });
}

/**
 * Open modal with product details
 */
function openProductModal(productCard) {
    // Clone the product card for the modal
    const productClone = productCard.cloneNode(true);
    productClone.classList.add('modal-product-card');

    const modalOverlay = document.querySelector('.product-modal-overlay');
    const modalContent = document.querySelector('.product-modal-content');
    const closeButton = document.querySelector('.product-modal-close');

    // Make sure all links in the clone don't navigate away
    const cloneLinks = productClone.querySelectorAll('a');
    cloneLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
        });
    });

    // Make the "add to cart" button functional in the modal
    const addToCartBtn = productClone.querySelector('.btn_add_cart');
    if (addToCartBtn) {
        const originalBtn = productCard.querySelector('.btn_add_cart');
        addToCartBtn.addEventListener('click', function() {
            if (originalBtn && !originalBtn.classList.contains('active')) {
                originalBtn.click();
                this.classList.add('active');
                this.innerHTML = '<i class="fa-solid fa-cart-shopping"></i> Item in cart';
            }
        });
    }

    // Make the wishlist button functional in the modal
    const wishlistBtn = productClone.querySelector('.btn_add_wishlist');
    if (wishlistBtn) {
        const originalWishlistBtn = productCard.querySelector('.btn_add_wishlist');
        wishlistBtn.addEventListener('click', function() {
            if (originalWishlistBtn) {
                originalWishlistBtn.click();
                // Toggle active class for visual feedback
                if (originalWishlistBtn.classList.contains('active')) {
                    this.classList.add('active');
                } else {
                    this.classList.remove('active');
                }
            }
        });
    }

    // Clear previous content and add the cloned product
    modalContent.innerHTML = '';
    modalContent.appendChild(closeButton);
    modalContent.appendChild(productClone);

    // Show the modal with animation
    modalOverlay.style.display = 'flex';
    setTimeout(() => {
        modalOverlay.classList.add('active');
        modalContent.classList.add('active');
    }, 10);

    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
}

/**
 * Close product modal
 */
function closeModal() {
    const modalOverlay = document.querySelector('.product-modal-overlay');
    const modalContent = document.querySelector('.product-modal-content');

    modalOverlay.classList.remove('active');
    modalContent.classList.remove('active');

    setTimeout(() => {
        modalOverlay.style.display = 'none';
    }, 300);

    // Re-enable body scrolling
    document.body.style.overflow = '';
}

// Add or modify the function that creates containers to ensure parent elements exist
function ensureContainersExist() {
    // Skip on profile page or other pages where we don't want to show product sliders
    if (isProfilePage() || isCheckoutPage() || isContactPage() || isAboutPage() || isRegularProductsPage()) {
        console.log('Page detected that should not show product sliders - skipping container creation');
        return;
    }

    // Use existing containers rather than creating new ones
    // Check if swiper containers already exist in the document
    const saleItemsSwiper = document.getElementById('swiper_items_sale');
    const lowerLimbSwiper = document.getElementById('swiper_Lower_Limb');
    const upperLimbSwiper = document.getElementById('swiper_upper_Limb');
    const usedItemsSwiper = document.getElementById('swiper_used_items');

    // If all needed containers exist, we don't need to create anything
    if (saleItemsSwiper && lowerLimbSwiper && upperLimbSwiper && usedItemsSwiper) {
        console.log("All product containers already exist in the document");
        return;
    }

    console.log("Some product containers are missing but we'll use existing ones instead of creating new ones");

    // We won't create new containers - the page should already have the containers defined in HTML
    // This prevents duplicate elements and unwanted <main> tags being added after the footer
}

// Function to safely get a container, creating it if needed
function safeGetContainer(containerId) {
    // Skip on profile page or other pages where we don't want to show product sliders
    if (isProfilePage() || isCheckoutPage() || isContactPage() || isAboutPage() || isRegularProductsPage()) {
        console.log(`Page detected that should not show product sliders - skipping container ${containerId}`);
        return null;
    }

    console.log(`Getting container: ${containerId}`);

    let mapping = {
        'sale_items_container': 'swiper_items_sale',
        'lower_limb_container': 'swiper_Lower_Limb',
        'upper_limb_container': 'swiper_upper_Limb',
        'used_items_container': 'swiper_used_items'
    };

    let actualId = mapping[containerId] || containerId;

    // Try to get the element
    let container = document.getElementById(actualId);

    // If the container doesn't exist, log a warning and return null
    // We won't try to create missing containers anymore
    if (!container) {
        console.warn(`Container ${actualId} not found in the document`);
        return null;
    }

    return container;
}

// Fetch Sale Items
function fetchSaleItems() {
    // Skip on profile page
    if (isProfilePage()) {
        console.log('Profile page detected - skipping fetchSaleItems');
        return;
    }

    // Use general products endpoint instead of "/api/products/sales" that returns 404
    fetch('/api/products')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            // Handle non-array responses
            if (!Array.isArray(data)) {
                console.warn('Expected array of products, but got:', typeof data);
                data = []; // Handle non-array response
            }

            // Filter products with old_price or discount (on sale)
            const saleItems = data.filter(product =>
                product.old_price || (product.discount && product.discount > 0)
            );

            const container = safeGetContainer('sale_items_container');

            if (container) {
                // Clear existing items
                container.innerHTML = '';

                if (saleItems.length === 0) {
                    container.innerHTML = '<p>No sale items found</p>';
                    return;
                }

                // Add each sale item to the container
                saleItems.forEach(item => {
                    container.innerHTML += createProductCard(item);
                });

                // Initialize swiper if needed
                initializeSaleItemsSwiper();
            } else {
                console.warn('Sale items container not found, but was safely handled');
            }
        })
        .catch(error => {
            console.error('Error fetching sale items:', error);
        });
}

// Fetch Used Items
function fetchUsedItems() {
    // Skip on profile page
    if (isProfilePage()) {
        console.log('Profile page detected - skipping fetchUsedItems');
        return;
    }

    // Use general products endpoint instead of "/api/products/used" that returns 404
    fetch('/api/products')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            // Handle non-array responses
            if (!Array.isArray(data)) {
                console.warn('Expected array of products, but got:', typeof data);
                data = []; // Handle non-array response
            }

            // Filter for used items
            const usedItems = data.filter(product =>
                product.type === "Used" ||
                (product.category && product.category.toLowerCase().includes('used'))
            );

            const container = safeGetContainer('used_items_container');

            if (container) {
                // Clear existing items
                container.innerHTML = '';

                if (usedItems.length === 0) {
                    container.innerHTML = '<p>No used items found</p>';
                    return;
                }

                // Add each used item to the container
                usedItems.forEach(item => {
                    container.innerHTML += createProductCard(item);
                });

                // Initialize swiper if needed
                initializeUsedItemsSwiper();
            } else {
                console.warn('Used items container not found, but was safely handled');
            }
        })
        .catch(error => {
            console.error('Error fetching used items:', error);
        });
}

// Create a product card
function createProductCard(product) {
    // Make sure product has a price and it's a number
    if (!product.price && product.price !== 0) {
        product.price = 0;
    }

    // Ensure price is a number
    let price = 0;
    try {
        price = typeof product.price === 'number' ? product.price : parseFloat(product.price);
        if (isNaN(price)) price = 0;
    } catch (e) {
        console.warn('Invalid price value:', product.price);
        price = 0;
    }

    // Set the product price to the parsed number
    product.price = price;

    // Check for old_price to create discount display
    const hasOldPrice = product.old_price && parseFloat(product.old_price) > price;
    const originalPrice = hasOldPrice ? parseFloat(product.old_price) : price;
    const discountedPrice = price;

    // Calculate discount percentage if old price exists
    const discountPercentage = hasOldPrice
        ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
        : 0;

    // Ensure both prices are valid numbers before using toFixed
    const originalPriceFormatted = !isNaN(originalPrice) ? originalPrice.toFixed(2) : "0.00";
    const discountedPriceFormatted = !isNaN(discountedPrice) ? discountedPrice.toFixed(2) : "0.00";

    // Use image or img field, whichever is available
    const imageUrl = product.image || product.img || 'images/placeholder.jpg';

    // Check if product is in cart
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const isInCart = cart.some(cartItem => cartItem.id === product.id);

    // Format according to original site's HTML structure
    return `
    <div class="swiper-slide product" data-id="${product.id}">
        ${hasOldPrice ? `<span class="sale_present">%${discountPercentage}</span>` : ''}
        ${product.type === 'Used' ? '<div class="used_label">Used Item</div>' : ''}
        <div class="img_product">
            <a href="#"><img src="${imageUrl}" alt="${product.name}"></a>
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
            <p><span>EGP ${discountedPriceFormatted}</span></p>
            ${hasOldPrice ? `<p class="old_price">EGP ${originalPriceFormatted}</p>` : ''}
        </div>

        <div class="icons">
            <span class="btn_add_cart ${isInCart ? 'active' : ''}" data-id="${product.id}">
                <i class="fa-solid fa-cart-shopping"></i> ${isInCart ? 'Item in cart' : 'add to cart'}
            </span>
            <button class="btn_add_wishlist" data-id="${product.id}">
                <i class="fa-regular fa-heart"></i>
            </button>
        </div>
    </div>
    `;
}

// Initialize swiper for sale items
function initializeSaleItemsSwiper() {
    // Skip on profile page
    if (isProfilePage()) {
        console.log('Profile page detected - skipping initializeSaleItemsSwiper');
        return;
    }

    console.log('Initializing sale items swiper');
    try {
        // Get the swiper container element
        const swiperContainer = document.getElementById('swiper_items_sale');
        if (!swiperContainer) {
            console.warn('Swiper container for sale items not found');
            return;
        }

        // Make sure we have items to display
        if (swiperContainer.querySelectorAll('.product').length === 0) {
            console.warn('No sale items found for swiper');
            return;
        }

        // Add swiper-slide class to each product card if needed
        swiperContainer.querySelectorAll('.product').forEach(card => {
            if (!card.classList.contains('swiper-slide')) {
                card.classList.add('swiper-slide');
            }
        });

        // Initialize swiper with safer transform settings
        const swiperElement = swiperContainer.closest('.slide_product');

        // Check if swiper is already initialized
        if (swiperElement.swiper) {
            console.log('Swiper already initialized for sale items, destroying first');
            swiperElement.swiper.destroy(true, true);
        }

        // Create new swiper instance with safe transform settings
        const swiper = new Swiper(swiperElement, {
            slidesPerView: 1,
            spaceBetween: 10,
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            breakpoints: {
                640: {
                    slidesPerView: 2,
                    spaceBetween: 20,
                },
                768: {
                    slidesPerView: 3,
                    spaceBetween: 30,
                },
                1024: {
                    slidesPerView: 4,
                    spaceBetween: 40,
                },
            },
            // Avoid CSS transform issues
            on: {
                init: function() {
                    console.log('Sale items swiper initialized safely');
                }
            }
        });

        console.log('Sale items swiper initialized');
    } catch (error) {
        console.error('Error initializing sale items swiper:', error);
    }
}

// Initialize swiper for lower limb products
function initializeLowerLimbSwiper() {
    // Skip on profile page
    if (isProfilePage()) {
        console.log('Profile page detected - skipping initializeLowerLimbSwiper');
        return;
    }

    console.log('Initializing lower limb swiper');
    try {
        // Get the swiper container element
        const swiperContainer = document.getElementById('swiper_Lower_Limb');
        if (!swiperContainer) {
            console.warn('Swiper container for lower limb products not found');
            return;
        }

        // Make sure we have items to display
        if (swiperContainer.querySelectorAll('.product').length === 0) {
            console.warn('No lower limb products found for swiper');
            return;
        }

        // Add swiper-slide class to each product card if needed
        swiperContainer.querySelectorAll('.product').forEach(card => {
            if (!card.classList.contains('swiper-slide')) {
                card.classList.add('swiper-slide');
            }
        });

        // Initialize swiper with safer transform settings
        const swiperElement = swiperContainer.closest('.slide_product');

        // Check if swiper is already initialized
        if (swiperElement.swiper) {
            console.log('Swiper already initialized for lower limb items, destroying first');
            swiperElement.swiper.destroy(true, true);
        }

        // Create new swiper instance with safe transform settings
        const swiper = new Swiper(swiperElement, {
            slidesPerView: 1,
            spaceBetween: 10,
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            breakpoints: {
                640: {
                    slidesPerView: 2,
                    spaceBetween: 20,
                },
                768: {
                    slidesPerView: 3,
                    spaceBetween: 30,
                },
                1024: {
                    slidesPerView: 4,
                    spaceBetween: 40,
                },
            },
            // Avoid CSS transform issues
            on: {
                init: function() {
                    console.log('Lower limb swiper initialized safely');
                }
            }
        });

        console.log('Lower limb swiper initialized');
    } catch (error) {
        console.error('Error initializing lower limb swiper:', error);
    }
}

// Initialize swiper for upper limb products
function initializeUpperLimbSwiper() {
    // Skip on profile page
    if (isProfilePage()) {
        console.log('Profile page detected - skipping initializeUpperLimbSwiper');
        return;
    }

    console.log('Initializing upper limb swiper');
    try {
        // Get the swiper container element
        const swiperContainer = document.getElementById('swiper_upper_Limb');
        if (!swiperContainer) {
            console.warn('Swiper container for upper limb products not found');
            return;
        }

        // Make sure we have items to display
        if (swiperContainer.querySelectorAll('.product').length === 0) {
            console.warn('No upper limb products found for swiper');
            return;
        }

        // Add swiper-slide class to each product card if needed
        swiperContainer.querySelectorAll('.product').forEach(card => {
            if (!card.classList.contains('swiper-slide')) {
                card.classList.add('swiper-slide');
            }
        });

        // Initialize swiper with safer transform settings
        const swiperElement = swiperContainer.closest('.slide_product');

        // Check if swiper is already initialized
        if (swiperElement.swiper) {
            console.log('Swiper already initialized for upper limb items, destroying first');
            swiperElement.swiper.destroy(true, true);
        }

        // Create new swiper instance with safe transform settings
        const swiper = new Swiper(swiperElement, {
            slidesPerView: 1,
            spaceBetween: 10,
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            breakpoints: {
                640: {
                    slidesPerView: 2,
                    spaceBetween: 20,
                },
                768: {
                    slidesPerView: 3,
                    spaceBetween: 30,
                },
                1024: {
                    slidesPerView: 4,
                    spaceBetween: 40,
                },
            },
            // Avoid CSS transform issues
            on: {
                init: function() {
                    console.log('Upper limb swiper initialized safely');
                }
            }
        });

        console.log('Upper limb swiper initialized');
    } catch (error) {
        console.error('Error initializing upper limb swiper:', error);
    }
}

// Initialize swiper for used items
function initializeUsedItemsSwiper() {
    // Skip on profile page
    if (isProfilePage()) {
        console.log('Profile page detected - skipping initializeUsedItemsSwiper');
        return;
    }

    console.log('Initializing used items swiper');
    try {
        // Get the swiper container element
        const swiperContainer = document.getElementById('swiper_used_items');
        if (!swiperContainer) {
            console.warn('Swiper container for used items not found');
            return;
        }

        // Make sure we have items to display
        if (swiperContainer.querySelectorAll('.product').length === 0) {
            console.warn('No used items found for swiper');
            return;
        }

        // Add swiper-slide class to each product card if needed
        swiperContainer.querySelectorAll('.product').forEach(card => {
            if (!card.classList.contains('swiper-slide')) {
                card.classList.add('swiper-slide');
            }
        });

        // Initialize swiper with safer transform settings
        const swiperElement = swiperContainer.closest('.slide_product');

        // Check if swiper is already initialized
        if (swiperElement.swiper) {
            console.log('Swiper already initialized for used items, destroying first');
            swiperElement.swiper.destroy(true, true);
        }

        // Create new swiper instance with safe transform settings
        const swiper = new Swiper(swiperElement, {
            slidesPerView: 1,
            spaceBetween: 10,
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            breakpoints: {
                640: {
                    slidesPerView: 2,
                    spaceBetween: 20,
                },
                768: {
                    slidesPerView: 3,
                    spaceBetween: 30,
                },
                1024: {
                    slidesPerView: 4,
                    spaceBetween: 40,
                },
            },
            // Avoid CSS transform issues
            on: {
                init: function() {
                    console.log('Used items swiper initialized safely');
                }
            }
        });

        console.log('Used items swiper initialized');
    } catch (error) {
        console.error('Error initializing used items swiper:', error);
    }
}

function fetchLowerLimbProducts() {
    return new Promise((resolve, reject) => {
        fetch('/api/products/category/Lower-Limb')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                resolve(data);
            })
            .catch(error => {
                console.error('Error fetching Lower Limb products:', error);

            });
    });
}

function fetchUpperLimbProducts() {
    return new Promise((resolve, reject) => {
        fetch('/api/products/category/Upper-Limb')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                resolve(data);
            })
            .catch(error => {
                console.error('Error fetching Upper Limb products:', error);
                // Fallback to mock data if API fails
                resolve(getMockUpperLimbProducts());
            });
    });
}

// First, add a function to check if we're on the profile page
function isProfilePage() {
    const path = window.location.pathname.toLowerCase();
    return path.includes('profile.html') || path.endsWith('/profile') || path.includes('/profile/');
}

// Add function to check if we're on checkout page
function isCheckoutPage() {
    return window.location.pathname.includes('checkout.html');
}

// Add functions for other pages where sliders should be disabled
function isContactPage() {
    return window.location.pathname.includes('contact.html');
}

function isAboutPage() {
    return window.location.pathname.includes('About.html');
}

function isRegularProductsPage() {
    return window.location.pathname.includes('products.html');
}

/**
 * Update all wishlist buttons to reflect current localStorage state
 */
function updateWishlistButtons() {
    // Get all wishlist items
    let wishlistItems = [];

    // Use the favorite.js function if available
    if (typeof window.getWishlistItems === 'function') {
        wishlistItems = window.getWishlistItems();
    } else {
        // Fallback to both localStorage keys for maximum compatibility
        try {
            const wishlistStandard = JSON.parse(localStorage.getItem('wishlist')) || [];
            const wishlistItemsData = JSON.parse(localStorage.getItem('wishlistItems')) || [];

            // Merge both arrays and remove duplicates
            wishlistItems = [...wishlistStandard, ...wishlistItemsData].filter(item => item && item.id);
        } catch (error) {
            console.error('Error getting wishlist items:', error);
            wishlistItems = [];
        }
    }

    console.log(`Updating ${wishlistItems.length} wishlist items on buttons`);

    // Get array of just the IDs for easier comparison
    // Convert all IDs to strings for consistent comparison
    const wishlistIds = wishlistItems.map(item => String(item.id));

    // Update all wishlist buttons on the page
    const wishlistButtons = document.querySelectorAll('.btn_add_wishlist');
    console.log(`Found ${wishlistButtons.length} wishlist buttons to update`);

    wishlistButtons.forEach(button => {
        const productId = String(button.getAttribute('data-id'));
        const heartIcon = button.querySelector('i');

        // Check if this product is in the wishlist
        const isInWishlist = wishlistIds.includes(productId);

        // Update button state
        if (isInWishlist) {
            button.classList.add('active');
            if (heartIcon) {
                heartIcon.className = 'fa-solid fa-heart';
            }
        } else {
            button.classList.remove('active');
            if (heartIcon) {
                heartIcon.className = 'fa-regular fa-heart';
            }
        }
    });

    // Update wishlist count as well to ensure it's always synchronized
    updateWishlistCount();
}
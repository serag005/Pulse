// dynamic header swapping

// Function to fix inconsistent auth state
function fixAuthState() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    // If we have user data but no token, this is inconsistent
    if (!token && userData) {
        console.log("Inconsistent auth state detected: User data exists but token is missing");
        console.log("Attempting to fix by logging out...");

        // Clear all auth data to fix the inconsistency
        localStorage.removeItem('user');

        // Optional: Force reload the page to reset all state
        // location.reload();

        return false;
    }

    // If we have a token but no user data, this is also inconsistent
    if (token && !userData) {
        console.log("Inconsistent auth state detected: Token exists but user data is missing");
        console.log("Attempting to fix by logging out...");

        // Clear all auth data to fix the inconsistency
        localStorage.removeItem('token');

        return false;
    }

    return token !== null;
}

// Function to create and insert the appropriate header based on login status
function insertHeader() {
    // Fix any inconsistent auth state first
    const isAuthenticated = fixAuthState();

    // Check token directly in localStorage for debugging
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    console.log("Debug - token in localStorage:", token);
    console.log("Debug - user in localStorage:", userData);

    // Check if isLoggedIn function exists and use it
    let userIsLoggedIn = isAuthenticated;

    console.log("Final auth state - User is logged in:", userIsLoggedIn);

    // Define both header versions
    const loggedInHeader = `
      <header>
          <div class="top_header">
              <div class="container">
                  <a href="index.html" class="logo"> <img src="images/LOG.png" alt=""></a>
                  <form action="" class="search_box">
                      <div class="select_box">
                          <select id="category" name="category">
                              <option value="All Categories">All Categories</option>
                              <option value="Used Items">Used Item</option>
                              <option value="Upper_Limb">Upper_Limb</option>
                              <option value="Lower_Limb">Lower_Limb</option>
                              <option value="Accessories">Accessories</option>
                          </select>
                      </div>
                      <input type="text" name="search" id="search" placeholder="Search for Products" required>
                      <button type="submit">
                          <i class="fa-solid fa-magnifying-glass"></i>
                      </button>
                  </form>
                
                  <div class="header_icons">
                  
                    <div class="auth_box">
                      <a href="index.html" class="btn btn2 logout-btn">Log Out<i class="fa-solid fa-right-to-bracket"></i></a>
                    </div>
                  
                   <div class="icon profile">
                       <i class="fa-solid fa-user" onclick="window.location.href='profile.html'"></i>
                      </div>
                      <div class="icon">
                          <div class="btn_wishlist_toggle" onclick="open_close_wishlist()">
                              <i class="fa-solid fa-heart"></i>
                              <span class="wishlist_count">0</span>
                          </div>
                      </div>
                      <div onclick="open_close_cart()" class="icon">
                          <i class="fa-solid fa-cart-shopping"></i>
                          <span class="count count_item_header">0</span>
                      </div>
                  </div>
              </div>
          </div>
          <div class="bottom_header">
              <div class="container">
                  <nav class="nav">
                      <span onclick="open_Menu()" class="open_menu"><i class="fa-solid fa-bars"></i></span>
                      <div class="category_nav">
                          <div onclick="Open_Categ_list()" class="category_btn">
                              <i class="fa-solid fa-bars"></i>
                              <p>Browse Category</p>
                              <i class="fa-solid fa-angle-down"></i>
                          </div>
                          <div class="category_nav_list">
                              <a href="#top-offers">Top 10 Offers</a>
                              <a href="#Upper_Limb">New Arrivals</a>
                              <a href="#Lower_Limb">Top Rated</a>
                              <a href="#Used Items">Used Items</a>
                          </div>
                      </div>
                      <ul class="nav_links">
                          <span onclick="open_Menu()" class="close_menu"><i class="fa-regular fa-circle-xmark"></i></span>
                          <li ><a href="index.html">Home</a></li>
                          <li><a href="About.html">About Us</a></li>
                          <li><a href="products.html">All Products</a></li>
                          <li><a href="contact.html">Contact Us</a></li>
                      </ul>
                  </nav>
                  <div class="volunteer-supplier btns">
                      <a href="Volunteers.html" class="btn">Become a Volunteer  <i class="fa-solid fa-user-plus"></i></a>
                      <a href="Suppliers.html" class="btn">Become a Supplier <i class="fa-solid fa-user-plus"></i></a>
                  </div>
              </div>
          </div>
      </header>
      `;

    const notLoggedInHeader = `
      <header>
          <div class="top_header">
              <div class="container">
                  <a href="index.html" class="logo"> <img src="images/LOG.png" alt=""></a>
                  <form action="" class="search_box">
                      <div class="select_box">
                          <select id="category" name="category">
                              <option value="All Categories">All Categories</option>
                              <option value="Used Items">Used Item</option>
                              <option value="Upper_Limb">Upper_Limb</option>
                              <option value="Lower_Limb">Lower_Limb</option>
                              <option value="Accessories">Accessories</option>
                          </select>
                      </div>
                      <input type="text" name="search" id="search" placeholder="Search for Products" required>
                      <button type="submit">
                          <i class="fa-solid fa-magnifying-glass"></i>
                      </button>
                  </form>
               
                  <div class="header_icons">
                  
                     <div class="auth_box">
                      <a href="Login Page.html" class="btn">Log In<i class="fa-solid fa-right-to-bracket"></i></a>
                     </div>
                     
                      <div class="icon">
                          <div class="btn_wishlist_toggle" onclick="open_close_wishlist()">
                              <i class="fa-solid fa-heart"></i>
                              <span class="wishlist_count">0</span>
                          </div>
                      </div>
                      <div onclick="open_close_cart()" class="icon">
                          <i class="fa-solid fa-cart-shopping"></i>
                          <span class="count count_item_header">0</span>
                      </div>
                  </div>
              </div>
          </div>
          <div class="bottom_header">
              <div class="container">
                  <nav class="nav">
                      <span onclick="open_Menu()" class="open_menu"><i class="fa-solid fa-bars"></i></span>
                      <div class="category_nav">
                          <div onclick="Open_Categ_list()" class="category_btn">
                              <i class="fa-solid fa-bars"></i>
                              <p>Browse Category</p>
                              <i class="fa-solid fa-angle-down"></i>
                          </div>
                          <div class="category_nav_list">
                              <a href="#top-offers">Top 10 Offers</a>
                              <a href="#Upper_Limb">New Arrivals</a>
                              <a href="#Lower_Limb">Top Rated</a>
                              <a href="#Used Items">Used Items</a>
                          </div>
                      </div>
                      <ul class="nav_links">
                          <span onclick="open_Menu()" class="close_menu"><i class="fa-regular fa-circle-xmark"></i></span>
                          <li ><a href="index.html">Home</a></li>
                          <li><a href="About.html">About Us</a></li>
                          <li><a href="products.html">All Products</a></li>
                          <li><a href="contact.html">Contact Us</a></li>
                      </ul>
                  </nav>
                  <div class="volunteer-supplier btns">
                      <a href="Volunteers.html" class="btn">Become a Volunteer  <i class="fa-solid fa-user-plus"></i></a>
                      <a href="Suppliers.html" class="btn">Become a Supplier <i class="fa-solid fa-user-plus"></i></a>
                  </div>
              </div>
          </div>
      </header>
      `;

    // Insert the appropriate header
    const body = document.body;

    // Find and remove any existing header
    const existingHeader = document.querySelector('header');
    if (existingHeader) {
        existingHeader.remove();
    }

    // Insert the new header at the beginning of the body
    body.insertAdjacentHTML('afterbegin', userIsLoggedIn ? loggedInHeader : notLoggedInHeader);

    console.log("Header inserted:", userIsLoggedIn ? "logged in" : "not logged in");

    // After DOM is updated, attach event handlers
    setTimeout(() => {
        updateCounts();
        attachHeaderEvents();
        initCartSync();
        setActiveNavLink();

        // Explicitly attach wishlist toggle button event listeners
        const wishlistToggleButtons = document.querySelectorAll('.btn_wishlist_toggle');
        console.log(`Header.js: Found ${wishlistToggleButtons.length} wishlist toggle buttons`);

        wishlistToggleButtons.forEach(button => {
            button.addEventListener('click', function() {
                console.log("Wishlist toggle clicked from header.js listener");
                open_close_wishlist();
            });
        });

        // Add null checks for containers
        safelyInitializeContainers();
    }, 100);
}

// Add function to handle missing containers for items_home.js
function safelyInitializeContainers() {
    // Create containers if they don't exist
    const containers = [
        'sale_items_container',
        'lower_limb_container',
        'Upper_limb_container',
        'used_items_container'
    ];

    const mainContent = document.querySelector('main') || document.body;

    containers.forEach(containerId => {
        if (!document.getElementById(containerId)) {
            console.log(`Creating missing container: ${containerId}`);
            const containerDiv = document.createElement('div');
            containerDiv.id = containerId;
            containerDiv.className = 'product-container';
            containerDiv.style.display = 'none'; // Hide it if not needed
            mainContent.appendChild(containerDiv);
        }
    });
}

// Add function to explicitly check auth state for debugging
function checkAuthState() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    console.log("Authentication check:");
    console.log("- Token exists:", token !== null);
    console.log("- User exists:", user !== null);

    if (typeof window.isLoggedIn === 'function') {
        console.log("- isLoggedIn() says:", window.isLoggedIn());
    }

    return token !== null;
}

// Initialize everything on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log("Header.js: Initializing UI components");

    // Fix auth state first
    fixAuthState();

    // Check auth state
    checkAuthState();

    // Insert dynamic header
    insertHeader();

    // Initialize cart if cart items container exists
    if (document.getElementById("cart_items")) {
        updateCart();
    } else {
        // Still update counts even if full cart UI isn't present
        updateCounts();
    }

    // Initialize wishlist
    const wishlistContainer = document.querySelector('.wishlist');
    if (wishlistContainer) {
        console.log("Wishlist container found, initializing wishlist");
        const wishlistItemsContainer = document.getElementById("wishlist_items") ||
            document.querySelector(".items_in_wishlist");
        if (wishlistItemsContainer) {
            console.log("Wishlist items container found");
        } else {
            console.log("Wishlist items container not found, but main container exists");
        }
        updateWishlist();
    } else {
        console.log("No wishlist container found in DOM");
    }

    // Make sure product buttons reflect current state
    updateProductButtonStates();

    // Listen for storage events to detect changes from other tabs
    window.addEventListener('storage', function(e) {
        // Handle auth changes
        if (e.key === 'token' || e.key === 'user') {
            console.log("Auth data changed in another tab, updating header");
            insertHeader();
        }

        // Handle wishlist changes
        if (e.key === 'wishlist' || e.key === 'wishlistItems') {
            console.log("Wishlist data changed in another tab, updating wishlist");
            updateWishlist();
            updateCounts();
        }

        // Handle cart changes
        if (e.key === 'cart') {
            console.log("Cart data changed in another tab, updating cart");
            if (typeof updateCart === 'function') {
                updateCart();
            } else {
                updateCounts();
            }
        }
    });
});

// Make auth check available globally
window.checkAuthState = checkAuthState;
window.fixAuthState = fixAuthState;

/**
 * Get wishlist items from localStorage
 */
function getWishlistItems() {
    // Use favorite.js implementation if available (preferred)
    if (typeof window.getWishlistItems === 'function' && window.getWishlistItems !== getWishlistItems) {
        return window.getWishlistItems();
    }

    // Fallback implementation
    try {
        // For compatibility, support both keys
        const wishlistStandard = JSON.parse(localStorage.getItem('wishlist')) || [];
        const wishlistItems = JSON.parse(localStorage.getItem('wishlistItems')) || [];

        // Use whichever has items, standardize on both keys
        const result = wishlistItems.length > 0 ? wishlistItems : wishlistStandard;
        localStorage.setItem('wishlist', JSON.stringify(result));
        localStorage.setItem('wishlistItems', JSON.stringify(result));

        return result;
    } catch (error) {
        console.error('Error retrieving wishlist items:', error);
        return [];
    }
}

function Open_Categ_list() {
    const categoryNavList = document.querySelector('.category_nav_list');
    if (categoryNavList) {
        categoryNavList.classList.toggle('active');
    }
}

/**
 * Update wishlist and cart counts
 */
function updateCounts() {
    // First update wishlist count
    if (typeof window.updateWishlistCount === 'function') {
        window.updateWishlistCount();
    } else {
        // Fallback implementation
        const wishlistCount = getWishlistItems().length;
        document.querySelectorAll('.wishlist_count, .Count_item_wishlist').forEach(el => {
            if (el) el.textContent = wishlistCount;
        });
    }

    // Then update cart count
    const cartCountEl = document.querySelector('.count_item_header');
    if (cartCountEl) {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        let totalCount = 0;
        cart.forEach(item => {
            totalCount += (item.quantity || 1);
        });
        cartCountEl.textContent = totalCount;
    }
}

/**
 * Get cart items - using the correct localStorage key
 */
function getCartItems() {
    try {
        // Modified to get 'cart' since that's the key used in updateCart()
        return JSON.parse(localStorage.getItem('cart')) || [];
    } catch (e) {
        console.error('Error retrieving cart items:', e);
        return [];
    }
}

/**
 * Re-attach event listeners after DOM manipulation
 */
function attachHeaderEvents() {
    // Reattach logout functionality
    const logoutButton = document.querySelector('.logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
}

/**
 * Log the user out
 */
function logout() {
    console.log("Logout called");

    // Remove auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Show not logged in header
    insertHeader();

    // Redirect to index page instead of login page
    window.location.href = 'index.html';
}

/**
 * Toggle wishlist visibility
 */
function open_close_wishlist() {
    // Use favorite.js implementation if available (preferred)
    if (typeof window.open_close_wishlist === 'function' && window.open_close_wishlist !== open_close_wishlist) {
        window.open_close_wishlist();
        return;
    }

    // Fallback implementation
    const wishlist = document.querySelector('.wishlist');
    if (wishlist) {
        wishlist.classList.toggle('active');
    } else {
        console.error('Wishlist element not found');
    }
}

// Store nav_links reference at runtime instead of immediately
function open_Menu() {
    const nav_links = document.querySelector(".nav_links");
    if (nav_links) {
        nav_links.classList.toggle("active");
    }
}

function setActiveNavLink() {
    // Get the current page URL path (e.g., "/about.html")
    const currentPage = window.location.pathname;

    // Extract just the filename from the path
    const currentFile = currentPage.split('/').pop();

    // Get all navigation links
    const navLinks = document.querySelectorAll('.nav_links li a');

    // Loop through each nav link
    navLinks.forEach(link => {
        // Get the href attribute and extract just the filename
        const linkHref = link.getAttribute('href');
        const linkFile = linkHref.split('/').pop();

        // Only add active class if the filenames match exactly
        if (currentFile === linkFile) {
            // Add active class to the parent li element
            link.parentElement.classList.add('active');
        } else {
            // Remove active class if it exists (in case of navigation without page reload)
            link.parentElement.classList.remove('active');
        }
    });
}

function open_close_cart() {
    // Find the cart element when the function is actually called
    const cart = document.querySelector('.cart');
    if (cart) {
        cart.classList.toggle("active");
    }
}

// Fetch products and attach event listeners
if (typeof fetch !== 'undefined') {
    fetch('/api/products')
        .then(response => response.json())
        .then(data => {

            const addToCartButtons = document.querySelectorAll(".btn_add_cart");

            addToCartButtons.forEach(button => {
                button.addEventListener("click", (event) => {
                    const productId = event.target.getAttribute('data-id');
                    const selectedProduct = data.find(product => product.id == productId);

                    if (selectedProduct) {
                        addToCart(selectedProduct);

                        const allMatchingButtons = document.querySelectorAll(`.btn_add_cart[data-id="${productId}"]`);

                        allMatchingButtons.forEach(btn => {
                            btn.classList.add("active");
                            btn.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> Item in cart`;
                        });
                    }
                });
            });
        })
        .catch(error => {
            console.error('Error fetching products:', error);
        });
}

function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Make sure we store the image whether it's in "image" or "img" property
    const productWithImage = {
        ...product,
        image: product.image || product.img,
        img: product.img || product.image,
        quantity: 1
    };

    cart.push(productWithImage);
    localStorage.setItem('cart', JSON.stringify(cart));

    updateCart();

    // Update header counts immediately after updating cart
    updateCounts();
}

function updateCart() {
    const cartItemsContainer = document.getElementById("cart_items");

    // If cart container doesn't exist, just update counts
    if (!cartItemsContainer) {
        updateCounts();
        return;
    }

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const checkout_items = document.getElementById("checkout_items");

    if (checkout_items) {
        checkout_items.innerHTML = "";
    }

    var total_Price = 0;
    var total_count = 0;

    cartItemsContainer.innerHTML = "";
    cart.forEach((item, index) => {
        // Ensure the image path exists - use either image or img property
        const imagePath = item.image || item.img || 'images/placeholder.png';
        let total_Price_item = item.price * item.quantity;

        total_Price += total_Price_item;
        total_count += item.quantity;

        cartItemsContainer.innerHTML += `
            <div class="item_cart">
                <img src="${imagePath}" alt="${item.name}" onerror="this.src='images/placeholder.png'">
                <div class="content">
                    <h4>${item.name}</h4>
                    <p class="price_cart">EGP ${total_Price_item}</p>
                    <div class="quantity_control">
                        <button class="decrease_quantity" data-index=${index}>-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="Increase_quantity" data-index=${index}>+</button>
                    </div>
                </div>

                <button class="delete_item" data-index="${index}" ><i class="fa-solid fa-trash-can"></i></button>
            </div>
        `;

        if (checkout_items) {
            checkout_items.innerHTML += `
             <div class="item_cart">
                <div class="image_name">
                    <img src="${imagePath}" alt="${item.name}" onerror="this.src='images/placeholder.png'">
                    <div class="content">
                        <h4>${item.name}</h4>
                        <p class="price_cart">EGP ${total_Price_item}</p>
                        <div class="quantity_control">
                            <button class="decrease_quantity" data-index=${index}>-</button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="Increase_quantity" data-index=${index}>+</button>
                        </div>
                    </div>
                </div>
                <button class="delete_item" data-index="${index}"><i class="fa-solid fa-trash-can"></i></button>
             </div>
            `;
        }
    });

    const price_cart_total = document.querySelector('.price_cart_toral');
    const count_item_cart = document.querySelector('.count-item-cart');
    const count_item_header = document.querySelector('.count_item_header');



    if (price_cart_total) {
        price_cart_total.innerHTML = `EGP ${total_Price}`;
    }

    if (count_item_cart) {
        count_item_cart.innerHTML = total_count;
    }

    if (count_item_header) {
        count_item_header.innerHTML = total_count;
    }

    if (checkout_items) {
        const subtotal_checkout = document.querySelector('.subtotal_checkout');
        const total_checkout = document.querySelector('.total_checkout');

        if (subtotal_checkout) {
            subtotal_checkout.innerHTML = `EGP ${total_Price}`;
        }

        if (total_checkout) {
            total_checkout.innerHTML = `EGP ${total_Price + 50}`;
        }
    }

    // Attach event listeners to quantity controls
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

    // Attach event listeners to delete buttons
    const deleteButtons = document.querySelectorAll('.delete_item');

    deleteButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const itemIndex = event.target.closest('button').getAttribute('data-index');
            removeFromCart(itemIndex);
        });
    });

    // Update header counts after everything is done
    updateCounts();
}

function increaseQuantity(index) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart[index].quantity += 1;
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
}

function decreaseQuantity(index) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    if (cart[index].quantity > 1) {
        cart[index].quantity -= 1;
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
}

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

function updateButtonsState(productId) {
    const allMatchingButtons = document.querySelectorAll(`.btn_add_cart[data-id="${productId}"]`);
    allMatchingButtons.forEach(button => {
        button.classList.remove('active');
        button.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> add to cart`;
    });
}

// ADDED: Function to update button states based on cart/wishlist content
function updateProductButtonStates() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartIds = cart.map(i => i.id);
    const wishlist = getWishlistItems();
    const wishlistIds = wishlist.map(item => String(item.id));

    console.log(`Updating button states: ${cart.length} cart items, ${wishlist.length} wishlist items`);

    // Update cart buttons
    document.querySelectorAll('.btn_add_cart').forEach(btn => {
        const pid = btn.dataset.id;
        if (cartIds.includes(Number(pid))) {
            btn.classList.add('active');
            btn.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> Item in cart`;
        } else {
            btn.classList.remove('active');
            btn.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> Add to cart`;
        }
    });

    // Update wishlist buttons
    document.querySelectorAll('.btn_add_wishlist').forEach(button => {
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

// Phone validation code
let headerPhoneInput = document.getElementById('phone');
if (headerPhoneInput) {
    const phoneError = document.getElementById('phoneError');

    // Add event listener for input changes
    headerPhoneInput.addEventListener('input', function(e) {
        // Remove any non-numeric characters
        this.value = this.value.replace(/\D/g, '');

        // Limit to 11 digits
        if (this.value.length > 11) {
            this.value = this.value.slice(0, 11);
        }

        // Check if it's a valid Egyptian mobile number
        validatePhoneNumber();
    });
}

// Function to validate the phone number
function validatePhoneNumber() {
    const phoneInput = document.getElementById('phone');
    const phoneError = document.getElementById('phoneError');

    if (!phoneInput || !phoneError) return true;

    const phoneNumber = phoneInput.value;
    const validPrefix = /^01[0125]\d{8}$/.test(phoneNumber);

    if (phoneNumber.length > 0 && (!validPrefix || phoneNumber.length !== 11)) {
        phoneError.style.display = 'block';
        return false;
    } else {
        phoneError.style.display = 'none';
        return true;
    }
}

// Form validation function
function validateForm() {
    return validatePhoneNumber();
}

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

// Implement updateWishlist if it doesn't exist in favorite.js
function updateWishlist() {
    // Use favorite.js implementation if available (preferred)
    if (typeof window.updateWishlist === 'function' && window.updateWishlist !== updateWishlist) {
        window.updateWishlist();
        return;
    }

    // Fallback implementation - simplified version
    // Try multiple possible selectors for the wishlist container
    const wishlistContainer = document.getElementById("wishlist_items") ||
        document.querySelector(".items_in_wishlist");

    if (!wishlistContainer) {
        console.log("Wishlist container not found in header.js");
        updateCounts();
        return;
    }

    console.log("Found wishlist container in header.js:", wishlistContainer);

    const wishlist = getWishlistItems();
    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Clear container
    wishlistContainer.innerHTML = '';

    // Empty message if needed
    if (wishlist.length === 0) {
        wishlistContainer.innerHTML = '<div class="empty-wishlist"><p>Your wishlist is empty</p></div>';
        updateCounts();
        return;
    }

    // Add items
    wishlist.forEach((item, index) => {
        const isInCart = cart.some(cartItem => cartItem.id == item.id);
        const imgSrc = item.img || item.image || 'images/placeholder.png';

        wishlistContainer.innerHTML += `
            <div class="item_wishlist">
                <img src="${imgSrc}" alt="${item.name}" onerror="this.src='images/placeholder.png'">
                <div class="content">
                    <h4>${item.name}</h4>
                    <p class="price_wishlist">EGP ${item.price}</p>
                </div>
                <div class="action_buttons">
                    <button class="add_to_cart ${isInCart ? 'in-cart' : ''}" data-id="${item.id}">
                        <i class="fa-solid fa-cart-shopping"></i> ${isInCart ? 'Added to Cart' : 'Add to Cart'}
                    </button>
                    <button class="remove_wishlist" data-index="${index}">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
    });

    // Add event listeners
    const removeButtons = wishlistContainer.querySelectorAll('.remove_wishlist');
    removeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            removeFromWishlist(index);
        });
    });

    const addToCartButtons = wishlistContainer.querySelectorAll('.add_to_cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            if (typeof window.addToCartFromWishlist === 'function') {
                window.addToCartFromWishlist(productId, this);
            } else {
                // Fallback
                const product = getWishlistItems().find(item => item.id == productId);
                if (product) {
                    addToCart(product);
                    this.classList.add('in-cart');
                    this.innerHTML = '<i class="fa-solid fa-cart-shopping"></i> Added to Cart';
                }
            }
        });
    });

    // Update counts
    updateCounts();
}

function removeFromWishlist(index) {
    // Use favorite.js implementation if available (preferred)
    if (typeof window.removeFromWishlist === 'function' && window.removeFromWishlist !== removeFromWishlist) {
        window.removeFromWishlist(index);
        return;
    }

    // Fallback implementation
    const wishlist = getWishlistItems();
    wishlist.splice(index, 1);

    // Update both localStorage keys
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    localStorage.setItem('wishlistItems', JSON.stringify(wishlist));

    // Update UI
    updateWishlist();
}

// Make functions globally available
window.open_close_cart = open_close_cart;
window.open_close_wishlist = open_close_wishlist;
window.Open_Categ_list = Open_Categ_list;
window.open_Menu = open_Menu;
window.updateCounts = updateCounts;
window.getCartItems = getCartItems;
window.getWishlistItems = getWishlistItems;
window.removeFromWishlist = removeFromWishlist;
window.logout = logout;

// Ensure counts are updated whenever the page is shown (including from bfcache)
window.addEventListener('pageshow', function(event) {
    // Update counts whether page is loaded from cache or not
    updateCounts();

    // Also update product button states
    updateProductButtonStates();
});

// Also update when products are loaded (if we're on the products page)
if (window.location.pathname.includes('products.html')) {
    setTimeout(updateProductButtonStates, 1000);
    setTimeout(updateProductButtonStates, 2000);
}

// Event listeners for search form and category select
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM content loaded - initializing header functionality');

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

            // Only navigate if there's a search value
            if (searchValue.trim() !== '') {
                // Navigate to products page with search parameters
                window.location.href = 'products.html' +
                    '?category=' + encodeURIComponent(categoryValue) +
                    '&search=' + encodeURIComponent(searchValue);
            } else {
                // If no search value but category is selected
                if (categoryValue !== 'All Categories') {
                    window.location.href = 'products.html' +
                        '?category=' + encodeURIComponent(categoryValue);
                }
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


// JS for products page: load and filter products
function loadAndFilterProducts() {
    console.log('Loading and filtering products');

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const categoryFilter = urlParams.get('category');
    const searchFilter = urlParams.get('search') ? urlParams.get('search').toLowerCase() : '';

    // Determine API endpoint based on filters
    let apiUrl = '/api/products';

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
    // This approach allows us to combine search and category filtering more effectively
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
                    product.name.toLowerCase().includes(searchFilter)
                );
            }

            // Always show the product counter when filtering is applied
            if (searchFilter || (categoryFilter && categoryFilter !== 'All Categories')) {
                updateProductCounter(filteredProducts.length, searchFilter, categoryFilter);
            } else {
                // Hide counter when not filtering
                removeProductCounter();
            }

            // Ensure counter is always visible for category filtering
            if (categoryFilter && categoryFilter !== 'All Categories') {
                updateProductCounter(filteredProducts.length, searchFilter, categoryFilter);
            }

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

// Attach event listeners to cart buttons
function attachCartButtonListeners(products) {
    console.log('Attaching cart button listeners');

    document.querySelectorAll('.btn_add_cart').forEach(btn => {
        // Remove any existing listeners to prevent duplicates
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent modal from opening

            const productId = this.getAttribute('data-id');
            console.log('Add to cart clicked for product ID:', productId);

            // Find the product in our data
            const productToAdd = products.find(item => item.id == productId);

            if (productToAdd) {
                console.log('Adding product to cart:', productToAdd.name);

                // Handle the case where the product might already be in localStorage
                let cart = JSON.parse(localStorage.getItem('cart')) || [];

                // Check if product already exists in cart
                const existingProductIndex = cart.findIndex(item => item.id == productId);

                if (existingProductIndex >= 0) {
                    // Update quantity if product exists
                    cart[existingProductIndex].quantity = (cart[existingProductIndex].quantity || 1) + 1;
                } else {
                    // Add new product with quantity 1
                    cart.push({...productToAdd, quantity: 1});
                }

                // Save updated cart to localStorage
                localStorage.setItem('cart', JSON.stringify(cart));

                // Update all matching button UI states
                document.querySelectorAll(`.btn_add_cart[data-id="${productId}"]`).forEach(el => {
                    el.classList.add('active');
                    el.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> Item in cart`;
                });

                // Call updateCart from header.js if it exists
                if (typeof updateCart === 'function') {
                    updateCart();
                } else {
                    console.log('updateCart function not found - cart UI may not update immediately');

                    // Implement a basic cart count update
                    updateCartCount(cart.length);
                }
            } else {
                console.error('Product not found for ID:', productId);
            }
        });
    });
}

// Function to update cart count in the header
function updateCartCount(count) {
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = count;
        cartCountElement.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

// Function to generate product HTML
function generateProductHTML(product, cart) {
    const isInCart = cart.some(cartItem => cartItem.id == product.id);
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
                <button class="btn_add_wishlist" data-id="${product.id}">
                    <i class="fa-regular fa-heart"></i>
                </button>
            </div>
        </div>
    `;
}

// Function to update product counter with improved messaging
function updateProductCounter(count, searchTerm, category) {
    // Create or get the counter element
    let counterElement = document.querySelector('.product-counter');

    if (!counterElement) {
        counterElement = document.createElement('div');
        counterElement.className = 'product-counter';

        // Insert after header
        const header = document.querySelector('header');
        if (header) {
            header.insertAdjacentElement('afterend', counterElement);
        }
    }

    // Create a more specific message based on the filters applied
    let message = `${count} products found`;

    if (searchTerm && category && category !== 'All Categories') {
        message = `${count} "${searchTerm}" products found in ${category}`;
    } else if (searchTerm) {
        message = `${count} "${searchTerm}" products found`;
    } else if (category && category !== 'All Categories') {
        message = `${count} products found in ${category}`;
    }

    // Update counter text
    counterElement.textContent = message;
    counterElement.style.display = 'block';
}

// Function to remove product counter
function removeProductCounter() {
    const counterElement = document.querySelector('.product-counter');
    if (counterElement) {
        counterElement.style.display = 'none';
    }
}



// Handle category navigation
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.category_nav_list a').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault(); // Prevent default anchor behavior

            const targetId = this.getAttribute('href').substring(1); // Get the target section ID

            if (!window.location.pathname.endsWith('index.html')) {
                // Redirect to index.html with the target ID as a query parameter
                window.location.href = `index.html?target=${targetId}`;
            } else {
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    const offset = 170; // Adjust this value for the desired space from the top
                    const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
                    const offsetPosition = elementPosition - offset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth' // Smooth scrolling
                    });
                }
            }
        });
    });

    // Handle scrolling to the target section if redirected to index.html
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('target');

    if (targetId) {
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
            const offset = 170; // Adjust this value for the desired space from the top
            const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
            const offsetPosition = elementPosition - offset;

            setTimeout(() => {
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'auto' // Smooth scrolling
                });
            }, 10);
        }
    }
});
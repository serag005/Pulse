/**
 * Checkout System
 * Handles the checkout process, form submission and order creation
 */

// DOM Elements
let checkoutForm;
let checkoutItemsContainer;
let subtotalElement;
let totalElement;
let itemsInput;
let totalPriceInput;
let countItemsInput;
let submitButton;
let phoneInput;
let phoneError;

// Init function to set up checkout page
document.addEventListener('DOMContentLoaded', function() {
  console.log('Checkout page initialized');
  
  // Initialize form elements
  initElements();
  
  // Set up event handlers
  setupEventHandlers();
  
  // Load cart data and update UI
  updateOrderSummary();
  
  // Auto-fill user information if logged in
  fillUserInfo();
});

/**
 * Initialize DOM references
 */
function initElements() {
  checkoutForm = document.getElementById('form_contact');
  checkoutItemsContainer = document.getElementById('checkout_items');
  subtotalElement = document.querySelector('.subtotal_checkout');
  totalElement = document.querySelector('.total_checkout');
  itemsInput = document.getElementById('items');
  totalPriceInput = document.getElementById('total_Price');
  countItemsInput = document.getElementById('count_Items');
  submitButton = document.querySelector('.button_div button[type="submit"]');
  phoneInput = document.getElementById('phone');
  phoneError = document.getElementById('phoneError');
  
  // Log initialization status
  console.log('Form elements initialized:', {
    form: !!checkoutForm,
    itemsContainer: !!checkoutItemsContainer,
    subtotalElement: !!subtotalElement,
    totalElement: !!totalElement,
    itemsInput: !!itemsInput,
    totalPriceInput: !!totalPriceInput,
    countItemsInput: !!countItemsInput,
    submitButton: !!submitButton,
    phoneInput: !!phoneInput,
    phoneError: !!phoneError
  });
}

/**
 * Set up event handlers
 */
function setupEventHandlers() {
  // Phone validation
  if (phoneInput) {
    phoneInput.addEventListener('input', function() {
      validatePhoneNumber();
    });
  }
  
  // Form submission
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handleFormSubmit);
    console.log('Form submit handler attached');
  } else {
    console.error('Checkout form not found, submit handler not attached');
  }
}

/**
 * Get cart items from localStorage
 */
function getCartItems() {
  try {
    const cartData = localStorage.getItem('cart');
    if (!cartData) {
      console.log('No cart data found in localStorage');
      return [];
    }
    
    const cart = JSON.parse(cartData);
    if (!Array.isArray(cart)) {
      console.warn('Cart data is not an array:', cart);
      return [];
    }
    
    console.log(`Retrieved ${cart.length} items from cart`);
    return cart;
  } catch (error) {
    console.error('Error retrieving cart items:', error);
    return [];
  }
}

/**
 * Update order summary with cart data
 */
function updateOrderSummary() {
  const cart = getCartItems();
  
  // Clear container
  if (checkoutItemsContainer) {
    checkoutItemsContainer.innerHTML = '';
  }
  
  // Handle empty cart
  if (cart.length === 0) {
    if (checkoutItemsContainer) {
      checkoutItemsContainer.innerHTML = '<p>Your cart is empty. Please add items before checkout.</p>';
    }
    
    if (subtotalElement) subtotalElement.textContent = 'EGP 0.00';
    if (totalElement) totalElement.textContent = 'EGP 50.00'; // Just shipping
    
    // Disable submit button
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.style.opacity = '0.5';
      submitButton.style.cursor = 'not-allowed';
    }
    
    // Set form values
    if (itemsInput) itemsInput.value = '[]';
    if (totalPriceInput) totalPriceInput.value = '50';
    if (countItemsInput) countItemsInput.value = '0';
    
    return;
  }
  
  // Enable submit button
  if (submitButton) {
    submitButton.disabled = false;
    submitButton.style.opacity = '1';
    submitButton.style.cursor = 'pointer';
  }
  
  // Calculate totals and normalize cart
  let subtotal = 0;
  let totalItems = 0;
  const normalizedCart = [];
  
  // Process each cart item
  cart.forEach((item, index) => {
    console.log(`Processing cart item ${index}:`, item);
    
    // Ensure valid price
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity) || 1;
    const itemTotal = price * quantity;
    
    // Update totals
    subtotal += itemTotal;
    totalItems += quantity;
    
    // Add normalized item to array
    normalizedCart.push({
      id: item.id,
      name: item.name || 'Product',
      price: price,
      quantity: quantity,
      image: item.image || item.img || 'images/placeholder.jpg'
    });
    
    // Add item to UI
    if (checkoutItemsContainer) {
      checkoutItemsContainer.innerHTML += `
        <div class="item">
          <div class="item_img">
            <img src="${item.image || item.img || 'images/placeholder.jpg'}" alt="${item.name || 'Product'}">
          </div>
          <div class="item_details">
            <h3>${item.name || 'Product'}</h3>
            <p>Quantity: ${quantity}</p>
            <p>Price: EGP ${price.toFixed(2)}</p>
          </div>
        </div>
      `;
    }
  });
  
  // Set totals in UI
  const shipping = 50.00;
  const total = subtotal + shipping;
  
  if (subtotalElement) subtotalElement.textContent = `EGP ${subtotal.toFixed(2)}`;
  if (totalElement) totalElement.textContent = `EGP ${total.toFixed(2)}`;
  
  // Set form values
  if (itemsInput) {
    const jsonString = JSON.stringify(normalizedCart);
    itemsInput.value = jsonString;
    console.log('Set items input value:', jsonString);
  }
  
  if (totalPriceInput) {
    totalPriceInput.value = total.toString();
    console.log('Set total price input value:', total);
  }
  
  if (countItemsInput) {
    countItemsInput.value = totalItems.toString();
    console.log('Set count items input value:', totalItems);
  }
  
  console.log('Order summary updated with:', {
    subtotal: subtotal,
    shipping: shipping,
    total: total,
    items: normalizedCart.length
  });
}

/**
 * Validate Egyptian phone number
 */
function validatePhoneNumber() {
  if (!phoneInput || !phoneError) return true;
  
  const phoneNumber = phoneInput.value.trim();
  const isValid = /^01[0125]\d{8}$/.test(phoneNumber);
  
  phoneError.style.display = isValid || phoneNumber === '' ? 'none' : 'block';
  return isValid;
}

/**
 * Fill user info from localStorage
 */
function fillUserInfo() {
  try {
    const userData = localStorage.getItem('user');
    if (!userData) {
      console.log('No user data found for auto-fill');
      return;
    }
    
    const user = JSON.parse(userData);
    console.log('Found user data for auto-fill:', user);
    
    // Fill in form fields
    const emailInput = document.getElementById('email');
    const nameInput = document.getElementById('name');
    const addressInput = document.getElementById('address');
    
    if (emailInput && user.email) emailInput.value = user.email;
    if (nameInput && user.name) nameInput.value = user.name;
    if (phoneInput && user.phone) phoneInput.value = user.phone;
    if (addressInput && user.address) addressInput.value = user.address;
    
    console.log('Auto-filled user information');
  } catch (error) {
    console.error('Error filling user info:', error);
  }
}

/**
 * Get token from localStorage
 */
function getToken() {
  const token = localStorage.getItem('token');
  console.log('Retrieved token:', token ? 'Token exists' : 'Token missing');
  return token;
}

/**
 * Get current user data
 */
function getCurrentUser() {
  try {
    const userData = localStorage.getItem('user');
    if (!userData) {
      console.log('No user data found');
      return null;
    }
    
    const user = JSON.parse(userData);
    console.log('Retrieved user data:', user);
    return user;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}

/**
 * Handle form submission
 */
function handleFormSubmit(event) {
  event.preventDefault();
  console.log('Form submission started');
  
  // Check if cart is empty
  const cart = getCartItems();
  if (cart.length === 0) {
    alert('Your cart is empty. Please add items before checkout.');
    return;
  }
  
  // Validate phone number
  if (!validatePhoneNumber() && phoneInput.value.trim() !== '') {
    alert('Please enter a valid Egyptian phone number.');
    return;
  }
  
  // Get form data
  const formData = new FormData(checkoutForm);
  console.log('Form fields:', Array.from(formData.entries()));
  
  // Get user data
  const userData = getCurrentUser();
  
  // Prepare order data - match the backend checkout.js expected format
  const orderData = {
    items: itemsInput.value || '[]',
    totalPrice: totalPriceInput.value || '0',
    countItems: countItemsInput.value || '0',
    email: formData.get('email'),
    name: formData.get('name'),
    address: formData.get('address'), 
    phone: formData.get('phone')
  };
  
  // Add user ID if available
  if (userData && userData.id) {
    orderData.user_id = userData.id;
  }
  
  console.log('Prepared order data:', orderData);
  
  // Check authentication
  const token = getToken();
  if (!token) {
    alert('You must be logged in to place an order.');
    localStorage.setItem('redirectUrl', window.location.href);
    window.location.href = 'Login Page.html';
    return;
  }
  
  // Show loading state
  toggleLoadingState(true);
  
  // Send order to API - use checkout endpoint that will forward to orders API
  console.log('Sending order to API...');
  fetch('/api/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(orderData)
  })
  .then(async response => {
    // Parse response
    console.log('Received response status:', response.status);
    let responseText = await response.text();
    console.log('Response text:', responseText); // Log raw response for debugging
    let data;
    
    try {
      data = JSON.parse(responseText);
      console.log('Parsed response data:', data);
    } catch (e) {
      console.error('Failed to parse JSON response:', responseText);
      data = { message: responseText };
    }
    
    // Handle error responses
    if (!response.ok) {
      const errorMsg = data.message || data.error || response.statusText;
      console.error('Request failed:', response.status, errorMsg, data);
      throw new Error(`${response.status}: ${errorMsg}`);
    }
    
    return data;
  })
  .then(data => {
    // Order successful
    console.log('Order created successfully:', data);
    alert('Your order has been placed successfully!');
    
    // Clear cart
    localStorage.removeItem('cart');
    
    // Redirect
    window.location.href = 'index.html';
  })
  .catch(error => {
    console.error('Error placing order:', error);
    console.error('Error details:', error.stack || 'No stack trace available');
    
    // Show detailed error information in console for debugging
    console.error('Error object:', error);
    
    // Check for authentication errors
    if (error.message.includes('401') || error.message.includes('403')) {
      alert('Your session has expired. Please log in again.');
      localStorage.setItem('redirectUrl', window.location.href);
      localStorage.removeItem('token');
      window.location.href = 'Login Page.html';
      return;
    }
    
    // Show general error
    alert(`Error placing order: ${error.message}`);
  })
  .finally(() => {
    toggleLoadingState(false);
    console.log('Order submission process completed');
  });
}

/**
 * Toggle loading state for submit button
 */
function toggleLoadingState(isLoading) {
  if (!submitButton) return;
  
  if (isLoading) {
    submitButton.disabled = true;
    submitButton.innerText = 'Processing...';
    submitButton.style.opacity = '0.7';
    console.log('Set button to loading state');
  } else {
    submitButton.disabled = false;
    submitButton.innerText = 'Place Order';
    submitButton.style.opacity = '1';
    console.log('Reset button state');
  }
}
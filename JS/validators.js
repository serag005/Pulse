// Input validation functions

function validatePhoneNumber(phone) {
    const egyptianPhoneRegex = /^01[0125]\d{8}$/;
    return egyptianPhoneRegex.test(phone);
  }
  
  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  module.exports = {
    validatePhoneNumber,
    validateEmail
  };
  
  // couponService.js - Coupon validation and discount calculation
  
  // In a real application, these would be stored in a database
  const validCoupons = {
    'WELCOME10': { type: 'percentage', value: 10 },
    'SUMMER25': { type: 'percentage', value: 25 },
    'DISCOUNT50': { type: 'fixed', value: 50 },
    'FREE100': { type: 'fixed', value: 100 }
  };
  
  function applyCoupon(couponCode, subtotal) {
    const coupon = validCoupons[couponCode];
    
    if (!coupon) {
      return {
        success: false,
        message: 'Invalid coupon code'
      };
    }
    
    let discount = 0;
    
    if (coupon.type === 'percentage') {
      discount = subtotal * (coupon.value / 100);
    } else if (coupon.type === 'fixed') {
      discount = Math.min(coupon.value, subtotal); // Cannot discount more than the subtotal
    }
    
    const newTotal = subtotal - discount;
    
    return {
      success: true,
      message: `Coupon applied successfully! You saved EGP ${discount.toFixed(2)}`,
      discount: discount.toFixed(2),
      newSubtotal: newTotal.toFixed(2),
      newTotal: (newTotal + 50).toFixed(2) // Adding shipping cost of EGP 50
    };
  }
  
  module.exports = {
    applyCoupon
  };
  
  // orderService.js - Order processing and storage
  
  // This needs real database values b2a
  const orders = [];
  let orderCounter = 1000;
  
  async function saveOrder(orderData) {
    // database operation
    const orderId = `ORD-${orderCounter++}`;
    
    const order = {
      orderId,
      ...orderData,
      status: 'pending'
    };
    
    orders.push(order);
    
    // Simulate database operation delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log(`Order ${orderId} saved successfully`);
    return orderId;
  }
  
  function getOrder(orderId) {
    return orders.find(order => order.orderId === orderId);
  }
  
  function getAllOrders() {
    return orders;
  }
  
  module.exports = {
    saveOrder,
    getOrder,
    getAllOrders
  };
  
  // public/js/checkout.js - Client-side JavaScript to enhance the checkout page
  

  
  function loadCartItems() {
    const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    const checkoutItemsContainer = document.getElementById('checkout_items');
    const subtotalElement = document.querySelector('.subtotal_checkout');
    const totalElement = document.querySelector('.total_checkout');
    
    let subtotal = 0;
    let itemsHtml = '';
    
    if (cartItems.length === 0) {
      checkoutItemsContainer.innerHTML = '<p>Your cart is empty</p>';
      subtotalElement.textContent = 'EGP 0.00';
      totalElement.textContent = 'EGP 50.00'; // hipping cost
      return;
    }
    
    cartItems.forEach(item => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;
      
      itemsHtml += `
        <div class="item">
          <div class="item_info">
            <h3>${item.name}</h3>
            <p>Quantity: ${item.quantity}</p>
            <p>Price: EGP ${item.price.toFixed(2)}</p>
          </div>
          <div class="item_total">
            <p>EGP ${itemTotal.toFixed(2)}</p>
          </div>
        </div>
      `;
    });
    
    checkoutItemsContainer.innerHTML = itemsHtml;
    subtotalElement.textContent = `EGP ${subtotal.toFixed(2)}`;
    
    const total = subtotal + 50; // Adding shipping cost
    totalElement.textContent = `EGP ${total.toFixed(2)}`;
    
    // Set the hidden inputs
    document.getElementById('items').value = JSON.stringify(cartItems);
    document.getElementById('total_Price').value = total.toFixed(2);
    document.getElementById('count_Items').value = cartItems.length;
  }
  
  function setupFormSubmission() {
    const form = document.getElementById('form_contact');
    
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = new FormData(form);
      const jsonData = {};
      
      formData.forEach((value, key) => {
        jsonData[key] = value;
      });
      
      // Add coupon if applied
      const couponInput = document.getElementById('coupon');
      if (couponInput.value) {
        jsonData['couponCode'] = couponInput.value;
      }
      
      fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonData)
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('Order placed successfully! Order ID: ' + data.orderId);
          localStorage.removeItem('cart'); // Clear the cart
          window.location.href = '/order-confirmation.html?id=' + data.orderId;
        } else {
          alert('Error: ' + data.message);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while processing your order');
      });
    });
  }
  
  function setupCouponButton() {
    const couponButton = document.querySelector('.btn_coupon button');
    
    couponButton.addEventListener('click', function(e) {
      e.preventDefault();
      
      const couponCode = document.getElementById('coupon').value;
      if (!couponCode) {
        alert('Please enter a coupon code');
        return;
      }
      
      const subtotalElement = document.querySelector('.subtotal_checkout');
      const subtotal = parseFloat(subtotalElement.textContent.replace('EGP ', ''));
      
      fetch('/api/validate-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          couponCode,
          subtotal
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert(data.message);
          subtotalElement.textContent = `EGP ${data.newSubtotal}`;
          document.querySelector('.total_checkout').textContent = `EGP ${data.newTotal}`;
          document.getElementById('total_Price').value = data.newTotal;
        } else {
          alert(data.message);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while validating the coupon');
      });
    });
  }
  
  function setupPhoneValidation() {
    const phoneInput = document.getElementById('phone');
    const phoneError = document.getElementById('phoneError');
    
    phoneInput.addEventListener('input', function() {
      const isValid = validatePhoneNumber(this.value);
      phoneError.style.display = isValid ? 'none' : 'block';
    });
    
    function validatePhoneNumber(phone) {
      const egyptianPhoneRegex = /^01[0125]\d{8}$/;
      return egyptianPhoneRegex.test(phone);
    }
  }
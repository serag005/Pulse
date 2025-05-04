// auth.js - Consolidated authentication system

// Check if user is logged in
function isLoggedIn() {
  return localStorage.getItem('token') !== null;
}

// Get the current user's token
function getToken() {
  return localStorage.getItem('token');
}

// Get the current user's data
function getCurrentUser() {
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
}

// Log the user out
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Redirect to login page
  window.location.href = 'Login Page.html';
}

// Protect routes that require authentication
function protectRoute() {
  if (!isLoggedIn()) {
      // Save the current URL to redirect back after login
      localStorage.setItem('redirectUrl', window.location.href);
      // Redirect to login
      window.location.href = 'Login Page.html';
      return false;
  }
  return true;
}

// Update UI based on authentication status
function updateAuthUI() {
  const loggedIn = isLoggedIn();
  const user = getCurrentUser();

  // Update login/logout buttons
  const loginButtons = document.querySelectorAll('.login-button');
  const logoutButtons = document.querySelectorAll('.logout-button');
  const userInfoElements = document.querySelectorAll('.user-info');

  if (loginButtons) {
      loginButtons.forEach(button => {
          button.style.display = loggedIn ? 'none' : 'inline-block';
      });
  }

  if (logoutButtons) {
      logoutButtons.forEach(button => {
          button.style.display = loggedIn ? 'inline-block' : 'none';
          if (loggedIn) {
              button.addEventListener('click', function(e) {
                  e.preventDefault();
                  logout();
              });
          }
      });
  }

  if (userInfoElements && loggedIn && user) {
      userInfoElements.forEach(element => {
          element.textContent = `Welcome, ${user.name || user.email || user.phone}`;
          element.style.display = 'inline-block';
      });
  }
}

// Execute when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Update UI based on auth status
  updateAuthUI();
  
  // Check if we need to protect this route
  if (document.body.hasAttribute('data-protected') && !protectRoute()) {
      return; // Stop execution if redirect happened
  }
  
  // Run any page-specific initialization that needs auth
  if (typeof initializePage === 'function') {
      initializePage();
  }
});

// Email Login Handler

document.addEventListener('DOMContentLoaded', function() {
  const emailForm = document.getElementById('email-login-form');
  if (emailForm) {
      emailForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const emailInput = document.getElementById('email');
        const emailPassword = document.getElementById('email-password');
        const emailError = document.getElementById('email-error');
        const passwordError = document.getElementById('password-error');

        const email = emailInput.value;
        const password = emailPassword.value;

        emailError.style.display = 'none';
        passwordError.style.display = 'none';

        if (!email) {
            emailError.style.display = 'block';
            return;
        }

        if (!password) {
            passwordError.style.display = 'block';
            return;
        }

        const loginData = {
            email,
            password
        };

        // Show loading state
        const submitBtn = emailForm.querySelector('.sign-in-btn');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Signing in...";

        fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        })
        .then(async response => {
          const text = await response.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch {
            data = text;
          }
        
          if (!response.ok) {
            // pull out a helpful message if the server gave one
            const msg = (data && (data.message || data.error)) || response.statusText;
            console.error('Order API failed:', response.status, msg, data);
            throw new Error(`Server ${response.status}: ${msg}`);
          }
        
          return data;
        })
        
        .then(data => {
            if (data.success) {
                // Store token and user data consistently
                localStorage.setItem('token', data.token || data.user.token);
                
                // Save user data in a consistent format
                const userData = {
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.name || data.user.email
                };
                localStorage.setItem('user', JSON.stringify(userData));
                
                // Show success UI
                const loginSuccessModal = document.getElementById('login-success-modal');
                loginSuccessModal.style.display = 'block';
                
                // Redirect to dashboard or saved URL
                setTimeout(function() {
                    const redirectUrl = localStorage.getItem('redirectUrl') || '/index.html';
                    window.location.href = redirectUrl;
                    localStorage.removeItem('redirectUrl');
                }, 1500);
            } else {
                alert('❌ ' + (data.error || data.message || 'Login failed'));
                // Reset button
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        })
        .catch(error => {
            alert('⚠️ ' + error);
            // Reset button
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        });
      });
  }

  // Phone Login Handler
  const phoneForm = document.getElementById('phone-login-form');
  if (phoneForm) {
      phoneForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const phoneInput = document.getElementById('phone');
        const phonePassword = document.getElementById('phone-password');
        const phoneError = document.getElementById('phone-error');
        const phonePasswordError = document.getElementById('phone-password-error');

        const phone = phoneInput.value;
        const password = phonePassword.value;

        phoneError.style.display = 'none';
        phonePasswordError.style.display = 'none';

        if (!phone) {
            phoneError.style.display = 'block';
            return;
        }

        if (!password) {
            phonePasswordError.style.display = 'block';
            return;
        }

        const loginData = {
            phone,
            password
        };

        // Show loading state
        const submitBtn = phoneForm.querySelector('.sign-in-btn');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Signing in...";

        fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        })
        .then(async response => {
          const text = await response.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch {
            data = text;
          }
        
          if (!response.ok) {
            // pull out a helpful message if the server gave one
            const msg = (data && (data.message || data.error)) || response.statusText;
            console.error('Order API failed:', response.status, msg, data);
            throw new Error(`Server ${response.status}: ${msg}`);
          }
        
          return data;
        })
        
        .then(data => {
            if (data.success) {
                // Store token and user data consistently
                localStorage.setItem('token', data.token || data.user.token);
                
                // Save user data in a consistent format
                const userData = {
                    id: data.user.id,
                    phone: data.user.phone,
                    name: data.user.name || data.user.phone
                };
                localStorage.setItem('user', JSON.stringify(userData));
                
                // Show success UI
                const loginSuccessModal = document.getElementById('login-success-modal');
                loginSuccessModal.style.display = 'block';
                
                // Redirect to dashboard or saved URL
                setTimeout(function() {
                    const redirectUrl = localStorage.getItem('redirectUrl') || '/Login Page.html';
                    window.location.href = redirectUrl;
                    localStorage.removeItem('redirectUrl');
                }, 1500);
            } else {
                alert('❌ ' + (data.error || data.message || 'Login failed'));
                // Reset button
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        })
        .catch(error => {
            alert('⚠️ ' + error);
            // Reset button
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        });
      });
  }
});
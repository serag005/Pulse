/**
 * The code provides a consolidated authentication system in JavaScript for user login, logout, token
 * management, UI updates, and route protection with email and phone login handlers.
 * @returns The code provided is a consolidated authentication system written in JavaScript. It
 * includes functions for checking if a user is logged in, getting the user's token and data, logging
 * out the user, protecting routes that require authentication, updating the UI based on authentication
 * status, and handling email and phone login forms.
 */
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
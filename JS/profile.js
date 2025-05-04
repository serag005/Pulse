document.addEventListener('DOMContentLoaded', function() {
  // Test authentication status first
  testAuthentication();
  
  // First check if user is logged in using auth.js function
  if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
    console.log('User not logged in, displaying not logged in message');
    displayNotLoggedInMessage();
    return;
  } else {
    console.log('User is logged in, loading profile data');
    // Load profile data when page loads
    loadProfileData();
    
    // Load order history
    loadOrderHistory();
    
    // Setup event listeners for form submissions
    setupFormSubmissions();
    
    // Setup photo upload functionality
    setupPhotoUpload();
  }
});

// Function to get authorization headers using auth.js getToken function
function getAuthHeaders() {
  let token;
  if (typeof getToken === 'function') {
    token = getToken();
  } else {
    token = localStorage.getItem('token');
  }
  
  console.log('Using token from auth system:', token ? 'Present' : 'Missing');
  
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
}

// Function to load profile data from the server
function loadProfileData() {
  fetch('/api/profile/user-data', {
    headers: getAuthHeaders()
  })
    .then(response => {
      console.log('Profile data response status:', response.status);
      
      if (response.status === 500) {
        // Handle server error - likely database issue
        return response.json().then(errorData => {
          console.error('Server error:', errorData);
          displayDatabaseError(errorData.message || 'Unknown database error');
          return null;
        });
      }
      
      if (response.status === 401 || response.status === 403) {
        // Handle unauthorized - user not logged in or invalid token
        console.log('Authentication error when loading profile');
        displayNotLoggedInMessage();
        return null;
      }
      
      if (!response.ok) {
        throw new Error('Network response was not ok: ' + response.status);
      }
      
      return response.json();
    })
    .then(data => {
      if (!data) return; // Exit if null (unauthorized or error)
      
      // Log full data object to see all fields
      console.log('Profile data received:', data);
      console.log('Available fields:', Object.keys(data));
      
      // Add detailed profile debug info to page
      addProfileDebugInfo(data);
      
      // Try to populate form from any matching fields
      const fieldMappings = {
        firstName: ['firstName', 'firstname', 'first_name', 'fname', 'name'],
        lastName: ['lastName', 'lastname', 'last_name', 'lname', 'surname'],
        email: ['email', 'emailAddress', 'email_address', 'mail'],
        bio: ['bio', 'biography', 'about', 'description'],
        birthDate: ['birthDate', 'birth_date', 'dateOfBirth', 'date_of_birth', 'dob'],
        phone: ['phone', 'phoneNumber', 'phone_number', 'mobile', 'cellphone'],
        address: ['address', 'streetAddress', 'street_address', 'location'],
        twitter: ['twitter', 'twitterHandle', 'twitter_handle'],
        facebook: ['facebook', 'facebookProfile', 'facebook_profile'],
        instagram: ['instagram', 'instaHandle', 'insta_handle']
      };
      
      // For each form field, try all possible database field names
      for (const [formField, possibleDBFields] of Object.entries(fieldMappings)) {
        let value = null;
        for (const dbField of possibleDBFields) {
          if (data[dbField] !== undefined) {
            value = data[dbField];
            console.log(`Found match for ${formField}: ${dbField} = ${value}`);
            break;
          }
        }
        
        if (value !== null) {
          // Find the right input field and populate it
          const inputSelector = getInputSelector(formField);
          const input = document.querySelector(inputSelector);
          if (input) {
            input.value = value;
            console.log(`Set form field ${formField} to: ${value}`);
          } else {
            console.log(`Could not find input for ${formField} using selector: ${inputSelector}`);
          }
        }
      }
      
      // Set profile picture if available
      const profilePic = document.getElementById('profile-picture');
      if (profilePic) {
        const profilePicField = data.profilePicture || data.profile_picture || data.avatar || data.image;
        console.log('Profile picture field from database:', profilePicField);
        
        if (profilePicField) {
          // Use the path exactly as stored in the database - don't modify it
          // The registration system stores it as /@uploads/filename already
          console.log('Setting profile picture to:', profilePicField);
          
          // First set the image source directly
          profilePic.src = profilePicField;
          
          // Force a refresh of the image by adding a timestamp to avoid browser caching
          setTimeout(() => {
            profilePic.src = profilePicField + '?t=' + new Date().getTime();
            console.log('Refreshed profile picture with timestamp');
            
            // Add error handler for profile picture
            profilePic.onerror = function() {
              console.error('Failed to load profile picture from path:', profilePicField);
              // Try alternate path format
              const altPath = profilePicField.startsWith('/') ? profilePicField.substring(1) : '/' + profilePicField;
              console.log('Trying alternate path:', altPath);
              this.src = altPath + '?t=' + new Date().getTime();
              
              // If that fails too, set the default image
              this.onerror = function() {
                console.error('Failed to load profile picture from alternate path, using default');
                this.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OTYgNTEyIj48cGF0aCBmaWxsPSIjMDA3YzkxIiBkPSJNMjQ4IDhDMTExIDggMCAxMTkgMCAyNTZzMTExIDI0OCAyNDggMjQ4IDI0OC0xMTEgMjQ4LTI0OFMzODUgOCAyNDggOHptMCA5NmM0OC42IDAgODggMzkuNCA4OCA4OHMtMzkuNCA4OC04OCA4OC04OC0zOS40LTg4LTg4IDM5LjQtODggODgtODh6bTAgMzQ0Yy01OC43IDAtMTExLjMtMjYuNi0xNDYuNS02OC4yIDE4LjgtMzUuNCA1OC43LTU5LjggMTAyLjUtNTkuOCAyLjQgMCA0LjggLjQgNy4xIDEuMSAxMy40IDQuMyAyNC4yIDYuOSAzNiA2LjkgMTEuNyAwIDIyLjYtMi42IDM2LTYuOSAyLjMtLjcgNC43LTEuMSA3LjEtMS4xIDQzLjggMCA4My43IDI0LjQgMTAyLjUgNTkuOEMzNTkuMyA0MjEuNCAzMDYuNyA0NDggMjQ4IDQ0OHoiLz48L3N2Zz4=';
              };
            };
          }, 100);
        } else {
          console.log('No profile picture field found in data');
          // Set a default image if no profile picture is available
          profilePic.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OTYgNTEyIj48cGF0aCBmaWxsPSIjMDA3YzkxIiBkPSJNMjQ4IDhDMTExIDggMCAxMTkgMCAyNTZzMTExIDI0OCAyNDggMjQ4IDI0OC0xMTEgMjQ4LTI0OFMzODUgOCAyNDggOHptMCA5NmM0OC42IDAgODggMzkuNCA4OCA4OHMtMzkuNCA4OC04OCA4OC04OC0zOS40LTg4LTg4IDM5LjQtODggODgtODh6bTAgMzQ0Yy01OC43IDAtMTExLjMtMjYuNi0xNDYuNS02OC4yIDE4LjgtMzUuNCA1OC43LTU5LjggMTAyLjUtNTkuOCAyLjQgMCA0LjggLjQgNy4xIDEuMSAxMy40IDQuMyAyNC4yIDYuOSAzNiA2LjkgMTEuNyAwIDIyLjYtMi42IDM2LTYuOSAyLjMtLjcgNC43LTEuMSA3LjEtMS4xIDQzLjggMCA4My43IDI0LjQgMTAyLjUgNTkuOEMzNTkuMyA0MjEuNCAzMDYuNyA0NDggMjQ4IDQ0OHoiLz48L3N2Zz4=';
        }
      } else {
        console.log('Could not find profile picture element with ID "profile-picture"');
        // Try fallback to class selector
        const fallbackProfilePic = document.querySelector('.rounded-circle');
        if (fallbackProfilePic) {
          console.log('Found profile picture using fallback class selector');
          const profilePicField = data.profilePicture || data.profile_picture || data.avatar || data.image;
          if (profilePicField) {
            // Use the path directly as stored in the database
            fallbackProfilePic.src = profilePicField;
            
            // Add error handler for fallback profile picture
            fallbackProfilePic.onerror = function() {
              console.error('Failed to load profile picture for fallback from path:', profilePicField);
              // Try alternate path format
              const altPath = profilePicField.startsWith('/') ? profilePicField.substring(1) : '/' + profilePicField;
              console.log('Trying alternate path for fallback:', altPath);
              this.src = altPath + '?t=' + new Date().getTime();
              
              // If that fails too, set the default image
              this.onerror = function() {
                console.error('Failed to load profile picture from alternate path, using default');
                this.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OTYgNTEyIj48cGF0aCBmaWxsPSIjMDA3YzkxIiBkPSJNMjQ4IDhDMTExIDggMCAxMTkgMCAyNTZzMTExIDI0OCAyNDggMjQ4IDI0OC0xMTEgMjQ4LTI0OFMzODUgOCAyNDggOHptMCA5NmM0OC42IDAgODggMzkuNCA4OCA4OHMtMzkuNCA4OC04OCA4OC04OC0zOS40LTg4LTg4IDM5LjQtODggODgtODh6bTAgMzQ0Yy01OC43IDAtMTExLjMtMjYuNi0xNDYuNS02OC4yIDE4LjgtMzUuNCA1OC43LTU5LjggMTAyLjUtNTkuOCAyLjQgMCA0LjggLjQgNy4xIDEuMSAxMy40IDQuMyAyNC4yIDYuOSAzNiA2LjkgMTEuNyAwIDIyLjYtMi42IDM2LTYuOSAyLjMtLjcgNC43LTEuMSA3LjEtMS4xIDQzLjggMCA4My43IDI0LjQgMTAyLjUgNTkuOEMzNTkuMyA0MjEuNCAzMDYuNyA0NDggMjQ4IDQ0OHoiLz48L3N2Zz4=';
              };
            };
          } else {
            fallbackProfilePic.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OTYgNTEyIj48cGF0aCBmaWxsPSIjMDA3YzkxIiBkPSJNMjQ4IDhDMTExIDggMCAxMTkgMCAyNTZzMTExIDI0OCAyNDggMjQ4IDI0OC0xMTEgMjQ4LTI0OFMzODUgOCAyNDggOHptMCA5NmM0OC42IDAgODggMzkuNCA4OCA4OHMtMzkuNCA4OC04OCA4OC04OC0zOS40LTg4LTg4IDM5LjQtODggODgtODh6bTAgMzQ0Yy01OC43IDAtMTExLjMtMjYuNi0xNDYuNS02OC4yIDE4LjgtMzUuNCA1OC43LTU5LjggMTAyLjUtNTkuOCAyLjQgMCA0LjggLjQgNy4xIDEuMSAxMy40IDQuMyAyNC4yIDYuOSAzNiA2LjkgMTEuNyAwIDIyLjYtMi42IDM2LTYuOSAyLjMtLjcgNC43LTEuMSA3LjEtMS4xIDQzLjggMCA4My43IDI0LjQgMTAyLjUgNTkuOEMzNTkuMyA0MjEuNCAzMDYuNyA0NDggMjQ4IDQ0OHoiLz48L3N2Zz4=';
          }
        }
      }
    })
    .catch(error => {
      console.error('Error loading profile data:', error);
      
      // Show error message on the page
      const debugInfo = document.createElement('div');
      debugInfo.className = 'alert alert-danger mt-3';
      debugInfo.innerHTML = `
        <strong>Error loading profile data:</strong> ${error.message}
        <p>Please check the console for more details.</p>
      `;
      
      const profileTab = document.querySelector('.tab-content');
      if (profileTab) {
        profileTab.prepend(debugInfo);
      }
    });
}

// Helper to get the appropriate selector for each form field
function getInputSelector(fieldName) {
  const selectors = {
    firstName: '[placeholder="Enter First Name"]',
    lastName: '[placeholder="Enter Last Name"]',
    email: '[placeholder="Enter your email"]',
    bio: '[placeholder="Write something about yourself..."]',
    birthDate: 'input[type="date"]',
    phone: '[placeholder="e.g. +1 234 567 8900"]',
    address: '[placeholder="Address"]',
    twitter: '[placeholder="https://twitter.com/yourhandle"]',
    facebook: '[placeholder="https://facebook.com/yourprofile"]',
    instagram: '[placeholder="https://instagram.com/yourprofile"]'
  };
  
  return selectors[fieldName] || `[name="${fieldName}"]`;
}

// Add detailed debug info about profile data to the page
function addProfileDebugInfo(data) {
  // Comment out or remove this function to hide debug info
  
  // Uncomment this return statement to disable debug info display
  return; // Debug info disabled for production
  
  const debugInfo = document.createElement('div');
  debugInfo.className = 'profile-data-debug mt-3 mb-3 p-3 border bg-light';
  
  // Create HTML content showing all data fields
  let fieldsHtml = '';
  for (const [key, value] of Object.entries(data)) {
    fieldsHtml += `<tr>
      <td><strong>${key}</strong></td>
      <td>${value !== null && value !== undefined ? value : '<em>empty</em>'}</td>
    </tr>`;
  }
  
  debugInfo.innerHTML = `
    <h5>Profile Data Debug</h5>
    <p>Available fields in database:</p>
    <div style="max-height: 200px; overflow-y: auto;">
      <table class="table table-sm">
        <thead>
          <tr>
            <th>Field</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          ${fieldsHtml}
        </tbody>
      </table>
    </div>
    <p class="mt-2"><small>If your profile form isn't populating, make sure field names in the form match the database.</small></p>
  `;
  
  // Add to page
  const profileTab = document.querySelector('.tab-content');
  if (profileTab) {
    // Insert after authentication debug if it exists
    const authDebug = document.querySelector('.auth-debug');
    if (authDebug) {
      authDebug.after(debugInfo);
    } else {
      profileTab.prepend(debugInfo);
    }
  }
}

// Enhanced loadOrderHistory function to handle the table more robustly
function loadOrderHistory() {
  console.log('Loading order history...');
  
  const tableBody = document.getElementById('order-history-body');
  if (!tableBody) {
    console.error('Order history table body not found in DOM');
    return;
  }
  
  // Show loading indicator
  tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Loading order history...</td></tr>';
  
  fetch('/api/profile/orders', {
    headers: getAuthHeaders()
  })
    .then(response => {
      console.log('Order history response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Authentication required');
        } else if (response.status === 404) {
          throw new Error('No orders found');
        } else {
          return response.json().then(errorData => {
            throw new Error(errorData.message || `Error: ${response.status}`);
          });
        }
      }
      
      return response.json();
    })
    .then(orders => {
      console.log('Order history received:', orders?.length || 0, 'orders');
      
      // Clear loading indicator
      tableBody.innerHTML = '';
      
      if (!orders || !Array.isArray(orders) || orders.length === 0) {
        displayEmptyOrderHistory('No orders found in your history');
        return;
      }
      
      // Populate table with order data
      orders.forEach((order, index) => {
        // Create main row (summary)
        const mainRow = document.createElement('tr');
        mainRow.className = 'order-summary-row';
        mainRow.dataset.orderId = order.id;
        
        // Format summary info
        const itemCount = order.items && Array.isArray(order.items) ? order.items.length : 0;
        const itemTotal = order.items && Array.isArray(order.items) 
          ? order.items.reduce((sum, item) => sum + (item.quantity || 1), 0) 
          : 0;
          
        mainRow.innerHTML = `
          <td>${order.id}</td>
          <td>
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <span class="font-weight-bold">${itemCount} product${itemCount !== 1 ? 's' : ''}</span>
                <span class="text-muted">(${itemTotal} item${itemTotal !== 1 ? 's' : ''} total)</span>
              </div>
              <button class="btn btn-sm btn-outline-primary toggle-details" data-order-id="${order.id}">
                <i class="fa-solid fa-chevron-down"></i>
              </button>
            </div>
          </td>
          <td>${order.order_date || 'Unknown date'}</td>
          <td><span class="badge ${getStatusBadgeClass(order.status)}">${order.status || 'Pending'}</span></td>
        `;
        
        tableBody.appendChild(mainRow);
        
        // Create details row (initially hidden)
        const detailsRow = document.createElement('tr');
        detailsRow.className = 'order-details-row d-none';
        detailsRow.dataset.orderId = order.id;
        
        // Build product details
        let productContent = '';
        if (order.items && Array.isArray(order.items) && order.items.length > 0) {
          productContent = `<div class="product-list-container mt-2">`;
          
          // Add each product
          productContent += order.items.map(item => {
            // Try to load image from product_image path or generate a placeholder
            let imageHtml = '';
            if (item.product_image) {
              imageHtml = `<img src="${item.product_image}" alt="${item.product_name}" class="order-item-image" onerror="this.src='images/placeholder.png'; this.onerror=null;">`;
            } else {
              // Create a colored circle with the first letter as a placeholder
              const firstLetter = (item.product_name || 'P').charAt(0).toUpperCase();
              const randomColor = getRandomColor(item.product_name || '');
              imageHtml = `<div class="order-item-image d-flex align-items-center justify-content-center" style="background-color: ${randomColor}; color: white; font-weight: bold;">
                ${firstLetter}
              </div>`;
            }
            
            // Create a more descriptive product label with category or description
            let productSubtitle = '';
            if (item.product_category) {
              productSubtitle = `<small class="d-block text-muted">${item.product_category}</small>`;
            } else if (item.product_description) {
              const shortDesc = item.product_description?.length > 40 ? 
                item.product_description.substring(0, 40) + '...' : 
                item.product_description;
              productSubtitle = `<small class="d-block text-muted">${shortDesc}</small>`;
            }
            
            return `<div class="product-list-item">
              ${imageHtml}
              <div>
                <div class="font-weight-bold">${item.product_name || 'Unknown Product'}</div>
                ${productSubtitle}
                <div class="small text-muted">
                  Qty: ${item.quantity || 1} × $${item.price} = $${item.subtotal || (item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            </div>`;
          }).join('');
          
          productContent += '</div>';
          
          // Add total amount if available
          if (order.total_amount) {
            productContent += `<div class="order-total">
              Total: $${order.total_amount}
            </div>`;
          }
          
          // Add order actions
          productContent += `
            <div class="order-actions">
              <button class="btn btn-sm btn-outline-primary">
                <i class="fa-solid fa-eye"></i> View Details
              </button>
              <button class="btn btn-sm btn-outline-primary ml-2">
                <i class="fa-solid fa-truck"></i> Track Order
              </button>
              <button class="btn btn-sm btn-outline-primary ml-2">
                <i class="fa-solid fa-print"></i> Print Receipt
              </button>
            </div>
          `;
        } else {
          productContent = '<span class="text-muted">No items</span>';
        }
        
        detailsRow.innerHTML = `<td colspan="4" class="p-3 bg-light">${productContent}</td>`;
        tableBody.appendChild(detailsRow);
      });
      
      // Add click handlers for expanding/collapsing order details
      document.querySelectorAll('.toggle-details').forEach(button => {
        button.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          const orderId = this.dataset.orderId;
          const detailsRow = document.querySelector(`.order-details-row[data-order-id="${orderId}"]`);
          
          // Toggle visibility
          detailsRow.classList.toggle('d-none');
          
          // Toggle icon
          const icon = this.querySelector('i');
          if (detailsRow.classList.contains('d-none')) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
          } else {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
          }
        });
      });
      
      // Also make order summary rows clickable
      document.querySelectorAll('.order-summary-row').forEach(row => {
        row.addEventListener('click', function() {
          const orderId = this.dataset.orderId;
          const button = document.querySelector(`.toggle-details[data-order-id="${orderId}"]`);
          if (button) {
            button.click();
          }
        });
        
        // Add cursor pointer style
        row.style.cursor = 'pointer';
      });
    })
    .catch(error => {
      console.error('Error loading order history:', error);
      
      // Provide more specific error messages to the user
      let errorMessage = error.message || 'Error loading orders';
      if (error.message === 'Authentication required') {
        errorMessage = 'Please log in to view your order history';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection';
      }
      
      displayEmptyOrderHistory(errorMessage);
    });
}

// Helper function to get badge class based on order status
function getStatusBadgeClass(status) {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'badge-warning';
    case 'processing':
      return 'badge-info';
    case 'shipped':
      return 'badge-primary';
    case 'delivered':
      return 'badge-success';
    case 'cancelled':
      return 'badge-danger';
    default:
      return 'badge-secondary';
  }
}

// Function to setup form submissions
function setupFormSubmissions() {
  // Save button event listener
  const saveButton = document.querySelector('.btn-primary');
  if (saveButton) {
    saveButton.addEventListener('click', function() {
      const activeTab = document.querySelector('.tab-pane.active');
      if (!activeTab) return;
      
      const tabId = activeTab.id;
      
      switch (tabId) {
        case 'account-general':
          updateGeneralInfo();
          break;
        case 'account-password':
          updatePassword();
          break;
        case 'account-info':
          updateProfileInfo();
          break;
        case 'account-social':
          updateSocialLinks();
          break;
      }
    });
  }
}

// Function to update general profile information
function updateGeneralInfo() {
  const firstNameInput = document.querySelector('[placeholder="Enter First Name"]');
  const lastNameInput = document.querySelector('[placeholder="Enter Last Name"]');
  const emailInput = document.querySelector('[placeholder="Enter your email"]');
  
  if (!firstNameInput || !lastNameInput || !emailInput) {
    showAlert('error', 'Form elements not found');
    return;
  }
  
  const firstName = firstNameInput.value;
  const lastName = lastNameInput.value;
  const email = emailInput.value;
  
  if (!firstName || !lastName || !email) {
    showAlert('error', 'Please fill in all required fields');
    return;
  }
  
  const data = { firstName, lastName, email };
  
  fetch('/api/profile/update-general', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(data => {
        throw new Error(data.message || 'Failed to update profile');
      });
    }
    return response.json();
  })
  .then(result => {
    showAlert('success', result.message || 'Profile updated successfully');
  })
  .catch(error => {
    console.error('Error updating profile:', error);
    showAlert('error', error.message || 'Failed to update profile');
  });
}

// Function to update password
function updatePassword() {
  const currentPassword = document.querySelector('[label="Current password"]').value;
  const newPassword = document.querySelector('[label="New password"]').value;
  const confirmPassword = document.querySelector('[label="Repeat new password"]').value;
  
  if (!currentPassword || !newPassword || !confirmPassword) {
    showAlert('error', 'Please fill in all password fields');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showAlert('error', 'New passwords do not match');
    return;
  }
  
  const data = { currentPassword, newPassword, confirmPassword };
  
  fetch('/api/profile/password', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(data => {
        throw new Error(data.message || 'Failed to update password');
      });
    }
    return response.json();
  })
  .then(result => {
    showAlert('success', result.message || 'Password updated successfully');
    // Clear password fields
    document.querySelector('[label="Current password"]').value = '';
    document.querySelector('[label="New password"]').value = '';
    document.querySelector('[label="Repeat new password"]').value = '';
  })
  .catch(error => {
    console.error('Error updating password:', error);
    showAlert('error', error.message || 'Failed to update password');
  });
}

// Function to update profile information
function updateProfileInfo() {
  const bio = document.querySelector('[placeholder="Write something about yourself..."]').value;
  const birthDate = document.querySelector('input[type="date"]').value;
  const countrySelect = document.querySelector('select.form-control');
  const country = countrySelect.options[countrySelect.selectedIndex].text;
  const phone = document.querySelector('[placeholder="e.g. +1 234 567 8900"]').value;
  const address = document.querySelector('[placeholder="Address"]').value;
  
  const data = { bio, birthDate, country, phone, address };
  
  fetch('/api/profile/info', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(data => {
        throw new Error(data.message || 'Failed to update profile info');
      });
    }
    return response.json();
  })
  .then(result => {
    showAlert('success', result.message || 'Profile info updated successfully');
  })
  .catch(error => {
    console.error('Error updating profile info:', error);
    showAlert('error', error.message || 'Failed to update profile info');
  });
}

// Function to update social links
function updateSocialLinks() {
  const twitter = document.querySelector('[placeholder="https://twitter.com/yourhandle"]').value;
  const facebook = document.querySelector('[placeholder="https://facebook.com/yourprofile"]').value;
  const instagram = document.querySelector('[placeholder="https://instagram.com/yourprofile"]').value;
  
  const data = { twitter, facebook, instagram };
  
  fetch('/api/profile/social', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(data => {
        throw new Error(data.message || 'Failed to update social links');
      });
    }
    return response.json();
  })
  .then(result => {
    showAlert('success', result.message || 'Social links updated successfully');
  })
  .catch(error => {
    console.error('Error updating social links:', error);
    showAlert('error', error.message || 'Failed to update social links');
  });
}

// Function to setup photo upload functionality
function setupPhotoUpload() {
  const fileInput = document.querySelector('.account-settings-fileinput');
  if (!fileInput) return;
  
  fileInput.addEventListener('change', function() {
    if (!this.files || !this.files[0]) return;
    
    const file = this.files[0];
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      showAlert('error', 'Please select an image file');
      return;
    }
    
    // Check file size (800KB max)
    if (file.size > 800 * 1024) {
      showAlert('error', 'Image size must be less than 800KB');
      return;
    }
    
    // Create form data and append file
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    // Get profile picture element
    const profilePic = document.getElementById('profile-picture') || document.querySelector('.rounded-circle');
    
    // Show loading indicator
    if (profilePic) {
      profilePic.style.opacity = 0.5;
      console.log('Starting profile picture upload...');
      
      // Add loading spinner or indicator
      const originalSrc = profilePic.src;
      const loadingIndicator = document.createElement('div');
      loadingIndicator.className = 'spinner-border text-primary';
      loadingIndicator.setAttribute('role', 'status');
      loadingIndicator.innerHTML = '<span class="sr-only">Loading...</span>';
      profilePic.parentNode.appendChild(loadingIndicator);
      loadingIndicator.style.position = 'absolute';
      loadingIndicator.style.top = '50%';
      loadingIndicator.style.left = '50%';
      loadingIndicator.style.transform = 'translate(-50%, -50%)';
    }
    
    // Upload file
    fetch('/api/profile/upload-photo', {
      method: 'POST',
      headers: {
        'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
      },
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => {
          throw new Error(data.message || 'Failed to upload profile picture');
        });
      }
      return response.json();
    })
    .then(result => {
      showAlert('success', result.message || 'Profile picture updated successfully');
      
      // Update profile picture with new one
      if (result.filePath && profilePic) {
        console.log('Upload successful, setting new profile picture path:', result.filePath);
        
        // Use the path directly as returned from the server
        profilePic.src = result.filePath + '?t=' + new Date().getTime();
        
        // Add error handler in case the path doesn't work
        profilePic.onerror = function() {
          console.error('Failed to load uploaded profile picture from path:', result.filePath);
          // Try alternate path format
          const altPath = result.filePath.startsWith('/') ? result.filePath.substring(1) : '/' + result.filePath;
          console.log('Trying alternate path for uploaded picture:', altPath);
          this.src = altPath + '?t=' + new Date().getTime();
          
          // If that fails too, set the default image
          this.onerror = function() {
            console.error('Failed to load uploaded profile picture from alternate path, using default');
            this.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OTYgNTEyIj48cGF0aCBmaWxsPSIjMDA3YzkxIiBkPSJNMjQ4IDhDMTExIDggMCAxMTkgMCAyNTZzMTExIDI0OCAyNDggMjQ4IDI0OC0xMTEgMjQ4LTI0OFMzODUgOCAyNDggOHptMCA5NmM0OC42IDAgODggMzkuNCA4OCA4OHMtMzkuNCA4OC04OCA4OC04OC0zOS40LTg4LTg4IDM5LjQtODggODgtODh6bTAgMzQ0Yy01OC43IDAtMTExLjMtMjYuNi0xNDYuNS02OC4yIDE4LjgtMzUuNCA1OC43LTU5LjggMTAyLjUtNTkuOCAyLjQgMCA0LjggLjQgNy4xIDEuMSAxMy40IDQuMyAyNC4yIDYuOSAzNiA2LjkgMTEuNyAwIDIyLjYtMi42IDM2LTYuOSAyLjMtLjcgNC43LTEuMSA3LjEtMS4xIDQzLjggMCA4My43IDI0LjQgMTAyLjUgNTkuOEMzNTkuMyA0MjEuNCAzMDYuNyA0NDggMjQ4IDQ0OHoiLz48L3N2Zz4=';
          };
        };
      }
      
      // Reset opacity and remove loading indicator
      if (profilePic) {
        profilePic.style.opacity = 1;
        const loadingIndicator = profilePic.parentNode.querySelector('.spinner-border');
        if (loadingIndicator) {
          profilePic.parentNode.removeChild(loadingIndicator);
        }
      }
    })
    .catch(error => {
      console.error('Error uploading profile picture:', error);
      showAlert('error', error.message || 'Failed to upload profile picture');
      
      // Reset opacity and remove loading indicator
      if (profilePic) {
        profilePic.style.opacity = 1;
        const loadingIndicator = profilePic.parentNode.querySelector('.spinner-border');
        if (loadingIndicator) {
          profilePic.parentNode.removeChild(loadingIndicator);
        }
      }
    });
  });
  
  // Reset button functionality
  const resetButton = document.querySelector('.btn-secondary');
  if (resetButton) {
    resetButton.addEventListener('click', function() {
      // Reset file input
      document.querySelector('.account-settings-fileinput').value = '';
      
      // Reload profile picture from server
      loadProfileData();
    });
  }
}

// Function to show alert messages
function showAlert(type, message) {
  // Check if alert container exists, if not create one
  let alertContainer = document.querySelector('.alert-container');
  if (!alertContainer) {
    alertContainer = document.createElement('div');
    alertContainer.className = 'alert-container';
    alertContainer.style.position = 'fixed';
    alertContainer.style.top = '20px';
    alertContainer.style.right = '20px';
    alertContainer.style.zIndex = '1050';
    document.body.appendChild(alertContainer);
  }
  
  // Create alert element
  const alert = document.createElement('div');
  alert.className = `alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`;
  alert.innerHTML = `
    ${message}
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  `;
  
  // Add alert to container
  alertContainer.appendChild(alert);
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    alert.classList.remove('show');
    setTimeout(() => {
      alertContainer.removeChild(alert);
    }, 150);
  }, 5000);
  
  // Set up close button
  const closeButton = alert.querySelector('.close');
  if (closeButton) {
    closeButton.addEventListener('click', function() {
      alert.classList.remove('show');
      setTimeout(() => {
        alertContainer.removeChild(alert);
      }, 150);
    });
  }
}

// Function to display a message for not logged in users
function displayNotLoggedInMessage() {
  // Update all form fields to be disabled
  const formInputs = document.querySelectorAll('input, textarea, select, button.btn-primary');
  formInputs.forEach(input => {
    input.disabled = true;
  });
  
  // Display a message
  const generalTab = document.getElementById('account-general');
  if (generalTab) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'alert alert-warning mt-3';
    messageDiv.innerHTML = 'Please <a href="login.html">log in</a> to view and edit your profile.';
    generalTab.prepend(messageDiv);
  }
}

// Function to display empty order history with custom message
function displayEmptyOrderHistory(message) {
  const tableBody = document.getElementById('order-history-body');
  const table = document.querySelector('.order-table');
  const emptyMessage = document.querySelector('.empty-order-message');
  
  if (!tableBody || !table || !emptyMessage) return;
  
  // First option: If it's a "no orders" message, show the empty state UI
  if (message === 'No orders found in your history') {
    table.style.display = 'none';
    emptyMessage.style.display = 'block';
  } 
  // Second option: For error messages, show in the table
  else {
    table.style.display = 'table';
    emptyMessage.style.display = 'none';
    
    tableBody.innerHTML = '';
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="4" class="text-center py-3">
      <div class="alert alert-info mb-0">
        <i class="fa-solid fa-info-circle mr-2"></i> ${message}
      </div>
    </td>`;
    tableBody.appendChild(row);
  }
}

// Debug function to test authentication
function testAuthentication() {
  // Uncomment this return statement to disable debug info display
  return; // Debug info disabled for production
  
  // Display auth info on the page for debugging
  const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('token');
  const userData = typeof getCurrentUser === 'function' ? getCurrentUser() : JSON.parse(localStorage.getItem('user') || '{}');
  
  console.log('Auth Debug - Token exists:', !!token);
  console.log('Auth Debug - User data:', userData);
  
  if (token) {
    // Test token with API
    fetch('/api/profile/test', {
      headers: getAuthHeaders()
    })
    .then(response => response.json())
    .then(data => {
      console.log('Auth test result:', data);
      
      // Add debug info to the page
      const debugInfo = document.createElement('div');
      debugInfo.className = 'auth-debug mt-3 mb-3 p-3 border bg-light';
      debugInfo.innerHTML = `
        <h5>Authentication & Database Debug</h5>
        <p>Token present: ${!!token}</p>
        <p>User ID: ${userData?.id || 'Not found'}</p>
        <p>API response: ${data.message || 'No message'}</p>
        <p>Auth status: ${data.userId ? 'Valid token ✅' : 'Invalid token ❌'}</p>
        <p>Database status: ${data.databaseStatus || 'Unknown'}</p>
        ${data.databaseStatus !== 'Connected' ? 
          '<div class="alert alert-danger">Database connection issue detected. Please check server logs.</div>' : ''}
      `;
      
      // Add to page
      const profileTab = document.querySelector('.tab-content');
      if (profileTab) {
        profileTab.prepend(debugInfo);
      }
      
      // If database is not connected, don't try to load profile
      if (data.databaseStatus !== 'Connected') {
        displayDatabaseError(data.databaseStatus || 'Unknown error');
        return;
      }
    })
    .catch(err => {
      console.error('Auth test error:', err);
      displayDatabaseError('Error connecting to server');
    });
  }
}

// Display database connection error
function displayDatabaseError(error) {
  // Uncomment this return statement to disable debug error display
  return; // Debug error messages disabled for production
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'alert alert-danger mt-3';
  errorDiv.innerHTML = `
    <h5>Database Connection Error</h5>
    <p>There was a problem connecting to the database: ${error}</p>
    <p>Please check the server logs for more information.</p>
    <p>Common causes:</p>
    <ul>
      <li>MySQL service is not running</li>
      <li>Database credentials are incorrect</li>
      <li>Database tables don't exist or have wrong structure</li>
    </ul>
  `;
  
  // Add to page
  const profileTab = document.querySelector('.tab-content');
  if (profileTab) {
    // Add after auth debug if it exists
    const authDebug = document.querySelector('.auth-debug');
    if (authDebug) {
      authDebug.after(errorDiv);
    } else {
      profileTab.prepend(errorDiv);
    }
  }
  
  // Disable form inputs
  const formInputs = document.querySelectorAll('input, textarea, select, button.btn-primary');
  formInputs.forEach(input => {
    input.disabled = true;
  });
}

// Utility function to generate a random color based on a string
function getRandomColor(str) {
  // Simple hash function to get a consistent color for the same string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate HSL color with good saturation and lightness
  const h = hash % 360;
  return `hsl(${h}, 70%, 50%)`;
}
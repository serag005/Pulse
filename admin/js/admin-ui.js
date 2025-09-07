/**
 * Admin Dashboard UI Functions
 * This file handles the interaction between admin-api.js and the UI elements
 */

// Debug logging to console
console.log('admin-ui.js loaded');

// Global Modal Management System
const ModalManager = {
    // Track active modals
    activeModals: [],

    // Show a modal with proper event handling
    show: function(modalElement) {
        if (!modalElement) return false;
        
        // Show the modal
        if (typeof $ !== 'undefined' && typeof $.fn.modal === 'function') {
            // jQuery method if available
            $(modalElement).modal('show');
        } else {
            // Direct DOM method
            modalElement.style.display = 'flex'; // Changed from 'block' to 'flex'
            modalElement.classList.add('show'); // Added show class
            
            // Clear any existing event listeners
            const newElement = modalElement.cloneNode(true);
            modalElement.parentNode.replaceChild(newElement, modalElement);
            modalElement = newElement;
            
            // Make sure close buttons work
            const closeButtons = modalElement.querySelectorAll('.close, .btn-secondary, [data-dismiss="modal"], #cancelBtn');
            closeButtons.forEach(button => {
                if (button) {
                    button.addEventListener('click', function(e) {
                        e.preventDefault();
                        ModalManager.hide(modalElement);
                    });
                }
            });
            
            // Add to active modals for outsideClickHandler
            if (!this.activeModals.includes(modalElement)) {
                this.activeModals.push(modalElement);
            }
        }
        
        return modalElement;
    },
    
    // Hide a modal with proper cleanup
    hide: function(modalElement) {
        if (!modalElement) return false;
        
        if (typeof $ !== 'undefined' && typeof $.fn.modal === 'function') {
            // jQuery method if available
            $(modalElement).modal('hide');
        } else {
            // Direct DOM method
            modalElement.style.display = 'none';
            modalElement.classList.remove('show'); // Remove show class
            
            // Remove from active modals
            this.activeModals = this.activeModals.filter(modal => modal !== modalElement);
        }
        
        return true;
    },
    
    // Create a new modal and add it to the document
    create: function(options) {
        const {
            title = 'Modal Title',
            body = '',
            footer = '',
            size = '', // 'lg', 'sm', or empty for default
            id = 'dynamic-modal-' + Date.now(),
            closeOnBackdrop = true
        } = options;
        
        // Create modal element
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = id;
        modal.setAttribute('role', 'dialog');
        
        // Modal HTML structure
        modal.innerHTML = `
            <div class="modal-dialog ${size ? 'modal-' + size : ''}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">${title}</h2>
                        <span class="close">&times;</span>
                    </div>
                    <div class="modal-body">
                        ${body}
                    </div>
                    <div class="modal-footer">
                        ${footer || '<button type="button" class="btn btn-secondary">Close</button>'}
                    </div>
                </div>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(modal);
        
        // Set up event handlers
        const closeButtons = modal.querySelectorAll('.close, .btn-secondary, [data-dismiss="modal"]');
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                ModalManager.hide(modal);
            });
        });
        
        // Handle backdrop clicks
        if (closeOnBackdrop) {
            modal.addEventListener('click', function(event) {
                if (event.target === modal) {
                    ModalManager.hide(modal);
                }
            });
        }
        
        return modal;
    }
};

// Check if user is logged in, redirect to login if not
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded in admin-ui.js');
    
    // Now check if AdminAPI is available - it should be by this point
    console.log('AdminAPI object:', typeof AdminAPI !== 'undefined' ? 'Exists' : 'Missing');
    if (typeof AdminAPI !== 'undefined') {
        console.log('AdminAPI methods:', Object.keys(AdminAPI));
    } else {
        console.error('AdminAPI is not defined! Check that admin-api.js is loaded correctly.');
        alert('Error: AdminAPI is not defined. Check the console for details.');
        return;
    }
    
    if (!AdminAPI.Auth.isLoggedIn() && window.location.pathname !== '/admin/login.html') {
        console.log('Not logged in, redirecting to login page');
        window.location.href = '../index.html';
        return;
    }

    // Initialize everything
    console.log('Initializing admin UI');
    initAdminUI();
    initOrdersModal();
    initScrollSpy();

    // Set up a global click handler for modals
    window.addEventListener('click', function(event) {
        ModalManager.activeModals.forEach(modal => {
            if (event.target === modal) {
                ModalManager.hide(modal);
            }
        });
    });
});

// Initialize the admin dashboard UI
function initAdminUI() {
    loadDashboardStats();
    loadBestSellers();
    loadQuickStats();
    loadRecentOrders();
    loadRecentCustomers();
    
    // Load section data based on visible section
    const hash = window.location.hash || '#dashboard';
    if (hash === '#customers') {
        loadCustomers();
    } else if (hash === '#messages') {
        loadMessages();
    } else if (hash === '#volunteers') {
        loadVolunteers();
    } else if (hash === '#suppliers') {
        loadSuppliers();
    } else if (hash === '#products') {
        loadProducts();
    }
    
    // Initialize charts
    initCharts();
    
    // Set up sign out button
    document.getElementById('signOutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        // Clear all authentication tokens
        localStorage.removeItem('adminToken');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect to login page
        window.location.href = '../index.html';
    });
    
    // Add event listeners for delete and edit buttons using event delegation
    document.addEventListener('click', function(e) {
        // Handle delete buttons
        if (e.target.closest('.delete-btn')) {
            const button = e.target.closest('.delete-btn');
            const id = button.getAttribute('data-id');
            const type = button.getAttribute('data-type') || getTypeFromContext(button);
            
            if (id && type) {
                // Show custom confirmation modal instead of browser confirm
                showDeleteConfirmationModal(type, id);
            }
        }
        
        // Handle edit buttons
        if (e.target.closest('.edit-btn')) {
            const button = e.target.closest('.edit-btn');
            const id = button.getAttribute('data-id');
            const type = button.getAttribute('data-type') || getTypeFromContext(button);
            
            if (id && type) {
                editItem(type, id);
            }
        }
    });
    
    // Update admin profile picture
    const adminUser = AdminAPI.Auth.getCurrentAdmin();
    const adminProfilePic = document.getElementById('adminProfilePic');
    if (adminProfilePic) {
    if (adminUser && adminUser.profilePicture) {
            adminProfilePic.src = adminUser.profilePicture;
    } else {
            adminProfilePic.src = 'img/team/default-avatar.jpg';
        }
    }
    
    // Add navigation event handlers to load data when tabs are clicked
    document.querySelectorAll('.navigation a[href^="#"]').forEach(link => {
        link.addEventListener('click', function() {
            const section = this.getAttribute('href').substring(1);
            if (section === 'customers') {
                loadCustomers();
            } else if (section === 'messages') {
                loadMessages();
            } else if (section === 'volunteers') {
                loadVolunteers();
            } else if (section === 'suppliers') {
                loadSuppliers();
            } else if (section === 'products') {
                loadProducts();
            }
        });
    });
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const stats = await AdminAPI.Dashboard.getStats();
        
        // Update UI elements with the data
        const totalRevenueElement = document.getElementById('totalRevenue');
        const totalOrdersElement = document.getElementById('totalOrders');
        const activeCustomersElement = document.getElementById('activeCustomers');
        const avgOrderValueElement = document.getElementById('avgOrderValue');
        
        if (totalRevenueElement) totalRevenueElement.textContent = `EGP ${formatNumber(stats.total_revenue)}`;
        if (totalOrdersElement) totalOrdersElement.textContent = formatNumber(stats.total_orders);
        if (activeCustomersElement) activeCustomersElement.textContent = formatNumber(stats.active_customers);
        if (avgOrderValueElement) avgOrderValueElement.textContent = `EGP ${formatNumber(stats.avg_order_value)}`;
        
        // Set trend indicators (in a real app, you'd calculate trends based on historical data)
        setTrendIndicator('revenueTrend', 'revenueGrowth', 15.3);
        setTrendIndicator('ordersTrend', 'ordersGrowth', 8.3);
        setTrendIndicator('customersTrend', 'customersGrowth', 5.2);
        setTrendIndicator('avgOrderTrend', 'avgOrderGrowth', -2.1);
        
    } catch (error) {
        console.error('Failed to load dashboard stats:', error);
        showError('Failed to load dashboard statistics');
    }
}

// Load best selling products
async function loadBestSellers() {
    try {
        console.log('Starting to load best sellers...');
        
        const bestSellers = await AdminAPI.Dashboard.getBestSellers();
        console.log('Best sellers data received:', bestSellers);
        
        const container = document.getElementById('bestSellersGrid');
        
        if (!container) {
            console.warn('Best sellers container not found: #bestSellersGrid');
            return;
        }
        
        container.innerHTML = '';
        
        // Check if we have valid data
        if (!bestSellers || !Array.isArray(bestSellers) || bestSellers.length === 0) {
            console.warn('No best sellers data available or invalid data format');
            container.innerHTML = '<div class="empty-state">No best sellers data available</div>';
            return;
        }
        
        // Create and add best seller cards
        bestSellers.slice(0, 4).forEach((product, index) => {
            try {
                const card = document.createElement('div');
                card.className = 'best-seller-card';
                card.innerHTML = `
                    <span class="rank">${index + 1}</span>
                    <div class="product-image">
                        <img src="${resolveImagePath(product.image)}" 
                             alt="${product.name || 'Product'}">
                    </div>
                    <div class="product-info">
                        <h3>${product.name || 'Unknown Product'}</h3>
                        <p class="sales">${product.units_sold || 0} units sold</p>
                        <p class="revenue">EGP ${formatNumber(product.revenue || 0)}</p>
                        <div class="trend ${parseFloat(product.growth || 0) >= 0 ? 'positive' : 'negative'}">
                            <span class="trend-icon">
                                <i class="fas fa-arrow-${parseFloat(product.growth || 0) >= 0 ? 'up' : 'down'}"></i>
                            </span>
                            ${Math.abs(parseFloat(product.growth || 0)).toFixed(1)}%
                        </div>
                    </div>
                `;
                container.appendChild(card);
            } catch (cardError) {
                console.error('Error creating product card:', cardError, 'Product data:', product);
            }
        });
        
        console.log('Best sellers loaded successfully');
        
    } catch (error) {
        console.error('Failed to load best sellers:', error);
        showError('Failed to load best selling products');
        
        // Show empty state instead of fallback data
        const container = document.getElementById('bestSellersGrid');
        if (container) {
            container.innerHTML = '<div class="empty-state">Could not load best sellers data. Please try again later.</div>';
        }
    }
}

// Load quick stats
async function loadQuickStats() {
    try {
        const container = document.getElementById('quickStats');
        if (!container) {
            console.warn('Quick stats container not found: #quickStats');
            return;
        }
        
        // Show empty container since all quick stats were removed as requested
        container.innerHTML = '';
        
    } catch (error) {
        console.error('Failed to load quick stats:', error);
        
        // Show error state
        const container = document.getElementById('quickStats');
        if (container) {
            container.innerHTML = '';
        }
    }
}

        // Load recent orders
        async function loadRecentOrders() {
            try {
                console.log('Loading recent orders...');
                const orders = await AdminAPI.Dashboard.getRecentOrders();
                console.log('Received orders data:', orders);
        
        const tbody = document.getElementById('recentOrdersTable');
        
        if (!tbody) {
            console.warn('Recent orders table not found: #recentOrdersTable');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No orders available</td></tr>';
            return;
        }
        
        // Add pagination if there are more than 10 orders
        const ordersPerPage = 10;
        const totalPages = Math.ceil(orders.length / ordersPerPage);
        let currentPage = 1;
        
        function displayOrders(page) {
            const start = (page - 1) * ordersPerPage;
            const end = start + ordersPerPage;
            const pageOrders = orders.slice(start, end);
            
            tbody.innerHTML = '';
            
            pageOrders.forEach(order => {
                // Create main order row
            const row = document.createElement('tr');
            
            // Define status class based on order status
            let statusClass = '';
            switch(order.status) {
                case 'delivered':
                    statusClass = 'delivered';
                    break;
                case 'pending':
                    statusClass = 'pending';
                    break;
                case 'shipped':
                    statusClass = 'shipping';
                    break;
                case 'cancelled':
                    statusClass = 'cancelled';
                    break;
                default:
                    statusClass = 'processing';
            }
            
            row.innerHTML = `
                    <td>#${order.order_id || order.id}</td>
                <td>${order.firstName} ${order.lastName}</td>
                <td>EGP ${formatNumber(order.total_amount)}</td>
                <td>Paid</td>
                <td><span class="status ${statusClass}">${order.status}</span></td>
                    <td>
                        <button class="view-details-btn" onclick="toggleOrderDetails(${order.order_id || order.id}, this)">
                            <span>View Details</span>
                            <ion-icon name="chevron-down-outline"></ion-icon>
                        </button>
                    </td>
            `;
            
            tbody.appendChild(row);
                
                // Create details row with order items already populated
                const detailsRow = document.createElement('tr');
                detailsRow.className = 'order-details-row';
                detailsRow.id = `order-details-${order.order_id || order.id}`;
                
                // Generate items table HTML if items exist
                let itemsHtml = '';
                console.log(`Order ${order.order_id} has ${order.items ? order.items.length : 0} items:`, order.items);
                if (order.items && order.items.length > 0) {
                    itemsHtml = `
                        <table class="order-items-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Price</th>
                                    <th>Quantity</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.items.map(item => `
                                    <tr>
                                        <td>
                                            <div class="product-info">
                                                <div class="product-img">
                                                    <img src="${resolveImagePath(item.image)}" alt="${item.product_name || item.name}">
                                                </div>
                                                <span>${item.product_name || item.name}</span>
                                            </div>
                                        </td>
                                        <td>EGP ${formatNumber(item.price)}</td>
                                        <td>
                                            <span class="quantity-display">${item.quantity || 1}</span>
                                            ${item.quantity > 1 ? `<small class="quantity-note"></small>` : ''}
                                        </td>
                                        <td>EGP ${formatNumber(item.price * (item.quantity || 1))}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `;
                } else {
                    itemsHtml = '<div class="no-items">No items found for this order</div>';
                }
                
                detailsRow.innerHTML = `
                    <td colspan="6">
                        <div class="order-info-grid">
                            <div class="info-section">
                                <h3>Order Items</h3>
                                ${itemsHtml}
                            </div>
                            <div class="info-section">
                                <h3>Order Information</h3>
                                <p><strong>Order ID:</strong> <span>#${order.order_id || order.id}</span></p>
                                <p><strong>Order Date:</strong> <span>${new Date(order.order_date).toLocaleDateString()}</span></p>
                                <p><strong>Status:</strong> <span>${order.status}</span></p>
                                <p><strong>Total Amount:</strong> <span>EGP ${formatNumber(order.total_amount)}</span></p>
                            </div>
                            <div class="info-section">
                                <h3>Customer Information</h3>
                                <p><strong>Name:</strong> <span>${order.firstName} ${order.lastName}</span></p>
                                <p><strong>Email:</strong> <span>${order.email || 'N/A'}</span></p>
                                <p><strong>Phone:</strong> <span>${order.phone || 'N/A'}</span></p>
                                <p><strong>Address:</strong> <span>${order.address || 'N/A'}</span></p>
                            </div>
                        </div>
                    </td>
                `;
                
                tbody.appendChild(detailsRow);
            });
            
            // Update pagination controls
            updatePaginationControls();
        }
        
        function updatePaginationControls() {
            const paginationContainer = document.querySelector('.recentOrders .pagination');
            if (!paginationContainer) {
                // Create pagination container if it doesn't exist
                const container = document.createElement('div');
                container.className = 'pagination';
                tbody.parentElement.parentElement.appendChild(container);
            }
            
            const pagination = document.querySelector('.recentOrders .pagination');
            pagination.innerHTML = `
                <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">Previous</button>
                <span class="page-info">Page ${currentPage} of ${totalPages}</span>
                <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">Next</button>
            `;
        }
        
        // Add pagination styles and quantity display styles
        const style = document.createElement('style');
        style.textContent = `
            .recentOrders .pagination {
                display: flex;
                justify-content: center;
                align-items: center;
                margin-top: 1rem;
                gap: 1rem;
            }
            .recentOrders .pagination-btn {
                padding: 0.5rem 1rem;
                border: 1px solid var(--border_color);
                background: var(--card_color);
            
            /* Quantity display styles */
            .quantity-display {
                font-weight: bold;
                color: var(--primary_color);
                font-size: 1.1em;
            }
            
            .quantity-note {
                display: block;
                color: #666;
                font-size: 0.8em;
                margin-top: 2px;
            }
            
            .order-items-table td:nth-child(3) {
                text-align: center;
                font-weight: bold;
            }
                color: var(--text_color);
                border-radius: 4px;
                cursor: pointer;
            }
            .recentOrders .pagination-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            .recentOrders .page-info {
                color: var(--text_color);
            }
        `;
        document.head.appendChild(style);
        
        // Add pagination function to window
        window.changePage = function(page) {
            if (page >= 1 && page <= totalPages) {
                currentPage = page;
                displayOrders(page);
            }
        };
        
        // Display first page
        displayOrders(1);
        
    } catch (error) {
        console.error('Failed to load recent orders:', error);
        showError('Failed to load recent orders');
        
        const tbody = document.getElementById('recentOrdersTable');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No recent orders available</td></tr>';
        }
    }
}

// Toggle order details visibility
async function toggleOrderDetails(orderId, button) {
    const detailsRow = document.getElementById(`order-details-${orderId}`);
    const isExpanded = detailsRow.classList.contains('expanded');
    
    // Toggle the expanded class
    detailsRow.classList.toggle('expanded');
    button.classList.toggle('expanded');
    
    // Update button text and icon
    const buttonText = button.querySelector('span');
    const buttonIcon = button.querySelector('ion-icon');
    if (isExpanded) {
        buttonText.textContent = 'View Details';
        buttonIcon.name = 'chevron-down-outline';
    } else {
        buttonText.textContent = 'Hide Details';
        buttonIcon.name = 'chevron-up-outline';
    }
    
    // We've already populated the order items, so no need to fetch them again
}

// Load recent customers
async function loadRecentCustomers() {
    try {
        const customers = await AdminAPI.Dashboard.getRecentCustomers();
        console.log('Received customers data:', customers); // Debug log
        
        const table = document.getElementById('recentCustomersTable');
        
        if (!table) {
            console.warn('Recent customers table not found: #recentCustomersTable');
            return;
        }
        
        table.innerHTML = '';
        
        // Sort customers by order date in descending order
        const recentCustomers = customers
            .sort((a, b) => new Date(b.last_order_date) - new Date(a.last_order_date))
            .slice(0, 5);
        
        console.log('Processed recent customers:', recentCustomers); // Debug log
        
        recentCustomers.forEach(customer => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td width="60px">
                    <div class="imgBx"><img src="${customer.profilePicture || 'img/team/default-avatar.jpg'}" alt=""></div>
                </td>
                <td>
                    <h4>
                        ${customer.firstName || ''} ${customer.lastName || ''} <br> 
                        <span>${customer.address || 'No address'}</span><br>
                        <span class="order-id">Order #${customer.order_id}</span>
                    </h4>
                </td>
            `;
            table.appendChild(row);
        });
        
    } catch (error) {
        console.error('Failed to load recent customers:', error);
        showError('Failed to load recent customers');
        
        const table = document.getElementById('recentCustomersTable');
        if (table) {
            table.innerHTML = '<tr><td colspan="2" class="empty-state">No recent customers available</td></tr>';
        }
    }
}

// Load customers for the customers section
async function loadCustomers() {
    try {
        const customers = await AdminAPI.Customers.getAll();
        
        const tbody = document.getElementById('customersTableBody');
        
        if (!tbody) {
            console.warn('Customers table body not found: #customersTableBody');
            return;
        }
        
        tbody.innerHTML = '';
        
        customers.forEach(customer => {
            // Helper for profile picture with fallback
            const getProfilePicture = (picture) => {
                if (!picture || picture === 'null') {
                    // Create an avatar with initials
                    const initials = `${customer.firstName?.charAt(0) || ''}${customer.lastName?.charAt(0) || ''}`.toUpperCase();
                    return `<div class="avatar-initials">${initials}</div>`;
                }
                // Use a data URI instead of loading an external image on error to prevent infinite loops
                return `<img src="${picture}" alt="${customer.firstName} ${customer.lastName}" class="profile-pic" 
                      onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTYgMjU2Ij48Y2lyY2xlIGN4PSIxMjgiIGN5PSIxMjgiIHI9IjEyMCIgZmlsbD0iI2UxZTFlMSIvPjxjaXJjbGUgY3g9IjEyOCIgY3k9IjExMCIgcj0iNDUiIGZpbGw9IiNhMGEwYTAiLz48cGF0aCBkPSJNMjEzLDIxMWMtMTgtMTYtNTMtMzUtODUtMzVzLTY3LDE5LTg1LDM1QzU4LDIzOCw4NywyNTYsMTI4LDI1NlMxOTgsMjM4LDIxMywyMTFaIiBmaWxsPSIjYTBhMGEwIi8+PC9zdmc+'">`;
            };
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${customer.id}</td>
                <td>${getProfilePicture(customer.profilePicture)}</td>
                <td>${customer.first_name || customer.firstName || '-'}</td>
                <td>${customer.last_name || customer.lastName || '-'}</td>
                <td>${customer.email || '-'}</td>
                <td>${customer.phone || '-'}</td>
                <td>${customer.address || '-'}</td>
                <td>${customer.birthDate || customer.birth_date ? new Date(customer.birthDate || customer.birth_date).toLocaleDateString() : '-'}</td>
                <td>${customer.gender || '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn customer-edit-btn" 
                                data-tooltip="Edit Customer" 
                                data-type="customer" 
                                data-id="${customer.id}"
                                onclick="editCustomer(${customer.id})">
                            <ion-icon name="create-outline"></ion-icon>
                        </button>
                        <button class="action-btn delete-btn" 
                                data-tooltip="Delete Customer" 
                                data-type="customer" 
                                data-id="${customer.id}">
                            <ion-icon name="trash-outline"></ion-icon>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Failed to load customers:', error);
        showError('Failed to load customers');
        
        const tbody = document.getElementById('customersTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="10" class="empty-state">No customers available</td></tr>';
        }
    }
}

// Make the loadCustomers function available globally
window.loadCustomers = loadCustomers;

// Load messages for the messages section
async function loadMessages() {
    try {
        const messages = await AdminAPI.Messages.getAll();
        
        const tbody = document.getElementById('messagesTableBody');
        
        if (!tbody) {
            console.warn('Messages table body not found: #messagesTableBody');
            return;
        }
        
        tbody.innerHTML = '';
        
        messages.forEach(message => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${message.id}</td>
                <td>${message.name}</td>
                <td>${message.email}</td>
                <td data-content="email">${message.message.length > 50 ? message.message.substring(0, 50) + '...' : message.message}</td>
                <td>${new Date(message.created_at).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view-btn" data-tooltip="View Message" data-id="${message.id}">
                            <ion-icon name="eye-outline"></ion-icon>
                        </button>
                        <button class="action-btn delete-btn" data-tooltip="Delete Message" data-type="message" data-id="${message.id}">
                            <ion-icon name="trash-outline"></ion-icon>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
            
            // Add click handler to view button
            const viewBtn = row.querySelector('.view-btn');
            if (viewBtn) {
                viewBtn.addEventListener('click', function() {
                    const messageId = this.getAttribute('data-id');
                    if (messageId) {
                        viewMessage(messageId);
                    }
                });
            }
        });
        
    } catch (error) {
        console.error('Failed to load messages:', error);
        showError('Failed to load messages');
        
        const tbody = document.getElementById('messagesTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No messages available</td></tr>';
        }
    }
}

// Load volunteers for the volunteers section
async function loadVolunteers() {
    try {
        const volunteers = await AdminAPI.Volunteers.getAll();
        
        const tbody = document.getElementById('volunteersTableBody');
        
        if (!tbody) {
            console.warn('Volunteers table body not found: #volunteersTableBody');
            return;
        }
        
        tbody.innerHTML = '';
        
        volunteers.forEach(volunteer => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${volunteer.id}</td>
                <td>${volunteer.full_name || 'N/A'}</td>
                <td>${volunteer.age || 'N/A'}</td>
                <td>${volunteer.email}</td>
                <td>${volunteer.phone || 'N/A'}</td>
                <td>${volunteer.location || 'N/A'}</td>
                <td>${volunteer.availability || 'N/A'}</td>
                <td>${volunteer.volunteering_area || 'N/A'}</td>
                <td>${volunteer.languages || 'N/A'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn volunteer-edit-btn" data-tooltip="Edit Volunteer" data-type="volunteer" data-id="${volunteer.id}">
                            <ion-icon name="create-outline"></ion-icon>
                        </button>
                        <button class="action-btn delete-btn" data-tooltip="Delete Volunteer" data-type="volunteer" data-id="${volunteer.id}">
                            <ion-icon name="trash-outline"></ion-icon>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Failed to load volunteers:', error);
        showError('Failed to load volunteers');
        
        const tbody = document.getElementById('volunteersTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="10" class="empty-state">No volunteers available</td></tr>';
        }
    }
}

// Make the loadVolunteers function available globally
window.loadVolunteersFromUI = loadVolunteers;

// Load suppliers for the suppliers section
async function loadSuppliers() {
    try {
        const suppliers = await AdminAPI.Suppliers.getAll();
        
        const tbody = document.getElementById('suppliersTableBody');
        
        if (!tbody) {
            console.warn('Suppliers table body not found: #suppliersTableBody');
            return;
        }
        
        tbody.innerHTML = '';
        
        suppliers.forEach(supplier => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${supplier.id}</td>
                <td>${supplier.name}</td>
                <td>${supplier.email}</td>
                <td>${supplier.phone || 'N/A'}</td>
                <td>${supplier.location || 'N/A'}</td>
                <td>${supplier.sponsorshipTypes || 'N/A'}</td>
                <td>${supplier.collaboration || 'N/A'}</td>
                <td>${supplier.visibility || 'N/A'}</td>
                <td>${new Date(supplier.created_at).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn supplier-edit-btn" data-tooltip="Edit Supplier" data-type="supplier" data-id="${supplier.id}">
                            <ion-icon name="create-outline"></ion-icon>
                        </button>
                        <button class="action-btn delete-btn" data-tooltip="Delete Supplier" data-type="supplier" data-id="${supplier.id}">
                            <ion-icon name="trash-outline"></ion-icon>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Failed to load suppliers:', error);
        showError('Failed to load suppliers');
        
        const tbody = document.getElementById('suppliersTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="10" class="empty-state">No suppliers available</td></tr>';
        }
    }
}

// Make the loadSuppliers function available globally
window.loadSuppliersFromUI = loadSuppliers;

// Load products for the products section
async function loadProducts() {
    try {
        const products = await AdminAPI.Products.getAll();
        console.log('Products loaded:', products.length);
        
        // Debug log for the first few products
        products.slice(0, 3).forEach(product => {
            console.log(`Product ${product.id} - ${product.name}:`, {
                imagePath: product.image,
                finalSrc: resolveImagePath(product.image)
            });
        });
        
        const tbody = document.getElementById('productsTableBody');
        
        if (!tbody) {
            console.warn('Products table body not found: #productsTableBody');
            return;
        }
        
        tbody.innerHTML = '';
        
        products.forEach(product => {
            // Calculate image source path with error handling
            const imageSrc = resolveImagePath(product.image);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.id}</td>
                <td>
                    <div class="product-image" style="width: 60px; height: 60px; border-radius: 8px; overflow: hidden; background: #f8f9fa;">
                        <img src="${imageSrc}" 
                             alt="${product.name}"
                             style="width: 100%; height: 100%; object-fit: cover;"
                             onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTYgMjU2Ij48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2Y4ZjlmYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjYWFhYWFhIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9IidBcmlhbCcsIHNhbnMtc2VyaWYiPuKaoO+4jzwvdGV4dD48L3N2Zz4=';">
                    </div>
                </td>
                <td>${product.name}</td>
                <td>EGP ${formatNumber(product.price)}</td>
                <td>EGP ${formatNumber(product.old_price)}</td>
                <td>${product.type || 'N/A'}</td>
                <td>${product.Category || 'N/A'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn product-edit-btn" data-tooltip="Edit Product" data-type="product" data-id="${product.id}">
                            <ion-icon name="create-outline"></ion-icon>
                        </button>
                        <button class="action-btn delete-btn" data-tooltip="Delete Product" data-type="product" data-id="${product.id}">
                            <ion-icon name="trash-outline"></ion-icon>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Failed to load products:', error);
        showError('Failed to load products');
        
        const tbody = document.getElementById('productsTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No products available</td></tr>';
        }
    }
}

// Make the loadProducts function available globally
window.loadProductsFromUI = loadProducts;

// Add a check for existing orders data
async function checkForOrdersData() {
    try {
        console.log('Checking for orders data in the database...');
        // Make a simple API call to check if there are any orders
        const response = await fetch('/api/admin/orders', {
            headers: AdminAuth.getAuthHeaders()
        });
        
        if (!response.ok) {
            console.error('Failed to check for orders data, status:', response.status);
            return { hasData: false, error: 'API error ' + response.status };
        }
        
        const data = await response.json();
        const hasData = Array.isArray(data) && data.length > 0;
        
        console.log(`Orders data check: ${hasData ? 'Found ' + data.length + ' orders' : 'No orders found'}`);
        
        return { 
            hasData, 
            count: Array.isArray(data) ? data.length : 0,
            sample: Array.isArray(data) && data.length > 0 ? data[0] : null
        };
    } catch (error) {
        console.error('Error checking for orders data:', error);
        return { hasData: false, error: error.message };
    }
}

// Update the initCharts function to add the database check
async function initCharts() {
    try {
        console.log('Initializing charts for admin dashboard...');
        
        // Add a temporary debug message to the UI
        const salesChart = document.getElementById('salesChart');
        if (salesChart) {
            const ctx = salesChart.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, salesChart.width, salesChart.height);
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#333';
                ctx.fillText('Initializing chart and fetching data...', salesChart.width/2, salesChart.height/2);
            }
        }
        
        // Initialize global chart reference storage
        window.adminCharts = {};
        
        // Destroy any existing chart instances first
        if (typeof Chart !== 'undefined' && Chart.instances) {
            Object.keys(Chart.instances).forEach(key => {
                if (Chart.instances[key]) {
                    Chart.instances[key].destroy();
                }
            });
        }

        // First check if there's any orders data available
        const orderData = await checkForOrdersData();
        
        // If we have no orders data, show a helpful message
        if (!orderData.hasData) {
            const canvas = document.getElementById('salesChart');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.font = '16px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#e74c3c';
                    ctx.fillText('No orders data found in database', canvas.width/2, canvas.height/2 - 20);
                    ctx.font = '14px Arial';
                    ctx.fillStyle = '#333';
                    ctx.fillText('Charts require order data to display real information', canvas.width/2, canvas.height/2 + 10);
                    ctx.font = '12px Arial';
                    ctx.fillText('Please add some orders to your database first', canvas.width/2, canvas.height/2 + 30);
                }
                
                // Show the "no data" indicator
                const chartContainer = canvas.parentElement;
                if (chartContainer) {
                    const existingIndicator = chartContainer.querySelector('.fallback-data-indicator');
                    if (existingIndicator) {
                        existingIndicator.remove();
                    }
                    
                    const noDataIndicator = document.createElement('div');
                    noDataIndicator.className = 'fallback-data-indicator';
                    noDataIndicator.innerHTML = '<i class="fas fa-database"></i> No orders in database';
                    chartContainer.appendChild(noDataIndicator);
                }
                
                // Update metrics with N/A
                const metrics = ['totalSalesMetric', 'growthRateMetric', 'peakDayMetric'];
                metrics.forEach(id => {
                    const element = document.getElementById(id);
                    if (element) element.textContent = 'N/A';
                });
                
                console.warn('No orders data found in database. Charts will use sample data.');
                return; // Stop chart initialization
            }
        }

        // Get current period from UI
        const salesPeriodSelect = document.getElementById('salesPeriod');
        const selectedPeriod = salesPeriodSelect ? salesPeriodSelect.value : '30';

        // Get current category period from UI
        const categoryPeriodSelect = document.getElementById('categoryPeriod');
        const selectedCategoryPeriod = categoryPeriodSelect ? categoryPeriodSelect.value : 'month';

        // Set up period change handlers
        if (salesPeriodSelect) {
            salesPeriodSelect.addEventListener('change', async function() {
                try {
                    // Show loading state
                    const salesChart = document.getElementById('salesChart');
                    if (salesChart) {
                        const ctx = salesChart.getContext('2d');
                        if (ctx) {
                            ctx.clearRect(0, 0, salesChart.width, salesChart.height);
                            ctx.font = '14px Arial';
                            ctx.textAlign = 'center';
                            ctx.fillStyle = '#333';
                            ctx.fillText('Loading...', salesChart.width/2, salesChart.height/2);
                        }
                    }
                    
                    // Fetch new data with selected period
                    const newPeriod = this.value;
                    const salesData = await AdminAPI.Dashboard.getSalesOverview(newPeriod);
                    
                    // Destroy existing chart
                    if (window.adminCharts.salesChart) {
                        window.adminCharts.salesChart.destroy();
                    }
                    
                    // Initialize with new data
                    if (salesData) initRealSalesChart(salesData);
                } catch (error) {
                    console.error('Error updating sales chart:', error);
                    showError('Failed to update sales chart with new period');
                }
            });
        }

        if (categoryPeriodSelect) {
            categoryPeriodSelect.addEventListener('change', async function() {
                try {
                    const newPeriod = this.value;
                    // For simplicity, we're not actually implementing different periods for the category chart
                    // In a full implementation, you would fetch new data with a period parameter
                    
                    // Placeholder for actual implementation
                    console.log('Category period changed to:', newPeriod);
                } catch (error) {
                    console.error('Error updating category chart:', error);
                }
            });
        }

        // Get required chart data in parallel
        try {
            console.log('Fetching chart data...');
            
            // Show console instructions for debugging
            console.log('%c📊 DEBUGGING SALES CHART', 'font-size: 16px; font-weight: bold; color: blue;');
            console.log('If you see sample data instead of real data, check:');
            console.log('1. Is there any order data in your database?', orderData.hasData ? '✅ Yes' : '❌ No');
            console.log('2. Check the server console logs for database queries');
            console.log('3. Look for "Fetching sales overview data" logs below to see API response');
            
            const [salesData, categoryData] = await Promise.all([
                AdminAPI.Dashboard.getSalesOverview(selectedPeriod).catch(e => {
                    console.error('Error fetching sales data:', e);
                    return null;
                }),
                AdminAPI.Dashboard.getSalesByCategory().catch(e => {
                    console.error('Error fetching category data:', e);
                    return null;
                })
            ]);

            // Initialize each chart if data is available
            if (salesData) initRealSalesChart(salesData);
            if (categoryData) initRealCategoryChart(categoryData);
            
            console.log('All charts initialized with real data');
        } catch (error) {
            console.error('Error fetching chart data:', error);
            showError('Failed to fetch chart data. Please try again later.');
        }
    } catch (error) {
        console.error('Failed to initialize charts:', error);
        showError('Failed to initialize analytics charts');
    }
}

// Initialize sales chart with real data
function initRealSalesChart(data) {
    try {
        const canvas = document.getElementById('salesChart');
        if (!canvas) {
            console.error('Sales chart canvas not found');
            return;
        }
        
        // Check if we're using fallback data and log clearly
        if (data.isFallback) {
            console.warn('⚠️ USING FALLBACK DATA FOR CHART ⚠️');
            if (data.error) console.warn('Reason:', data.error);
            console.warn('Please check if you have sales data in your database');
        } else {
            console.log('✅ Using real database data for chart with', data.dates.length, 'data points');
        }
        
        // Format data for chart - expect data to have dates and sales arrays
        const chartData = {
            labels: data.dates || [],
            datasets: [{
                label: 'Sales Revenue (EGP)',
                data: data.sales || [],
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                tension: 0.4
            }]
        };
        
        // Create chart with improved options
        window.adminCharts.salesChart = new Chart(canvas, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'EGP ' + formatNumber(value);
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Revenue: EGP ' + formatNumber(context.raw);
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: data.periodLabel || 'Sales Overview',
                        font: {
                            size: 16
                        }
                    }
                }
            }
        });
        
        // Calculate metrics from real data
        const totalSalesElement = document.getElementById('totalSalesMetric');
        const growthRateElement = document.getElementById('growthRateMetric');
        const peakDayElement = document.getElementById('peakDayMetric');
        
        if (totalSalesElement && data.sales && data.sales.length > 0) {
            // Use pre-calculated total or calculate it
            const totalSales = data.totalRevenue || data.sales.reduce((sum, val) => sum + val, 0);
            totalSalesElement.textContent = `EGP ${formatNumber(totalSales)}`;
        }
        
        if (growthRateElement && data.sales && data.sales.length > 1) {
            // Calculate growth rate: compare last day with average of previous days
            const lastDaySales = data.sales[data.sales.length - 1];
            const previousSales = data.sales.slice(0, -1);
            const avgPreviousSales = previousSales.reduce((sum, val) => sum + val, 0) / previousSales.length;
            
            let growthRate = 0;
            if (avgPreviousSales > 0) {
                growthRate = ((lastDaySales - avgPreviousSales) / avgPreviousSales) * 100;
            }
            
            // Update UI with calculated growth rate
            growthRateElement.textContent = `${growthRate.toFixed(1)}%`;
            
            // Update growth indicator icon
            const parentElement = growthRateElement.parentElement;
            if (parentElement) {
                const icon = parentElement.querySelector('i');
                if (icon) {
                    if (growthRate >= 0) {
                        icon.className = 'fas fa-arrow-up';
                        parentElement.classList.remove('negative');
                        parentElement.classList.add('positive');
                    } else {
                        icon.className = 'fas fa-arrow-down';
                        parentElement.classList.remove('positive');
                        parentElement.classList.add('negative');
                    }
                }
            }
        }
        
        if (peakDayElement && data.dates && data.sales && data.sales.length > 0) {
            // Find the day with highest sales
            let peakIndex = 0;
            let peakValue = data.sales[0];
            
            for (let i = 1; i < data.sales.length; i++) {
                if (data.sales[i] > peakValue) {
                    peakValue = data.sales[i];
                    peakIndex = i;
                }
            }
            
            // Get the date from our data
            const peakDate = data.dates[peakIndex];
            if (peakDate) {
                // Extract just the day name
                const peakDateObj = new Date(peakDate);
                if (!isNaN(peakDateObj.getTime())) {
                    // Format as day name
                    const options = { weekday: 'long' };
                    peakDayElement.textContent = peakDateObj.toLocaleDateString(undefined, options);
                } else {
                    // If date parsing fails, use the raw string
                    peakDayElement.textContent = peakDate;
                }
            } else {
                peakDayElement.textContent = 'N/A';
            }
        }
        
        // Add warning if using fallback data
        if (data.isFallback) {
            console.warn('Using fallback sales overview data');
            // Add visual indicator that data is fallback/sample
            const chartContainer = canvas.parentElement;
            if (chartContainer) {
                // Remove any existing indicators first
                const existingIndicator = chartContainer.querySelector('.fallback-data-indicator');
                if (existingIndicator) {
                    existingIndicator.remove();
                }
                
                const fallbackIndicator = document.createElement('div');
                fallbackIndicator.className = 'fallback-data-indicator';
                fallbackIndicator.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                
                // Add troubleshooting button
                const troubleshootBtn = document.createElement('button');
                troubleshootBtn.className = 'troubleshoot-btn';
                troubleshootBtn.innerHTML = '<i class="fas fa-wrench"></i>';
                troubleshootBtn.title = 'Troubleshoot data issues';
                troubleshootBtn.onclick = function() {
                    showDataTroubleshooting(data.error || 'Unknown error');
                };
                fallbackIndicator.appendChild(troubleshootBtn);
                
                chartContainer.appendChild(fallbackIndicator);
            }
        } else {
            // If using real data, remove any fallback indicators
            const chartContainer = canvas.parentElement;
            if (chartContainer) {
                const fallbackIndicator = chartContainer.querySelector('.fallback-data-indicator');
                if (fallbackIndicator) {
                    fallbackIndicator.remove();
                }
            }
        }
    } catch (error) {
        console.error('Error initializing sales chart with real data:', error);
        
        // Create a visual error state in the UI
        const canvas = document.getElementById('salesChart');
        if (canvas) {
            const context = canvas.getContext('2d');
            if (context) {
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.font = '14px Arial';
                context.textAlign = 'center';
                context.fillStyle = '#e74c3c';
                context.fillText('Error loading sales chart', canvas.width/2, canvas.height/2);
                context.font = '12px Arial';
                context.fillText('Check console for details (F12)', canvas.width/2, canvas.height/2 + 20);
            }
            
            // Update metrics with N/A
            const metrics = ['totalSalesMetric', 'growthRateMetric', 'peakDayMetric'];
            metrics.forEach(id => {
                const element = document.getElementById(id);
                if (element) element.textContent = 'N/A';
            });
        }
    }
}

// Initialize category chart with real data
function initRealCategoryChart(data) {
    try {
        const canvas = document.getElementById('categoryChart');
        if (!canvas) return;
        
        // Ensure data is an array (even if empty)
        const categories = Array.isArray(data) ? data : [{ category: 'No Data', revenue: 0 }];
        
        // Format data for chart
        const chartData = {
            labels: categories.map(item => item.category),
            datasets: [{
                label: 'Revenue',
                data: categories.map(item => item.revenue),
                backgroundColor: [
                    '#0097A7', // Teal
                    '#005662', // Lighter Teal
                    '#AEEA00', // Dark Teal
                    '#FFC107', // Bright Green
                    '#00B8D9'  // Mustard Yellow
                ],
                borderWidth: 1
            }]
        };
        
        // Create chart
        window.adminCharts.categoryChart = new Chart(canvas, {
            type: 'doughnut',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
        
        // Update category metrics with data or hardcoded values
        if (categories && categories.length > 0) {
            // Find the category with highest revenue
            const topCategory = categories.reduce((max, cat) => (cat.revenue > max.revenue ? cat : max), categories[0]);
            
            document.getElementById('topCategoryMetric').textContent = topCategory.category || 'Upper Limb';
            document.getElementById('categoryGrowthMetric').textContent = '10.5%';
            
            // Calculate total sales from all categories
            const totalSales = categories.reduce((sum, cat) => sum + (cat.revenue || 0), 0);
            document.getElementById('categorySalesMetric').textContent = `EGP ${formatNumber(totalSales)}`;
        } else {
            // Fallback values
            document.getElementById('topCategoryMetric').textContent = 'Upper Limb';
            document.getElementById('categoryGrowthMetric').textContent = '10.5%';
            document.getElementById('categorySalesMetric').textContent = 'EGP 1,140,000';
        }
    } catch (error) {
        console.error('Error initializing category chart with real data:', error);
    }
}

// Update charts based on selected period
function updateSalesChart() {
    // Implementation would fetch new data based on period and update chart
    console.log('Updating sales chart with period:', this.value);
}

function updateProductsChart() {
    console.log('Updating products chart with period:', this.value);
}

function updateRevenueChart() {
    console.log('Updating revenue chart with period:', this.value);
}

function updateDemographicsChart() {
    console.log('Updating demographics chart with type:', this.value);
}

function updateCategoryChart() {
    console.log('Updating category chart with period:', this.value);
}

function updateOrderStatusChart() {
    console.log('Updating order status chart with period:', this.value);
}

// Update charts for dark mode
function updateChartsForDarkMode() {
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDarkMode ? '#e0e0e0' : '#333333';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    // Update all charts from our stored references instead of using Chart.instances
    const charts = window.adminCharts || {};
    
    // Update each chart if it exists
    Object.values(charts).forEach(chart => {
        if (!chart) return;
        
        // Update chart options based on chart type
        if (chart.options.scales.x) {
            chart.options.scales.x.grid.color = gridColor;
            chart.options.scales.x.ticks.color = textColor;
        }
        
        if (chart.options.scales.y) {
            chart.options.scales.y.grid.color = gridColor;
            chart.options.scales.y.ticks.color = textColor;
        }
        
        if (chart.options.scales.r) {
            chart.options.scales.r.grid.color = gridColor;
            chart.options.scales.r.ticks.color = textColor;
            chart.options.scales.r.pointLabels.color = textColor;
        }
        
        // Update legend text color
        if (chart.options.plugins.legend) {
            chart.options.plugins.legend.labels.color = textColor;
        }
        
        chart.update();
    });
}

// View message details
function viewMessage(messageId) {
    // Show loading indicator
    const loadingToast = document.createElement('div');
    loadingToast.className = 'toast-notification info';
    loadingToast.innerHTML = `
        <div class="toast-icon">
            <ion-icon name="refresh-outline"></ion-icon>
        </div>
        <div class="toast-message">Loading message...</div>
    `;
    document.body.appendChild(loadingToast);
    
    AdminAPI.Messages.getById(messageId)
        .then(message => {
            // Remove loading toast
            loadingToast.remove();
            
            // Format the message date
            const messageDate = new Date(message.created_at).toLocaleString();
            
            // Create modal content
            const bodyContent = `
                <div class="message-view">
                    <div class="form-group input-with-icon">
                        <label for="senderName">From</label>
                        <input type="text" class="form-control" id="senderName" value="${message.name}" readonly>
                        <ion-icon name="person-outline" class="input-icon"></ion-icon>
                    </div>
                    
                    <div class="form-group input-with-icon">
                        <label for="senderEmail">Email</label>
                        <input type="email" class="form-control" id="senderEmail" value="${message.email}" readonly>
                        <ion-icon name="mail-outline" class="input-icon"></ion-icon>
                    </div>
                    
                    <div class="form-group input-with-icon">
                        <label for="messageDate">Date</label>
                        <input type="text" class="form-control" id="messageDate" value="${messageDate}" readonly>
                        <ion-icon name="calendar-outline" class="input-icon"></ion-icon>
                    </div>
                    
                    <div class="form-group">
                        <label for="messageContent">Message</label>
                        <div class="message-body">
                            <div class="message-content" id="messageContent">${message.message}</div>
                        </div>
                    </div>
                    
                    <div class="form-group input-with-icon">
                        <label for="replyMessage">Reply</label>
                        <textarea id="replyMessage" class="form-control icon-enhanced" rows="4" placeholder="Type your reply here..."></textarea>
                        <ion-icon name="create-outline" class="input-icon"></ion-icon>
                    </div>
                </div>
            `;
            
            const footerContent = `
                <button type="button" class="modal-btn btn-secondary" id="closeMessageBtn">Close</button>
                <button type="button" class="modal-btn btn-primary" id="sendReplyBtn">
                    <ion-icon name="send-outline"></ion-icon> Send Reply
                </button>
            `;
            
            // Create or get the modal
            const existingModal = document.getElementById('view-message-modal');
            if (existingModal) {
                existingModal.remove();
            }
            
            const modal = ModalManager.create({
                title: 'Message Details',
                body: bodyContent,
                footer: footerContent,
                id: 'view-message-modal',
                size: 'lg'
            });
            
            // Show the modal
            const shownModal = ModalManager.show(modal);
            
            // Setup reply button functionality
            const sendReplyBtn = shownModal.querySelector('#sendReplyBtn');
            if (sendReplyBtn) {
                sendReplyBtn.addEventListener('click', function() {
                    const replyText = document.getElementById('replyMessage').value.trim();
                    if (replyText === '') {
                        showError('Please enter a reply message');
                        return;
                    }
                    
                    // Show sending state
                    this.disabled = true;
                    this.innerHTML = '<ion-icon name="refresh-outline" class="spin"></ion-icon> Sending...';
                    
                    // In a real app, you would send this reply via an API call
                    // For now, we'll just simulate a successful reply
                    setTimeout(() => {
                        // Hide modal
                        ModalManager.hide(modal);
                        
                        // Show success message
                        showSuccess(`Reply sent to ${message.name} at ${message.email}`);
                    }, 1000);
                });
            }
        })
        .catch(error => {
            // Remove loading toast
            loadingToast.remove();
            
            console.error('Failed to view message:', error);
            showError('Failed to load message details');
        });
}

// Helper function to add message modal styles
function addMessageModalStyles() {
    if (document.getElementById('message-modal-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'message-modal-styles';
    style.textContent = `
        .message-view {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }
        
        .message-header {
            border-bottom: 1px solid var(--border_color);
            padding-bottom: 1rem;
        }
        
        .message-info {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        
        .sender-info {
            font-size: 1.1rem;
        }
        
        .message-email {
            color: var(--text-muted);
            margin-left: 0.5rem;
        }
        
        .message-date {
            color: var(--text-muted);
            font-size: 0.9rem;
        }
        
        .message-body {
            background-color: var(--white_color);
            border-radius: 8px;
            padding: 1.5rem;
            min-height: 100px;
            border: 1px solid var(--border_color);
            white-space: pre-wrap;
        }
        
        .message-content {
            line-height: 1.6;
        }
        
        .reply-section h3 {
            margin-bottom: 1rem;
            font-size: 1.1rem;
            color: var(--main_color);
        }
        
        #view-message-modal .modal-dialog {
            max-width: 700px;
        }
        
        #view-message-modal .modal-body {
            padding: 1.5rem;
        }
        
        /* Dark mode styles */
        [data-theme="dark"] .message-body {
            background-color: var(--card-bg);
            border-color: var(--border_color);
        }
        
        [data-theme="dark"] .message-email {
            color: var(--text-muted);
        }
    `;
    
    document.head.appendChild(style);
}

// Show delete confirmation modal
function showDeleteConfirmationModal(type, id) {
    // Capitalize type for display
    const displayType = type.charAt(0).toUpperCase() + type.slice(1);
    
    // Create modal content
    const bodyContent = `<p>Are you sure you want to delete this ${type}? This action cannot be undone.</p>`;
    
    const footerContent = `
        <button type="button" class="modal-btn btn-secondary" id="cancelDeleteBtn">Cancel</button>
        <button type="button" class="modal-btn btn-danger" id="confirmDeleteBtn">Delete</button>
    `;
    
    // Create the modal
    const modal = ModalManager.create({
        title: `Delete ${displayType}`,
        body: bodyContent,
        footer: footerContent,
        id: 'delete-confirmation-modal'
    });
    
    // Show the modal - this now returns the updated modal element
    const shownModal = ModalManager.show(modal);
    
    // Add event listener for delete confirmation
    const confirmBtn = shownModal.querySelector('#confirmDeleteBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Show loading indicator
            this.innerHTML = '<ion-icon name="refresh-outline" class="spin"></ion-icon> Deleting...';
            this.disabled = true;
            
            // Call the delete function
            deleteItem(type, id);
            
            // Hide the modal
            ModalManager.hide(shownModal);
        });
    }
}

// Delete an item
function deleteItem(type, id) {
    let apiCall;
    
    switch (type) {
        case 'customer':
            apiCall = AdminAPI.Customers.delete(id);
            break;
        case 'message':
            apiCall = AdminAPI.Messages.delete(id);
            break;
        case 'volunteer':
            apiCall = AdminAPI.Volunteers.delete(id);
            break;
        case 'supplier':
            apiCall = AdminAPI.Suppliers.delete(id);
            break;
        case 'product':
            apiCall = AdminAPI.Products.delete(id);
            break;
        default:
            showError('Unknown item type');
            return;
    }
    
    apiCall
        .then(() => {
            // Reload the appropriate section
            switch (type) {
                case 'customer':
                    loadCustomers();
                    break;
                case 'message':
                    loadMessages();
                    break;
                case 'volunteer':
                    loadVolunteers();
                    break;
                case 'supplier':
                    loadSuppliers();
                    break;
                case 'product':
                    loadProducts();
                    break;
            }
            showSuccess(`${type} deleted successfully`);
        })
        .catch(error => {
            console.error(`Failed to delete ${type}:`, error);
            showError(`Failed to delete ${type}`);
        });
}

// Set trend indicator (positive or negative)
function setTrendIndicator(trendId, valueId, percentage) {
    const trendElement = document.getElementById(trendId);
    const valueElement = document.getElementById(valueId);
    
    if (!trendElement || !valueElement) {
        console.warn(`Missing element for trend indicator: ${trendId} or ${valueId}`);
        return;
    }
    
    if (percentage >= 0) {
        trendElement.classList.add('positive');
        trendElement.classList.remove('negative');
        
        // Find the icon element within the trend div
        const iconElement = trendElement.querySelector('i.fas') || trendElement.querySelector('i');
        if (iconElement) {
            iconElement.className = 'fas fa-arrow-up';
        }
    } else {
        trendElement.classList.add('negative');
        trendElement.classList.remove('positive');
        
        // Find the icon element within the trend div
        const iconElement = trendElement.querySelector('i.fas') || trendElement.querySelector('i');
        if (iconElement) {
            iconElement.className = 'fas fa-arrow-down';
        }
    }
    
    valueElement.textContent = `${Math.abs(percentage).toFixed(1)}%`;
}

// Helper to format numbers with commas
function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    return parseFloat(num).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

// Show error message
function showError(message) {
    console.error(message);
    
    // Create and show a toast notification
    const toast = document.createElement('div');
    toast.className = 'toast-notification error';
    toast.innerHTML = `
        <div class="toast-icon">
            <ion-icon name="alert-circle-outline"></ion-icon>
        </div>
        <div class="toast-message">${message}</div>
        <button class="toast-close">
            <ion-icon name="close-outline"></ion-icon>
        </button>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
    
    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            toast.remove();
        }, 300);
    });
}

// Show success message
function showSuccess(message) {
    console.log(message);
    
    // Create and show a toast notification
    const toast = document.createElement('div');
    toast.className = 'toast-notification success';
    toast.innerHTML = `
        <div class="toast-icon">
            <ion-icon name="checkmark-circle-outline"></ion-icon>
        </div>
        <div class="toast-message">${message}</div>
        <button class="toast-close">
            <ion-icon name="close-outline"></ion-icon>
        </button>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
    
    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            toast.remove();
        }, 300);
    });
}

// Helper function to show troubleshooting information for data issues
function showDataTroubleshooting(errorMessage) {
    const modal = document.createElement('div');
    modal.className = 'troubleshooting-modal';
    modal.innerHTML = `
        <div class="troubleshooting-content">
            <h2>Chart Data Troubleshooting</h2>
            <p>The chart is showing sample data because real data could not be loaded from the database.</p>
            <h3>Error:</h3>
            <p class="error-message">${errorMessage}</p>
            <h3>Possible Solutions:</h3>
            <ol>
                <li>Verify you have orders data in your database</li>
                <li>Check server console logs for database query errors</li>
                <li>Ensure your server is running and accessible</li>
                <li>Check that API endpoints are correctly configured</li>
                <li>Try selecting a different time period</li>
            </ol>
            <h3>Technical Details:</h3>
            <p>The chart tries to fetch data from <code>/api/admin/analytics/revenue-analysis</code></p>
            <p>This endpoint queries the <code>orders</code> and <code>order_items</code> tables.</p>
            <button class="close-btn">Close</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add style if not already present
    if (!document.getElementById('troubleshooting-styles')) {
        const style = document.createElement('style');
        style.id = 'troubleshooting-styles';
        style.textContent = `
            .troubleshooting-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            .troubleshooting-content {
                background-color: white;
                padding: 20px;
                border-radius: 8px;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
            }
            .troubleshooting-content h2 {
                margin-top: 0;
                color: #333;
            }
            .troubleshooting-content .error-message {
                background-color: #ffeeee;
                padding: 10px;
                border-left: 4px solid #e74c3c;
                font-family: monospace;
            }
            .troubleshooting-content .close-btn {
                background-color: #3498db;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 15px;
            }
            .troubleshooting-content code {
                background-color: #f8f8f8;
                padding: 2px 4px;
                border-radius: 4px;
                font-family: monospace;
            }
            .troubleshoot-btn {
                background: none;
                border: none;
                color: #856404;
                cursor: pointer;
                margin-left: 8px;
                font-size: 14px;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Close button functionality
    modal.querySelector('.close-btn').addEventListener('click', () => {
        modal.remove();
    });
}

// Load all orders for the modal
async function loadAllOrders() {
    try {
        const orders = await AdminAPI.Dashboard.getAllOrders();
        const tbody = document.getElementById('allOrdersTable');
        
        if (!tbody) {
            console.warn('All orders table not found: #allOrdersTable');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No orders available</td></tr>';
            return;
        }
        
        orders.forEach(order => {
            const row = document.createElement('tr');
            
            // Define status class based on order status
            let statusClass = '';
            switch(order.status) {
                case 'delivered':
                    statusClass = 'delivered';
                    break;
                case 'pending':
                    statusClass = 'pending';
                    break;
                case 'shipped':
                    statusClass = 'shipping';
                    break;
                case 'cancelled':
                    statusClass = 'cancelled';
                    break;
                default:
                    statusClass = 'processing';
            }
            
            // Format the date
            const orderDate = new Date(order.order_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            row.innerHTML = `
                <td>#${order.order_id}</td>
                <td>${order.firstName} ${order.lastName}</td>
                <td>EGP ${formatNumber(order.total_amount)}</td>
                <td>Paid</td>
                <td><span class="status ${statusClass}">${order.status}</span></td>
                <td>${orderDate}</td>
            `;
            
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Failed to load all orders:', error);
        showError('Failed to load all orders');
        
        const tbody = document.getElementById('allOrdersTable');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No orders available</td></tr>';
        }
    }
}

// Initialize modal functionality
function initOrdersModal() {
    const modal = document.getElementById('allOrdersModal');
    const viewAllBtn = document.querySelector('.recentOrders .cardHeader .btn');
    
    if (!modal || !viewAllBtn) {
        console.warn('Modal elements not found');
        return;
    }
    
    // Open modal
    viewAllBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const shownModal = ModalManager.show(modal);
        
        // Ensure close buttons work
        const closeButtons = shownModal.querySelectorAll('.close, .btn-secondary, [data-dismiss="modal"]');
        closeButtons.forEach(button => {
            if (button) {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    ModalManager.hide(shownModal);
                });
            }
        });
        
        // Load orders data
        loadAllOrders();
    });
}

// Add order details functionality
async function showOrderDetails(orderId) {
    try {
        // Get order details from the API
        const orderDetails = await AdminAPI.Dashboard.getOrderDetails(orderId);
        
        // Update modal content
        document.getElementById('modalOrderId').textContent = `#${orderDetails.order_id}`;
        document.getElementById('modalOrderDate').textContent = new Date(orderDetails.order_date).toLocaleDateString();
        document.getElementById('modalOrderStatus').textContent = orderDetails.status;
        document.getElementById('modalOrderTotal').textContent = `EGP ${formatNumber(orderDetails.total_amount)}`;
        
        document.getElementById('modalCustomerName').textContent = `${orderDetails.firstName} ${orderDetails.lastName}`;
        document.getElementById('modalCustomerEmail').textContent = orderDetails.email || 'N/A';
        document.getElementById('modalCustomerPhone').textContent = orderDetails.phone || 'N/A';
        document.getElementById('modalCustomerAddress').textContent = orderDetails.address || 'N/A';
        
        // Update order items
        const itemsContainer = document.getElementById('modalOrderItems');
        itemsContainer.innerHTML = '';
        
        if (orderDetails.items && orderDetails.items.length > 0) {
            orderDetails.items.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.product_name}</td>
                    <td>EGP ${formatNumber(item.price)}</td>
                    <td>${item.quantity}</td>
                    <td>EGP ${formatNumber(item.price * item.quantity)}</td>
                `;
                itemsContainer.appendChild(row);
            });
        } else {
            itemsContainer.innerHTML = '<tr><td colspan="4" class="empty-state">No items found</td></tr>';
        }
        
        // Show the modal using the enhanced ModalManager
        const modal = document.getElementById('orderDetailsModal');
        if (modal) {
            // Get the shown modal with attached event handlers
            const shownModal = ModalManager.show(modal);
            
            // Ensure close buttons work
            const closeButtons = shownModal.querySelectorAll('.close, .btn-secondary, [data-dismiss="modal"]');
            closeButtons.forEach(button => {
                if (button) {
                    button.addEventListener('click', function(e) {
                        e.preventDefault();
                        ModalManager.hide(shownModal);
                    });
                }
            });
        } else {
            console.error('Order details modal not found');
        }
        
    } catch (error) {
        console.error('Failed to load order details:', error);
        showError('Failed to load order details');
    }
}

// Add scroll spy functionality
function initScrollSpy() {
    const sections = document.querySelectorAll('div[id]');
    const navLinks = document.querySelectorAll('.navigation ul li a[href^="#"]');
    
    function highlightNavItem() {
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100; // Offset for better detection
            const sectionHeight = section.offsetHeight;
            const scroll = window.scrollY;
            
            if (scroll >= sectionTop && scroll < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.parentElement.classList.remove('hovered');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.parentElement.classList.add('hovered');
            }
        });
    }
    
    // Add scroll event listener
    window.addEventListener('scroll', highlightNavItem);
    
    // Initial check
    highlightNavItem();
}

// Export functions for external use
window.loadDashboardStats = loadDashboardStats;
window.loadBestSellers = loadBestSellers;
window.loadQuickStats = loadQuickStats;
window.loadRecentOrders = loadRecentOrders;
window.loadRecentCustomers = loadRecentCustomers;
window.loadCustomers = loadCustomers;
window.loadMessages = loadMessages;
window.loadVolunteers = loadVolunteers;
window.loadSuppliers = loadSuppliers;
window.loadProducts = loadProducts;
window.initCharts = initCharts;
window.updateSalesChart = updateSalesChart;
window.updateProductsChart = updateProductsChart;
window.updateRevenueChart = updateRevenueChart;
window.updateDemographicsChart = updateDemographicsChart;
window.updateCategoryChart = updateCategoryChart;
window.updateOrderStatusChart = updateOrderStatusChart;
window.updateChartsForDarkMode = updateChartsForDarkMode;
window.viewMessage = viewMessage;
window.deleteItem = deleteItem;
window.editItem = editItem; // Add editItem to window object
window.signOut = AdminAPI.Auth.logout;
window.showOrderDetails = showOrderDetails;
window.toggleOrderDetails = toggleOrderDetails;
window.ModalManager = ModalManager; // Export ModalManager for use in other scripts

// Check authentication status
const checkAuth = async () => {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      window.location.href = '../Login Page.html';
      return;
    }

    const response = await fetch('/api/admin/verify', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      localStorage.removeItem('adminToken');
      window.location.href = '../index.html';
      return;
    }

    const data = await response.json();
    if (data.isAdmin) {
      // Update admin name display
      const adminNameElement = document.querySelector('.admin-name');
      if (adminNameElement) {
        adminNameElement.textContent = 'Admin User';
      }
    } else {
      window.location.href = '../index.html';
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    localStorage.removeItem('adminToken');
    window.location.href = '../Login Page.html';
  }
};

// Improved function to get entity type from context
function getTypeFromContext(button) {
    // First check if we're in a specific table body
    const tableRow = button.closest('tr');
    if (!tableRow) return null;
    
    // Check if we're in a specific table body
    if (tableRow.closest('#volunteersTableBody')) {
        return 'volunteer';
    } else if (tableRow.closest('#suppliersTableBody')) {
        return 'supplier';
    } else if (tableRow.closest('#customersTableBody')) {
        return 'customer';
    } else if (tableRow.closest('#messagesTableBody')) {
        return 'message';
    } else if (tableRow.closest('#productsTableBody')) {
        return 'product';
    }
    
    // Fallback: check button classes
    if (button.classList.contains('volunteer-edit-btn')) {
        return 'volunteer';
    } else if (button.classList.contains('supplier-edit-btn')) {
        return 'supplier';
    } else if (button.classList.contains('customer-edit-btn')) {
        return 'customer';
    } else if (button.classList.contains('message-view-btn')) {
        return 'message';
    } else if (button.classList.contains('product-edit-btn')) {
        return 'product';
    }
    
    // Fallback: check the closest table
    const table = tableRow.closest('table');
    if (!table) return null;
    
    // Check table ID or class
    if (table.id.includes('volunteers') || table.classList.contains('volunteers-table')) {
        return 'volunteer';
    } else if (table.id.includes('suppliers') || table.classList.contains('suppliers-table')) {
        return 'supplier';
    } else if (table.id.includes('customers') || table.classList.contains('customers-table')) {
        return 'customer';
    } else if (table.id.includes('messages') || table.classList.contains('messages-table')) {
        return 'message';
    } else if (table.id.includes('products') || table.classList.contains('products-table')) {
        return 'product';
    }
    
    // We couldn't determine the type
    console.warn('Could not determine entity type from context', button);
    return null;
}

// Function to handle edit button clicks
function editItem(type, id) {
    console.log(`Editing ${type} with ID: ${id}`);
    
    // Show a loading message
    showSuccess(`Loading ${type} data...`);
    
    let apiCall;
    
    switch (type) {
        case 'customer':
            if (typeof window.editCustomer === 'function') {
                console.log('Using window.editCustomer function');
                window.editCustomer(id);
                return;
            }
            console.log('Using AdminAPI.Customers.getById');
            apiCall = AdminAPI.Customers.getById(id);
            break;
        case 'message':
            apiCall = AdminAPI.Messages.getById(id);
            break;
        case 'volunteer':
            if (typeof window.editVolunteer === 'function') {
                console.log('Using window.editVolunteer function');
                window.editVolunteer(id);
                return;
            }
            console.log('Using AdminAPI.Volunteers.getById');
            apiCall = AdminAPI.Volunteers.getById(id);
            break;
        case 'supplier':
            if (typeof window.editSupplier === 'function') {
                console.log('Using window.editSupplier function');
                window.editSupplier(id);
                return;
            }
            console.log('Using AdminAPI.Suppliers.getById');
            apiCall = AdminAPI.Suppliers.getById(id);
            break;
        case 'product':
            apiCall = AdminAPI.Products.getById(id);
            break;
        default:
            showError(`Unknown item type: ${type}`);
            return;
    }
    
    // Fetch the item data and show edit modal
    apiCall
        .then(data => {
            // Debug log the data received
            console.log(`${type} data received:`, data);
            
            // Create and show the edit modal
            showEditModal(type, data, `Edit ${type.charAt(0).toUpperCase() + type.slice(1)}`);
        })
        .catch(error => {
            console.error(`Failed to fetch ${type} details:`, error);
            showError(`Failed to load ${type} details`);
        });
}

// Function to create and show an edit modal
function showEditModal(type, data, title) {
    // Remove any existing modal with the same ID
    const existingModal = document.getElementById(`edit-${type}-modal`);
    if (existingModal) {
        existingModal.remove();
    }
    
    // Generate form fields based on item type
    let formFields = '';
    
    switch (type) {
        case 'customer':
            formFields = `
                <div class="form-group">
                    <label for="firstName">First Name</label>
                    <input type="text" id="firstName" name="firstName" value="${data.firstName || ''}" required>
                </div>
                <div class="form-group">
                    <label for="lastName">Last Name</label>
                    <input type="text" id="lastName" name="lastName" value="${data.lastName || ''}" required>
                </div>
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" value="${data.email || ''}" required>
                </div>
                <div class="form-group">
                    <label for="phone">Phone</label>
                    <input type="text" id="phone" name="phone" value="${data.phone || ''}">
                </div>
                <div class="form-group">
                    <label for="address">Address</label>
                    <textarea id="address" name="address">${data.address || ''}</textarea>
                </div>
            `;
            break;
            
        case 'message':
            // For messages, show read-only view with reply option
            formFields = `
                <div class="form-group">
                    <label>From</label>
                    <div class="form-control-static">${data.name} (${data.email})</div>
                </div>
                <div class="form-group">
                    <label>Date</label>
                    <div class="form-control-static">${new Date(data.created_at).toLocaleString()}</div>
                </div>
                <div class="form-group">
                    <label>Message</label>
                    <div class="form-control-static message-content">${data.message}</div>
                </div>
                <div class="form-group">
                    <label for="reply">Reply</label>
                    <textarea id="reply" name="reply" placeholder="Enter your reply..."></textarea>
                </div>
            `;
            break;
            
        case 'volunteer':
            formFields = `
                <div class="form-group">
                    <label for="full_name">Full Name</label>
                    <input type="text" id="full_name" name="full_name" value="${data.full_name || ''}" required>
                </div>
                <div class="form-group">
                    <label for="age">Age</label>
                    <input type="number" id="age" name="age" value="${data.age || ''}" min="18" max="100">
                </div>
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" value="${data.email || ''}" required>
                </div>
                <div class="form-group">
                    <label for="phone">Phone</label>
                    <input type="text" id="phone" name="phone" value="${data.phone || ''}">
                </div>
                <div class="form-group">
                    <label for="location">Location</label>
                    <input type="text" id="location" name="location" value="${data.location || ''}">
                </div>
                <div class="form-group">
                    <label for="availability">Availability</label>
                    <select id="availability" name="availability">
                        <option value="Weekdays" ${data.availability === 'Weekdays' ? 'selected' : ''}>Weekdays</option>
                        <option value="Weekends" ${data.availability === 'Weekends' ? 'selected' : ''}>Weekends</option>
                        <option value="Both" ${data.availability === 'Both' ? 'selected' : ''}>Both</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="volunteering_area">Volunteering Area</label>
                    <input type="text" id="volunteering_area" name="volunteering_area" value="${data.volunteering_area || ''}">
                </div>
            `;
            break;
            
        case 'supplier':
            formFields = `
                <div class="form-group">
                    <label for="name">Name</label>
                    <input type="text" id="name" name="name" value="${data.name || ''}" required>
                </div>
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" value="${data.email || ''}" required>
                </div>
                <div class="form-group">
                    <label for="phone">Phone</label>
                    <input type="text" id="phone" name="phone" value="${data.phone || ''}">
                </div>
                <div class="form-group">
                    <label for="location">Location</label>
                    <input type="text" id="location" name="location" value="${data.location || ''}">
                </div>
                <div class="form-group">
                    <label for="sponsorshipTypes">Sponsorship Types</label>
                    <input type="text" id="sponsorshipTypes" name="sponsorshipTypes" value="${data.sponsorshipTypes || ''}">
                </div>
                <div class="form-group">
                    <label for="collaboration">Collaboration</label>
                    <input type="text" id="collaboration" name="collaboration" value="${data.collaboration || ''}">
                </div>
                <div class="form-group">
                    <label for="visibility">Visibility</label>
                    <select id="visibility" name="visibility">
                        <option value="High" ${data.visibility === 'High' ? 'selected' : ''}>High</option>
                        <option value="Medium" ${data.visibility === 'Medium' ? 'selected' : ''}>Medium</option>
                        <option value="Low" ${data.visibility === 'Low' ? 'selected' : ''}>Low</option>
                    </select>
                </div>
            `;
            break;
            
        case 'product':
            formFields = `
                <div class="form-group">
                    <label for="name">Name</label>
                    <input type="text" id="name" name="name" value="${data.name || ''}" required>
                </div>
                <div class="form-group">
                    <label for="description">Description</label>
                    <textarea id="description" name="description">${data.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="price">Price (EGP)</label>
                    <input type="number" id="price" name="price" value="${data.price || ''}" step="0.01" min="0" required>
                </div>
                <div class="form-group">
                    <label for="old_price">Old Price (EGP)</label>
                    <input type="number" id="old_price" name="old_price" value="${data.old_price || ''}" step="0.01" min="0">
                </div>
                <div class="form-group">
                    <label for="type">Type</label>
                    <input type="text" id="type" name="type" value="${data.type || ''}">
                </div>
                <div class="form-group">
                    <label for="Category">Category</label>
                    <input type="text" id="Category" name="Category" value="${data.Category || ''}">
                </div>
                <div class="form-group">
                    <label for="image">Current Image</label>
                    <div class="current-image">
                        <img src="${resolveImagePath(data.image)}" alt="${data.name || 'Product'}">
                    </div>
                    <label for="newImage">Upload New Image</label>
                    <input type="file" id="newImage" name="newImage" accept="image/*">
                    <input type="hidden" id="existingImage" name="existingImage" value="${data.image || ''}">
                </div>
            `;
            break;
            
        default:
            formFields = `<p>No fields available for ${type}</p>`;
    }
    
    // Create the form content
    const formHtml = `
        <form id="editForm" enctype="multipart/form-data">
            <input type="hidden" name="id" value="${data.id}">
            ${formFields}
        </form>
    `;
    
    // Create footer buttons
    const footerHtml = `
        <button type="button" class="modal-btn btn-secondary" id="cancelBtn">Cancel</button>
        <button type="button" class="modal-btn btn-primary" id="saveBtn">Save Changes</button>
    `;
    
    // Create the modal using ModalManager
    const modal = ModalManager.create({
        title: title,
        body: formHtml,
        footer: footerHtml,
        id: `edit-${type}-modal`,
        size: 'lg'
    });
    
    // Show the modal - returns the updated modal element
    const shownModal = ModalManager.show(modal);
    
    // Get the save button
    const saveBtn = shownModal.querySelector('#saveBtn');
    const cancelBtn = shownModal.querySelector('#cancelBtn');
    
    // Make sure cancel button closes the modal
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            ModalManager.hide(shownModal);
        });
    }
    
    // Handle form submission
    if (saveBtn) {
        saveBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            try {
                const form = document.getElementById('editForm');
                
                // For message type, handle the reply functionality
                if (type === 'message') {
                    const reply = form.querySelector('#reply').value.trim();
                    if (reply) {
                        // Here you would normally send the reply via email
                        // For now, just show a success message
                        showSuccess(`Reply sent to ${data.name} at ${data.email}`);
                        ModalManager.hide(shownModal);
                        return;
                    }
                }
                
                // Product edit needs special handling for file uploads
                if (type === 'product') {
                    try {
                        const formData = new FormData(form);
                        
                        // Show loading indicator
                        saveBtn.innerHTML = '<ion-icon name="refresh-outline" class="spin"></ion-icon> Saving...';
                        saveBtn.disabled = true;
                        
                        // Debug what's being sent
                        console.log('Product ID:', data.id);
                        console.log('Form fields:');
                        for (let [key, value] of formData.entries()) {
                            console.log(key, ':', typeof value === 'object' ? 'File/Object' : value);
                        }
                        
                        // Call the API with the form data
                        await AdminAPI.Products.update(data.id, formData);
                        
                        showSuccess('Product updated successfully');
                        ModalManager.hide(shownModal);
                        loadProducts(); // Reload products
                    } catch (productError) {
                        console.error('Error updating product:', productError);
                        
                        // Reset button state
                        saveBtn.innerHTML = 'Save Changes';
                        saveBtn.disabled = false;
                        
                        // Show more detailed error
                        let errorMsg = 'Failed to update product';
                        if (productError.message) {
                            errorMsg += `: ${productError.message}`;
                        }
                        showError(errorMsg);
                    }
                    return;
                }
                
                // For other types, create regular object with form data
                try {
                    const formData = new FormData(form);
                    const updatedData = {};
                    
                    formData.forEach((value, key) => {
                        updatedData[key] = value;
                    });
                    
                    // Show loading indicator
                    saveBtn.innerHTML = '<ion-icon name="refresh-outline" class="spin"></ion-icon> Saving...';
                    saveBtn.disabled = true;
                    
                    // Make the appropriate API call
                    let apiCall;
                    
                    switch (type) {
                        case 'customer':
                            apiCall = AdminAPI.Customers.update(data.id, updatedData);
                            break;
                        case 'volunteer':
                            apiCall = AdminAPI.Volunteers.update(data.id, updatedData);
                            break;
                        case 'supplier':
                            apiCall = AdminAPI.Suppliers.update(data.id, updatedData);
                            break;
                        default:
                            throw new Error(`Unsupported type: ${type}`);
                    }
                    
                    await apiCall;
                    
                    // Show success message and refresh the data
                    showSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`);
                    ModalManager.hide(shownModal);
                    
                    // Reload the appropriate section
                    switch (type) {
                        case 'customer':
                            loadCustomers();
                            break;
                        case 'volunteer':
                            loadVolunteers();
                            break;
                        case 'supplier':
                            loadSuppliers();
                            break;
                    }
                } catch (error) {
                    console.error(`Error updating ${type}:`, error);
                    
                    // Reset button state
                    saveBtn.innerHTML = 'Save Changes';
                    saveBtn.disabled = false;
                    
                    // Show more detailed error
                    let errorMsg = `Failed to update ${type}`;
                    if (error.message) {
                        errorMsg += `: ${error.message}`;
                    }
                    showError(errorMsg);
                }
            } catch (error) {
                console.error(`Error in form submission:`, error);
                showError(`An unexpected error occurred: ${error.message}`);
            }
        });
    }
}

// Helper function to resolve image paths
function resolveImagePath(imagePath) {
    if (!imagePath) {
        return '../images/placeholder.jpg';
    }
    
    // If it starts with 'images/' add the parent directory prefix
    if (imagePath.startsWith('images/')) {
        return `../${imagePath}`;
    }
    
    // If it starts with '@uploads/' add the parent directory prefix
    if (imagePath.startsWith('@uploads/')) {
        return `../backend.pulsee/backend.pulse/${imagePath}`;
    }
    
    // If it's a full URL, use it as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    
    // Otherwise assume it's already a proper relative path
    return imagePath;
}

// Function to enhance form fields with icons
function enhanceFormFields() {
    // Icon mappings for different input types
    const inputMappings = [
        { selector: 'input[name*="name"], input[id*="name"], input[placeholder*="Name"], input[name*="first"], input[name*="last"], input[id*="first"], input[id*="last"]', icon: 'person-outline' },
        { selector: 'input[type="email"], input[name*="email"], input[id*="email"], input[placeholder*="Email"]', icon: 'mail-outline' },
        { selector: 'input[name*="phone"], input[id*="phone"], input[placeholder*="Phone"]', icon: 'call-outline' },
        { selector: 'input[name*="address"], input[id*="address"], input[name*="location"], input[id*="location"]', icon: 'location-outline' },
        { selector: 'input[name*="password"], input[id*="password"], input[type="password"]', icon: 'lock-closed-outline' },
        { selector: 'input[name*="date"], input[id*="date"], input[type="date"]', icon: 'calendar-outline' },
        { selector: 'input[name*="time"], input[id*="time"], input[type="time"]', icon: 'time-outline' },
        { selector: 'input[name*="search"], input[id*="search"], input[type="search"]', icon: 'search-outline' },
        { selector: 'input[name*="price"], input[id*="price"], input[name*="cost"], input[name*="amount"]', icon: 'cash-outline' },
        { selector: 'input[list]', icon: 'chevron-down-outline' }, // Remove 'select,' from this line
        { selector: 'textarea', icon: 'create-outline' }
    ];

    // Process each mapping
    inputMappings.forEach(mapping => {
        // Find all inputs matching the selector
        document.querySelectorAll(mapping.selector).forEach(input => {
            // Skip if already enhanced
            if (input.classList.contains('icon-enhanced') || input.parentElement.classList.contains('input-with-icon')) {
                return;
            }

            // Flag as enhanced
            input.classList.add('icon-enhanced');
            
            // Check if the input is already in a wrapper
            const wrapper = input.parentElement.classList.contains('form-group') ? 
                input.parentElement : 
                document.createElement('div');
            
            if (!input.parentElement.classList.contains('form-group')) {
                // Create a wrapper if needed
                wrapper.className = 'input-with-icon form-group';
                input.parentNode.insertBefore(wrapper, input);
                wrapper.appendChild(input);
            } else {
                input.parentElement.classList.add('input-with-icon');
            }
            
            // Add icon
            const icon = document.createElement('ion-icon');
            icon.setAttribute('name', mapping.icon);
            icon.className = 'input-icon';
            input.parentNode.appendChild(icon);
            
            // Ensure input has form-control class
            input.classList.add('form-control');
            
            // Add padding to accommodate the icon
            if (!input.style.paddingLeft) {
                input.style.paddingLeft = '40px';
            }
        });
    });
    
    // Handle select elements separately
    document.querySelectorAll('select').forEach(select => {
        // Skip if already enhanced
        if (select.classList.contains('icon-enhanced')) {
            return;
        }
        
        // Add form-control class but don't add icons (arrows are handled via CSS)
        select.classList.add('form-control');
        select.classList.add('icon-enhanced');
        
        // Just add the input-with-icon class to the parent if it's a form-group
        if (select.parentElement.classList.contains('form-group')) {
            select.parentElement.classList.add('select-input');
        }
    });
}

// Add event listener to enhance form fields when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initial enhancement
    enhanceFormFields();
    
    // Enhance form fields when modals are shown
    document.addEventListener('shown.bs.modal', function() {
        enhanceFormFields();
    });
    
    // Also handle dynamic content loading - enhance on any modal open
    document.addEventListener('click', function(e) {
        if (e.target.closest('[data-toggle="modal"]') || e.target.closest('.edit-btn') || e.target.closest('.view-btn')) {
            // Small delay to ensure DOM is updated
            setTimeout(enhanceFormFields, 300);
        }
    });
});

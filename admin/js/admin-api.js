/**
 * Admin Dashboard API Client
 * This file handles communication between the admin frontend and backend API
 */

// Base API URL
const API_URL = '/api/admin';

// Authentication functions
const AdminAuth = {
  /**
   * Login to admin dashboard
   * @param {string} email - Admin email
   * @param {string} password - Admin password
   * @returns {Promise} - Promise with login result
   */
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Store token in localStorage
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data.admin));
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  /**
   * Logout from admin dashboard
   */
  logout: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '../index.html';
  },
  
  /**
   * Check if user is logged in
   * @returns {boolean} - True if logged in
   */
  isLoggedIn: () => {
    return !!localStorage.getItem('adminToken');
  },
  
  /**
   * Get current admin user
   * @returns {Object|null} - Admin user object or null
   */
  getCurrentAdmin: () => {
    const adminUser = localStorage.getItem('adminUser');
    return adminUser ? JSON.parse(adminUser) : null;
  },
  
  /**
   * Get authentication headers for API requests
   * @returns {Object} - Headers object with Authorization
   */
  getAuthHeaders: () => {
    const token = localStorage.getItem('adminToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }
};

// Dashboard Data API
const DashboardAPI = {
  /**
   * Get dashboard statistics
   * @returns {Promise} - Promise with dashboard stats
   */
  getStats: async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard/stats`, {
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },
  
  /**
   * Get best selling products
   * @returns {Promise} - Promise with best sellers data
   */
  getBestSellers: async () => {
    try {
      // Use the actual endpoint from the admin router
      const response = await fetch(`${API_URL}/dashboard/best-sellers`, {
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch best sellers data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching best sellers:', error);
      throw error; // Re-throw to handle in UI layer
    }
  },
  
  /**
   * Get recent orders
   * @returns {Promise} - Promise with recent orders
   */
  getRecentOrders: async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard/recent-orders`, {
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recent orders');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      throw error;
    }
  },
  
  /**
   * Get recent customers
   * @returns {Promise} - Promise with recent customers
   */
  getRecentCustomers: async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard/recent-customers`, {
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recent customers');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching recent customers:', error);
      throw error;
    }
  },

  /**
   * Get sales overview data
   * @param {string} period - Time period (7, 30, 90 days)
   * @returns {Promise} - Promise with sales overview data for chart
   */
  getSalesOverview: async (period = '30') => {
    try {
      console.log(`Fetching sales overview data for period: ${period} days`);
      console.log(`API URL: ${API_URL}/analytics/revenue-analysis?period=${period}`);
      
      // Get auth headers for debugging
      const headers = AdminAuth.getAuthHeaders();
      console.log('Auth headers present:', !!headers.Authorization);
      
      const response = await fetch(`${API_URL}/analytics/revenue-analysis?period=${period}`, {
        headers: headers
      });

      console.log(`Response status: ${response.status}`);
      console.log(`Response headers:`, Object.fromEntries([...response.headers.entries()]));

      if (!response.ok) {
        console.error(`Error response from server: ${response.status} ${response.statusText}`);
        throw new Error('Failed to fetch sales overview data');
      }
      
      // Set proper Content-Type to avoid parsing issues
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Server response missing proper Content-Type header');
      }
      
      // Get raw text for better error handling
      const responseText = await response.text();
      console.log('Raw response text:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
      
      let data;
      
      try {
        data = JSON.parse(responseText);
        console.log('Parsed data structure:', Object.keys(data));
        console.log('Has daily_revenue:', !!data.daily_revenue);
        console.log('daily_revenue type:', Array.isArray(data.daily_revenue) ? 'array' : typeof data.daily_revenue);
        console.log('daily_revenue length:', data.daily_revenue ? data.daily_revenue.length : 0);
        
        if (data.daily_revenue && data.daily_revenue.length === 0) {
          console.log('No data found in the database for this period - check database for valid sales data');
        }
      } catch (jsonError) {
        console.error('JSON parse error in getSalesOverview:', jsonError);
        console.error('Raw response was:', responseText);
        throw new Error('Invalid JSON in sales overview response');
      }
      
      // Verify the data structure we need
      if (!data || !data.daily_revenue || !Array.isArray(data.daily_revenue)) {
        console.error('Missing expected data structure in revenue-analysis response', data);
        throw new Error('Invalid data structure in sales overview response');
      }
      
      // Only use real data if we actually have entries
      if (data.daily_revenue.length === 0) {
        console.warn('Empty daily_revenue array - will use fallback data instead');
        throw new Error('No sales data available for the selected period');
      }
      
      // Transform the API response to match our chart format
      console.log('Using real data from database!');
      return {
        dates: data.daily_revenue.map(item => new Date(item.date).toLocaleDateString()),
        sales: data.daily_revenue.map(item => parseFloat(item.revenue) || 0),
        totalRevenue: data.daily_revenue.reduce((sum, item) => sum + (parseFloat(item.revenue) || 0), 0),
        periodLabel: `Last ${period} days`
      };
    } catch (error) {
      console.error('Error fetching sales overview data:', error);
      
      // Return fallback data to keep UI working, but with clear indication it's fallback
      const fallbackDates = [];
      const fallbackSales = [];
      
      // Generate last 7 days as fallback
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        fallbackDates.push(date.toLocaleDateString());
        // Random sales between 500-2500
        fallbackSales.push(Math.floor(Math.random() * 2000) + 500);
      }
      
      return {
        dates: fallbackDates,
        sales: fallbackSales,
        totalRevenue: fallbackSales.reduce((sum, val) => sum + val, 0),
        periodLabel: 'Last 7 days (fallback data)',
        isFallback: true,
        error: error.message
      };
    }
  },

  /**
   * Get top products data
   * @returns {Promise} - Promise with top products data
   */
  getTopProducts: async () => {
    try {
      const response = await fetch(`${API_URL}/analytics/top-products`, {
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch top products data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching top products data:', error);
      throw error;
    }
  },

  /**
   * Get revenue analysis data
   * @param {string} period - Time period (7, 30, 90, 365 days)
   * @returns {Promise} - Promise with revenue analysis data
   */
  getRevenueAnalysis: async (period = '90') => {
    try {
      const response = await fetch(`${API_URL}/analytics/revenue-analysis?period=${period}`, {
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch revenue analysis data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching revenue analysis data:', error);
      throw error;
    }
  },

  /**
   * Get customer demographics data
   * @returns {Promise} - Promise with customer demographics data
   */
  getCustomerDemographics: async () => {
    try {
      const response = await fetch(`${API_URL}/analytics/customer-demographics`, {
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch customer demographics data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching customer demographics data:', error);
      throw error;
    }
  },

  /**
   * Get sales by category data
   * @returns {Promise} - Promise with sales by category data
   */
  getSalesByCategory: async () => {
    try {
      const response = await fetch(`${API_URL}/analytics/category-performance`, {
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sales by category data');
      }
      
      // Transform the API response to match our chart format
      const data = await response.json();
      
      // Format the category performance data for the chart
      return data.category_performance.map(item => ({
        category: item.category,
        revenue: parseFloat(item.revenue)
      }));
    } catch (error) {
      console.error('Error fetching sales by category data:', error);
      
      // Return fallback data to keep UI working
      return [
        { category: 'Upper Limb', revenue: 420000 },
        { category: 'Lower Limb', revenue: 300000 },
        { category: 'Accessories', revenue: 180000 },
        { category: 'Used Items', revenue: 240000 }
      ];
    }
  },

  /**
   * Get order status distribution data
   * @returns {Promise} - Promise with order status distribution data
   */
  getOrderStatusDistribution: async () => {
    try {
      const response = await fetch(`${API_URL}/analytics/order-status-analysis`, {
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order status distribution data');
      }
      
      return await response.json().then(data => data.status_distribution);
    } catch (error) {
      console.error('Error fetching order status distribution data:', error);
      throw error;
    }
  },

  /**
   * Get order details including items
   * @param {number} orderId - The order ID
   * @returns {Promise} - Promise with order details
   */
  getOrderDetails: async (orderId) => {
    try {
      return await OrdersAPI.getById(orderId);
    } catch (error) {
      console.error('Error fetching order details:', error);
      throw error;
    }
  }
};

// Analytics API
const AnalyticsAPI = {
  /**
   * Get sales data for charts
   * @param {string} period - Time period (7, 30, 90 days)
   * @returns {Promise} - Promise with sales data
   */
  getSalesData: async (period = '30') => {
    try {
      const response = await fetch(`${API_URL}/analytics/sales-data?period=${period}`, {
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sales data');
      }
      
      const responseText = await response.text();
      try {
        return JSON.parse(responseText);
      } catch (jsonError) {
        console.error('Error parsing JSON from sales-data response:', jsonError);
        console.error('Raw response was:', responseText);
        throw new Error('Invalid JSON in sales data response');
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
      throw error;
    }
  },
  
  /**
   * Get product category data
   * @returns {Promise} - Promise with category data
   */
  getCategoryData: async () => {
    try {
      const response = await fetch(`${API_URL}/analytics/categories`, {
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch category data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching category data:', error);
      throw error;
    }
  },
  
  /**
   * Get order status distribution
   * @returns {Promise} - Promise with order status data
   */
  getOrderStatusData: async () => {
    try {
      const response = await fetch(`${API_URL}/analytics/order-status`, {
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order status data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching order status data:', error);
      throw error;
    }
  },

  /**
   * Get sales performance metrics
   * @returns {Promise} - Promise with sales performance data
   */
  getSalesPerformance: async () => {
    try {
      const response = await fetch(`${API_URL}/analytics/sales-performance`, {
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sales performance data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching sales performance data:', error);
      throw error;
    }
  },

  /**
   * Get product performance metrics
   * @returns {Promise} - Promise with product performance data
   */
  getProductPerformance: async () => {
    try {
      const response = await fetch(`${API_URL}/analytics/product-performance`, {
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product performance data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching product performance data:', error);
      throw error;
    }
  },

  /**
   * Get revenue insights data
   * @returns {Promise} - Promise with revenue insights data
   */
  getRevenueInsights: async () => {
    try {
      const response = await fetch(`${API_URL}/analytics/revenue-insights`, {
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch revenue insights data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching revenue insights data:', error);
      throw error;
    }
  },

  /**
   * Get customer insights data
   * @returns {Promise} - Promise with customer insights data
   */
  getCustomerInsights: async () => {
    try {
      const response = await fetch(`${API_URL}/analytics/customer-insights`, {
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch customer insights data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching customer insights data:', error);
      throw error;
    }
  },

  /**
   * Get category performance data
   * @returns {Promise} - Promise with category performance data
   */
  getCategoryPerformance: async () => {
    try {
      const response = await fetch(`${API_URL}/analytics/category-performance`, {
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch category performance data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching category performance data:', error);
      throw error;
    }
  }
};

// Customer management API
const CustomersAPI = {
  /**
   * Get all customers
   * @returns {Promise} - Promise with customers data
   */
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/customers`, {
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  },
  
  /**
   * Get customer by ID
   * @param {number} id - Customer ID
   * @returns {Promise} - Promise with customer data
   */
  getById: async (id) => {
    try {
      const response = await fetch(`${API_URL}/customers/${id}`, {
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch customer');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  },
  
  /**
   * Update customer
   * @param {number} id - Customer ID
   * @param {Object} data - Customer data to update
   * @returns {Promise} - Promise with update result
   */
  update: async (id, data) => {
    try {
      const response = await fetch(`${API_URL}/customers/${id}`, {
        method: 'PUT',
        headers: AdminAuth.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to update customer');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  },
  
  /**
   * Delete customer
   * @param {number} id - Customer ID
   * @returns {Promise} - Promise with delete result
   */
  delete: async (id) => {
    try {
      const response = await fetch(`${API_URL}/customers/${id}`, {
        method: 'DELETE',
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete customer');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }
};

// Messages API
const MessagesAPI = {
  /**
   * Get all messages
   * @returns {Promise} - Promise with messages data
   */
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/messages`, {
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },
  
  /**
   * Get message by ID
   * @param {number} id - Message ID
   * @returns {Promise} - Promise with message data
   */
  getById: async (id) => {
    try {
      const response = await fetch(`${API_URL}/messages/${id}`, {
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch message');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching message:', error);
      throw error;
    }
  },
  
  /**
   * Delete message
   * @param {number} id - Message ID
   * @returns {Promise} - Promise with delete result
   */
  delete: async (id) => {
    try {
      const response = await fetch(`${API_URL}/messages/${id}`, {
        method: 'DELETE',
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }
};

// Volunteers API
const VolunteersAPI = {
  /**
   * Get all volunteers
   * @returns {Promise} - Promise with volunteers data
   */
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/volunteers`, {
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch volunteers');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching volunteers:', error);
      throw error;
    }
  },
  
  /**
   * Get volunteer by ID
   * @param {number} id - Volunteer ID
   * @returns {Promise} - Promise with volunteer data
   */
  getById: async (id) => {
    try {
      const response = await fetch(`${API_URL}/volunteers/${id}`, {
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch volunteer');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching volunteer:', error);
      throw error;
    }
  },
  
  /**
   * Update volunteer
   * @param {number} id - Volunteer ID
   * @param {Object} data - Volunteer data to update
   * @returns {Promise} - Promise with update result
   */
  update: async (id, data) => {
    try {
      const response = await fetch(`${API_URL}/volunteers/${id}`, {
        method: 'PUT',
        headers: AdminAuth.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to update volunteer');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating volunteer:', error);
      throw error;
    }
  },
  
  /**
   * Delete volunteer
   * @param {number} id - Volunteer ID
   * @returns {Promise} - Promise with delete result
   */
  delete: async (id) => {
    try {
      const response = await fetch(`${API_URL}/volunteers/${id}`, {
        method: 'DELETE',
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete volunteer');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting volunteer:', error);
      throw error;
    }
  }
};

// Suppliers API
const SuppliersAPI = {
  /**
   * Get all suppliers
   * @returns {Promise} - Promise with suppliers data
   */
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/suppliers`, {
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch suppliers');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      throw error;
    }
  },
  
  /**
   * Get supplier by ID
   * @param {number} id - Supplier ID
   * @returns {Promise} - Promise with supplier data
   */
  getById: async (id) => {
    try {
      const response = await fetch(`${API_URL}/suppliers/${id}`, {
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch supplier');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching supplier:', error);
      throw error;
    }
  },
  
  /**
   * Update supplier
   * @param {number} id - Supplier ID
   * @param {Object} data - Supplier data to update
   * @returns {Promise} - Promise with update result
   */
  update: async (id, data) => {
    try {
      const response = await fetch(`${API_URL}/suppliers/${id}`, {
        method: 'PUT',
        headers: AdminAuth.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to update supplier');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  },
  
  /**
   * Delete supplier
   * @param {number} id - Supplier ID
   * @returns {Promise} - Promise with delete result
   */
  delete: async (id) => {
    try {
      const response = await fetch(`${API_URL}/suppliers/${id}`, {
        method: 'DELETE',
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete supplier');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  }
};

// Products API
const ProductsAPI = {
  /**
   * Get all products
   * @returns {Promise} - Promise with products data
   */
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/products`, {
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },
  
  /**
   * Get product by ID
   * @param {number} id - Product ID
   * @returns {Promise} - Promise with product data
   */
  getById: async (id) => {
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },
  
  /**
   * Create new product
   * @param {FormData} formData - Product form data including image
   * @returns {Promise} - Promise with create result
   */
  create: async (formData) => {
    try {
      console.log('ProductsAPI.create called');
      console.log('Form data contents:');
      
      // Debug form data contents
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value instanceof File ? 
          `File: ${value.name} (${value.size} bytes, ${value.type})` : 
          value}`);
      }
      
      // For FormData, don't set Content-Type header, it will be set automatically
      const token = localStorage.getItem('adminToken');
      const headers = {
        'Authorization': `Bearer ${token}`
      };
      
      console.log('Making API call to:', `${API_URL}/products`);
      console.log('Headers:', headers);
      
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: headers,
        body: formData
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from API:', errorText);
        throw new Error('Failed to create product');
      }
      
      const responseData = await response.json();
      console.log('Product creation successful:', responseData);
      return responseData;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },
  
  /**
   * Update product
   * @param {number} id - Product ID
   * @param {FormData} formData - Product form data
   * @returns {Promise} - Promise with update result
   */
  update: async (id, formData) => {
    try {
      // For FormData, don't set Content-Type header, it will be set automatically
      const token = localStorage.getItem('adminToken');
      const headers = {
        'Authorization': `Bearer ${token}`
      };
      
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        headers: headers,
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },
  
  /**
   * Delete product
   * @param {number} id - Product ID
   * @returns {Promise} - Promise with delete result
   */
  delete: async (id) => {
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }
};

// Orders API
const OrdersAPI = {
  /**
   * Get all orders
   * @returns {Promise} - Promise with orders data
   */
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/orders`, {
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },
  
  /**
   * Get order by ID with items
   * @param {number} id - Order ID
   * @returns {Promise} - Promise with order data
   */
  getById: async (id) => {
    try {
      const response = await fetch(`${API_URL}/orders/${id}`, {
        headers: AdminAuth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  },
  
  /**
   * Update order status
   * @param {number} id - Order ID
   * @param {string} status - New status
   * @returns {Promise} - Promise with update result
   */
  updateStatus: async (id, status) => {
    try {
      const response = await fetch(`${API_URL}/orders/${id}/status`, {
        method: 'PUT',
        headers: AdminAuth.getAuthHeaders(),
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }
};

// Main Admin API object
const AdminAPI = {
  Auth: AdminAuth,
  Customers: CustomersAPI,
  Products: ProductsAPI,
  Orders: OrdersAPI,
  Messages: MessagesAPI,
  Volunteers: VolunteersAPI, 
  Suppliers: SuppliersAPI,
  Analytics: AnalyticsAPI,
  Dashboard: DashboardAPI
};

// Make AdminAPI available globally
window.AdminAPI = AdminAPI;

// Add debug logging
console.log('admin-api.js loaded successfully');
console.log('AdminAPI is now available globally');
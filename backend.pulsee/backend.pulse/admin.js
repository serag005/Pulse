/**
 * Admin routes module for PULSE e-commerce platform
 * Provides API endpoints for the admin dashboard functionality
 */
console.log('===== [ADMIN API] Server module loaded with enhanced debugging at', new Date().toISOString(), '=====');
console.log('===== [ADMIN API] Version: 1.1.0 Enhanced Product Creation =====');

const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcrypt');

// Set up storage for multer (for product image uploads)
const uploadDir = path.join(__dirname, '..', '..', 'images');
console.log(`Upload directory: ${uploadDir}`);
console.log(`Upload directory absolute path: ${path.resolve(uploadDir)}`);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Created upload directory: ${uploadDir}`);
    }

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
        // Generate a unique filename based on the current timestamp and original filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExt = path.extname(file.originalname);
        cb(null, 'product-' + uniqueSuffix + fileExt);
  }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
}).single('image');

// JWT Secret
const JWT_SECRET = 'your_hardcoded_secret_here';

// Create MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '4420041234@a',
  database: 'prosthetics',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Debug middleware - add this before all routes
router.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  // Intercept res.json to log what's being sent
  const originalJson = res.json;
  res.json = function(body) {
    console.log(`Response for ${req.url}:`, body);
    return originalJson.call(this, body);
  };
  
  next();
});

// Authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.adminToken;
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user is an admin
    if (!decoded.isAdmin) {
      return res.status(403).json({ message: 'Access forbidden - Admin access required' });
    }
    
    // Set admin info in request
    req.admin = {
      id: decoded.id,
      email: decoded.email,
      firstName: 'Admin',
      lastName: 'User'
    };
    
    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// DASHBOARD ENDPOINTS

/**
 * Get dashboard statistics
 */
router.get('/dashboard/stats', authenticateAdmin, async (req, res) => {
  try {
    // Get total revenue
    const [revenueResult] = await pool.query(`
      SELECT SUM(total_amount) as total_revenue FROM orders
    `);
    
    // Get total orders
    const [ordersResult] = await pool.query(`
      SELECT COUNT(*) as total_orders FROM orders
    `);
    
    // Get active customers (customers with at least one order)
    const [customersResult] = await pool.query(`
      SELECT COUNT(DISTINCT user_id) as active_customers FROM orders
    `);
    
    // Get average order value
    const [avgOrderResult] = await pool.query(`
      SELECT AVG(total_amount) as avg_order_value FROM orders
    `);
    
    // Calculate trends (example: comparing to previous period)
    // For a real implementation, you would compare current vs previous periods
    
    const stats = {
      total_revenue: revenueResult[0].total_revenue || 0,
      total_orders: ordersResult[0].total_orders || 0,
      active_customers: customersResult[0].active_customers || 0,
      avg_order_value: avgOrderResult[0].avg_order_value || 0,
      trends: {
        revenue: 15.3, // Example values
        orders: 8.3,
        customers: 5.2,
        avg_order: -2.1
      }
    };
    
    console.log('Dashboard stats data:', stats); // Debug log
    
    res.setHeader('Content-Type', 'application/json');
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
});

/**
 * Get recent orders for dashboard
 */
router.get('/dashboard/recent-orders', authenticateAdmin, async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT 
        o.id as order_id,
        o.order_date,
        o.total_amount,
        o.status,
        o.user_id,
        r.firstName,
        r.lastName,
        r.email,
        r.phone,
        r.address
      FROM orders o
      JOIN registrations r ON o.user_id = r.id
      ORDER BY o.order_date DESC
    `);
    
    // Now get all order items with product details for all orders
    const orderIds = orders.map(order => order.order_id);
    
    if (orderIds.length === 0) {
      return res.json(orders);
    }
    
    const [allOrderItems] = await pool.query(`
      SELECT oi.*, p.name as product_name, p.image, p.price
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id IN (?)
    `, [orderIds]);
    
    // Group items by order_id
    const itemsByOrderId = {};
    allOrderItems.forEach(item => {
      if (!itemsByOrderId[item.order_id]) {
        itemsByOrderId[item.order_id] = [];
      }
      itemsByOrderId[item.order_id].push(item);
    });
    
    // Add items to each order
    orders.forEach(order => {
      order.items = itemsByOrderId[order.order_id] || [];
    });
    
    console.log('Recent orders data with items:', orders); // Debug log
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    res.status(500).json({ message: 'Error fetching recent orders' });
  }
});

/**
 * Get recent customers for dashboard
 */
router.get('/dashboard/recent-customers', authenticateAdmin, async (req, res) => {
  try {
    const limit = req.query.limit || 5;
    
    const [customers] = await pool.query(`
      SELECT 
        r.id as user_id,
        r.firstName,
        r.lastName,
        r.email,
        r.profilePicture,
        r.address,
        o.id as order_id,
        o.order_date as last_order_date
      FROM registrations r
      JOIN orders o ON r.id = o.user_id
      WHERE o.id = (
        SELECT id 
        FROM orders 
        WHERE user_id = r.id 
        ORDER BY order_date DESC 
        LIMIT 1
      )
      ORDER BY o.order_date DESC
      LIMIT ?
    `, [parseInt(limit)]);
    
    console.log('Recent customers data:', customers); // Debug log
    
    res.json(customers);
  } catch (error) {
    console.error('Error fetching recent customers:', error);
    res.status(500).json({ message: 'Error fetching recent customers' });
  }
});

/**
 * Get basic best selling products for dashboard (simplified)
 */
router.get('/dashboard/best-sellers-simple', (req, res) => {
  try {
    console.log('Best sellers simple endpoint called');
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Set proper content type
    res.setHeader('Content-Type', 'application/json');
    
    // Hard-coded sample data as a last resort
    const sampleData = [
      {
        id: 1,
        name: "System Electric Hand DMC (Aluminum)",
        price: 800.00,
        image: "images/Image 1.jpg",
        units_sold: 28,
        revenue: 22400.00
      },
      {
        id: 3,
        name: "Polycentric Knee Joint for Knee Disarticulation (Titanium)",
        price: 250.00,
        image: "images/Image 3.jpg",
        units_sold: 23,
        revenue: 5750.00
      },
      {
        id: 7,
        name: "Runway foot (carbon fiber)",
        price: 450.00,
        image: "images/Image 7.jpg",
        units_sold: 19,
        revenue: 8550.00
      }
    ];
    
    console.log('Sending sample data:', sampleData);
    
    // Return the data
    return res.json(sampleData);
  } catch (error) {
    console.error('Error in simplified best sellers endpoint:', error);
    
    // Even on error, still return valid JSON
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      success: false, 
      message: "Error in best sellers endpoint", 
      error: error.message 
    });
  }
});

/**
 * Get best selling products
 */
router.get('/dashboard/best-sellers', authenticateAdmin, async (req, res) => {
  try {
    const [bestSellers] = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.price,
        p.image,
        SUM(oi.quantity) AS units_sold,
        SUM(oi.quantity * oi.price) AS revenue,
        ROUND((SUM(oi.quantity) / (SELECT SUM(quantity) FROM order_items)) * 100, 1) AS growth
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      GROUP BY p.id, p.name, p.price, p.image
      ORDER BY units_sold DESC
      LIMIT 10
    `);
    
    console.log('Best sellers data:', bestSellers); // Debug log
    
    // Set proper content type
    res.setHeader('Content-Type', 'application/json');
    res.json(bestSellers);
  } catch (error) {
    console.error('Error fetching best sellers:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ message: 'Error fetching best selling products' });
  }
});

// ANALYTICS ENDPOINTS

/**
 * Get sales data for charts
 */
router.get('/analytics/sales-data', authenticateAdmin, async (req, res) => {
  try {
    const period = req.query.period || '30'; // Default to 30 days
    const days = parseInt(period);

    // Get daily sales for the specified period
    const [results] = await pool.query(`
      SELECT 
        DATE(o.order_date) as date,
        SUM(o.total_amount) as total,
        COUNT(*) as count
      FROM orders o
      WHERE o.order_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(o.order_date)
      ORDER BY date ASC
    `, [days]);

    res.json(results);
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).json({ message: 'Error fetching sales data' });
  }
});

/**
 * Get best selling products
 */
router.get('/analytics/best-sellers', authenticateAdmin, async (req, res) => {
  try {
    const period = req.query.period || 'month'; // Default to month (week, month, year)
    
    let dateFilter = '';
    if (period === 'week') {
      dateFilter = 'AND o.order_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
    } else if (period === 'month') {
      dateFilter = 'AND o.order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
    } else if (period === 'year') {
      dateFilter = 'AND o.order_date >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)';
    }

    // Get top selling products
    const [results] = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.image,
        p.price,
        SUM(oi.quantity) as units_sold,
        SUM(oi.quantity * oi.price) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE 1=1 ${dateFilter}
      GROUP BY p.id, p.name, p.image, p.price
      ORDER BY units_sold DESC
      LIMIT 10
    `);

    res.json(results);
  } catch (error) {
    console.error('Error fetching best selling products:', error);
    res.status(500).json({ message: 'Error fetching best selling products' });
  }
});

/**
 * Get product sales by category
 */
router.get('/analytics/categories', authenticateAdmin, async (req, res) => {
  try {
    const [results] = await pool.query(`
      SELECT 
        p.Category as category,
        SUM(oi.quantity) as units_sold,
        SUM(oi.quantity * oi.price) as revenue
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      GROUP BY p.Category
      ORDER BY revenue DESC
    `);
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching category data:', error);
    res.status(500).json({ message: 'Error fetching category data' });
  }
});

/**
 * Get order status distribution
 */
router.get('/analytics/order-status', authenticateAdmin, async (req, res) => {
  try {
    const [results] = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM orders
      GROUP BY status
    `);
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching order status data:', error);
    res.status(500).json({ message: 'Error fetching order status data' });
  }
});

/**
 * Get top products data
 */
router.get('/analytics/top-products', authenticateAdmin, async (req, res) => {
  try {
    const period = req.query.period || '30'; // Default to 30 days
    
    const [results] = await pool.query(`
      SELECT 
        p.id, p.name, p.image, p.price, 
        SUM(oi.quantity) as units_sold,
        SUM(oi.quantity * oi.price) as revenue
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
      GROUP BY p.id
      ORDER BY units_sold DESC
      LIMIT 10
    `, [period]);
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching top products data:', error);
    res.status(500).json({ message: 'Error fetching top products data' });
  }
});

/**
 * Get sales performance metrics
 */
router.get('/analytics/sales-performance', authenticateAdmin, async (req, res) => {
  try {
    // Current month sales
    const [currentMonth] = await pool.query(`
      SELECT 
        SUM(total_amount) as current_month_sales
      FROM orders
      WHERE MONTH(order_date) = MONTH(CURRENT_DATE)
      AND YEAR(order_date) = YEAR(CURRENT_DATE)
    `);
    
    // Previous month sales
    const [previousMonth] = await pool.query(`
      SELECT 
        SUM(total_amount) as previous_month_sales
      FROM orders
      WHERE MONTH(order_date) = MONTH(DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH))
      AND YEAR(order_date) = YEAR(DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH))
    `);
    
    // Calculate growth percentage
    const currentMonthSales = currentMonth[0].current_month_sales || 0;
    const previousMonthSales = previousMonth[0].previous_month_sales || 0;
    
    let growthPercentage = 0;
    if (previousMonthSales > 0) {
      growthPercentage = ((currentMonthSales - previousMonthSales) / previousMonthSales) * 100;
    }
    
    // Daily sales for the last 14 days
    const [dailySales] = await pool.query(`
      SELECT 
        DATE(order_date) as date,
        SUM(total_amount) as total
      FROM orders
      WHERE order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 14 DAY)
      GROUP BY DATE(order_date)
      ORDER BY date
    `);
    
    res.json({
      current_month_sales: currentMonthSales,
      previous_month_sales: previousMonthSales,
      growth_percentage: growthPercentage,
      daily_sales: dailySales
    });
  } catch (error) {
    console.error('Error fetching sales performance data:', error);
    res.status(500).json({ message: 'Error fetching sales performance data' });
  }
});

/**
 * Get product performance metrics
 */
router.get('/analytics/product-performance', authenticateAdmin, async (req, res) => {
  try {
    // Top performing products
    const [topPerformers] = await pool.query(`
      SELECT 
        p.id, p.name, p.Category as category,
        SUM(oi.quantity) as units_sold,
        SUM(oi.quantity * oi.price) as revenue,
        COUNT(DISTINCT o.id) as order_count
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      GROUP BY p.id
      ORDER BY revenue DESC
      LIMIT 5
    `);
    
    // Underperforming products
    const [underperformers] = await pool.query(`
      SELECT 
        p.id, p.name, p.Category as category,
        SUM(oi.quantity) as units_sold,
        SUM(oi.quantity * oi.price) as revenue,
        COUNT(DISTINCT o.id) as order_count
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      GROUP BY p.id
      ORDER BY revenue ASC
      LIMIT 5
    `);
    
    res.json({
      top_performers: topPerformers,
      underperformers: underperformers
    });
  } catch (error) {
    console.error('Error fetching product performance data:', error);
    res.status(500).json({ message: 'Error fetching product performance data' });
  }
});

/**
 * Get revenue analysis data
 */
router.get('/analytics/revenue-analysis', authenticateAdmin, async (req, res) => {
  try {
    const period = req.query.period || '90'; // Default to 90 days if not specified
    const days = parseInt(period);
    
    console.log(`Revenue analysis request received for period: ${days} days`);
    
    // First, check if we have any orders at all to debug potential issues
    const [orderCount] = await pool.query(`SELECT COUNT(*) as count FROM orders`);
    console.log(`Total orders in database: ${orderCount[0].count}`);
    
    // Get date range of available orders data
    const [dateRange] = await pool.query(`
      SELECT 
        MIN(order_date) as earliest,
        MAX(order_date) as latest
      FROM orders
    `);
    console.log('Order date range in database:', dateRange[0].earliest, 'to', dateRange[0].latest);
    
    // Use a more flexible date range - if we don't have enough data for the requested
    // period, we'll just use all available data instead of returning nothing
    const [dailyRevenue] = await pool.query(`
      SELECT 
        DATE(o.order_date) as date,
        SUM(o.total_amount) as revenue
      FROM orders o
      WHERE o.order_date IS NOT NULL
      AND o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
      GROUP BY DATE(o.order_date)
      ORDER BY date ASC
      LIMIT 100
    `, [days]);
    
    console.log(`Daily revenue query returned ${dailyRevenue.length} records`);
    
    // Log a sample result to verify data format
    if (dailyRevenue.length > 0) {
      console.log('Sample data point:', dailyRevenue[0]);
    }

    // Ensure numeric values are properly formatted
    const formattedDailyRevenue = dailyRevenue.map(item => ({
      date: item.date,
      revenue: parseFloat(item.revenue) || 0
    }));
    
    console.log(`Formatted ${formattedDailyRevenue.length} data points for daily revenue`);

    // Get monthly revenue for the last 6 months or all time if limited data
    const [monthlyRevenue] = await pool.query(`
      SELECT 
        YEAR(o.order_date) as year,
        MONTH(o.order_date) as month,
        SUM(o.total_amount) as revenue
      FROM orders o
      WHERE o.order_date IS NOT NULL
      AND o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
      GROUP BY YEAR(o.order_date), MONTH(o.order_date)
      ORDER BY year ASC, month ASC
    `, [days]);

    // Format monthly revenue data
    const formattedMonthlyRevenue = monthlyRevenue.map(item => ({
      year: item.year,
      month: item.month,
      revenue: parseFloat(item.revenue) || 0
    }));

    // Get year-over-year data (or just yearly data if limited history)
    const [yearlyRevenue] = await pool.query(`
      SELECT 
        YEAR(o.order_date) as year,
        SUM(o.total_amount) as revenue
      FROM orders o
      WHERE o.order_date IS NOT NULL
      AND o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
      GROUP BY YEAR(o.order_date)
      ORDER BY year ASC
    `, [days]);
    
    // Format yearly data and calculate growth where possible
    const formattedYearlyComparison = [];
    for (let i = 0; i < yearlyRevenue.length; i++) {
      const yearData = {
        year: yearlyRevenue[i].year,
        revenue: parseFloat(yearlyRevenue[i].revenue) || 0,
        prev_year_revenue: i > 0 ? parseFloat(yearlyRevenue[i-1].revenue) || 0 : 0,
        growth_percentage: 0
      };
      
      // Calculate growth percentage if we have previous year data
      if (i > 0 && yearlyRevenue[i-1].revenue > 0) {
        yearData.growth_percentage = ((yearData.revenue - yearData.prev_year_revenue) / yearData.prev_year_revenue) * 100;
      }
      
      formattedYearlyComparison.push(yearData);
    }

    // Get revenue by product category
    const [categoryRevenue] = await pool.query(`
      SELECT 
        p.Category as category,
        SUM(oi.quantity * oi.price) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.order_date IS NOT NULL
      AND o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
      GROUP BY p.Category
      ORDER BY revenue DESC
    `, [days]);

    // Format category revenue data
    const formattedCategoryRevenue = categoryRevenue.map(item => ({
      category: item.category || 'Uncategorized',
      revenue: parseFloat(item.revenue) || 0
    }));

    // Calculate overall revenue total
    let totalRevenue = 0;
    if (formattedDailyRevenue.length > 0) {
      totalRevenue = formattedDailyRevenue.reduce((sum, item) => sum + item.revenue, 0);
    }

    // Determine if we have real data or not
    const hasData = formattedDailyRevenue.length > 0;
    
    // Log success info
    console.log(`Analytics data prepared successfully. Has data: ${hasData}, Total revenue: ${totalRevenue}`);

    // Set proper Content-Type header
    res.setHeader('Content-Type', 'application/json');
    
    // Return well-structured JSON data
    res.json({
      daily_revenue: formattedDailyRevenue,
      monthly_revenue: formattedMonthlyRevenue,
      yearly_comparison: formattedYearlyComparison,
      category_revenue: formattedCategoryRevenue,
      total_revenue: totalRevenue,
      has_data: hasData,
      period_days: days
    });
  } catch (error) {
    console.error('Error fetching revenue analysis data:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      message: 'Error fetching revenue analysis data',
      error: error.message 
    });
  }
});

/**
 * Get customer demographics data
 */
router.get('/analytics/customer-demographics', authenticateAdmin, async (req, res) => {
  try {
    // This endpoint would typically query customer age, gender, location, etc.
    // Since we may not have all that data, we'll create a simulated response based on available data
    
    // Get a count of customers by signup date (monthly cohorts)
    const [monthlyCohorts] = await pool.query(`
      SELECT 
        YEAR(created_at) as year,
        MONTH(created_at) as month,
        COUNT(*) as count
      FROM registrations
      GROUP BY YEAR(created_at), MONTH(created_at)
      ORDER BY year ASC, month ASC
    `);
    
    // Create simulated age distribution based on customer IDs
    // In a real application, you'd query actual age data
    const [customerCount] = await pool.query('SELECT COUNT(*) as count FROM registrations');
    const totalCustomers = customerCount[0].count;
    
    const ageDistribution = [
      { age_group: '18-24', count: Math.floor(totalCustomers * 0.15) },
      { age_group: '25-34', count: Math.floor(totalCustomers * 0.35) },
      { age_group: '35-44', count: Math.floor(totalCustomers * 0.25) },
      { age_group: '45-54', count: Math.floor(totalCustomers * 0.15) },
      { age_group: '55+', count: Math.floor(totalCustomers * 0.10) }
    ];
    
    // Create simulated gender distribution
    const genderDistribution = [
      { gender: 'Male', count: Math.floor(totalCustomers * 0.55) },
      { gender: 'Female', count: Math.floor(totalCustomers * 0.45) }
    ];
    
    // Get top customer locations (cities)
    // This assumes address contains city information
    const [locationDistribution] = await pool.query(`
      SELECT 
        SUBSTRING_INDEX(SUBSTRING_INDEX(address, ',', 2), ',', -1) as location,
        COUNT(*) as count
      FROM registrations
      WHERE address IS NOT NULL AND address != ''
      GROUP BY location
      ORDER BY count DESC
      LIMIT 5
    `);
    
    res.json({
      monthly_cohorts: monthlyCohorts,
      age_distribution: ageDistribution,
      gender_distribution: genderDistribution,
      location_distribution: locationDistribution || []
    });
  } catch (error) {
    console.error('Error fetching customer demographics data:', error);
    res.status(500).json({ message: 'Error fetching customer demographics data' });
  }
});

/**
 * Get revenue insights data
 */
router.get('/analytics/revenue-insights', authenticateAdmin, async (req, res) => {
  try {
    // Average revenue per customer
    const [avgRevenue] = await pool.query(`
      SELECT 
        AVG(total) as avg_revenue_per_customer
      FROM (
        SELECT 
          user_id,
          SUM(total_amount) as total
        FROM orders
        GROUP BY user_id
      ) as customer_totals
    `);
    
    // Revenue distribution by day of week
    const [dayOfWeekRevenue] = await pool.query(`
      SELECT 
        DAYNAME(order_date) as day_of_week,
        SUM(total_amount) as revenue,
        COUNT(*) as order_count
      FROM orders
      GROUP BY day_of_week
      ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
    `);
    
    // Revenue distribution by time of day
    const [timeOfDayRevenue] = await pool.query(`
      SELECT 
        CASE 
          WHEN HOUR(order_date) BETWEEN 0 AND 5 THEN 'Night (12AM-6AM)'
          WHEN HOUR(order_date) BETWEEN 6 AND 11 THEN 'Morning (6AM-12PM)'
          WHEN HOUR(order_date) BETWEEN 12 AND 17 THEN 'Afternoon (12PM-6PM)'
          ELSE 'Evening (6PM-12AM)'
        END as time_of_day,
        SUM(total_amount) as revenue,
        COUNT(*) as order_count
      FROM orders
      GROUP BY time_of_day
      ORDER BY FIELD(time_of_day, 'Morning (6AM-12PM)', 'Afternoon (12PM-6PM)', 'Evening (6PM-12AM)', 'Night (12AM-6AM)')
    `);
    
    res.json({
      avg_revenue_per_customer: avgRevenue[0].avg_revenue_per_customer || 0,
      day_of_week_revenue: dayOfWeekRevenue,
      time_of_day_revenue: timeOfDayRevenue
    });
  } catch (error) {
    console.error('Error fetching revenue insights data:', error);
    res.status(500).json({ message: 'Error fetching revenue insights data' });
  }
});

/**
 * Get customer insights data
 */
router.get('/analytics/customer-insights', authenticateAdmin, async (req, res) => {
  try {
    // Customer retention rate
    const [retention] = await pool.query(`
      SELECT 
        COUNT(DISTINCT user_id) as returning_customers
      FROM orders
      WHERE user_id IN (
        SELECT user_id
        FROM orders
        GROUP BY user_id
        HAVING COUNT(*) > 1
      )
    `);
    
    const [totalCustomers] = await pool.query(`
      SELECT 
        COUNT(DISTINCT user_id) as total_customers
      FROM orders
    `);
    
    const returnRate = totalCustomers[0].total_customers > 0 
      ? (retention[0].returning_customers / totalCustomers[0].total_customers) * 100 
      : 0;
    
    // Average orders per customer
    const [avgOrders] = await pool.query(`
      SELECT 
        AVG(order_count) as avg_orders_per_customer
      FROM (
        SELECT 
          user_id,
          COUNT(*) as order_count
        FROM orders
        GROUP BY user_id
      ) as customer_orders
    `);
    
    // Customer segments
    const [customerSegments] = await pool.query(`
      SELECT 
        CASE 
          WHEN total_spent >= 10000 THEN 'VIP'
          WHEN total_spent >= 5000 THEN 'High Value'
          WHEN total_spent >= 1000 THEN 'Medium Value'
          ELSE 'Low Value'
        END as segment,
        COUNT(*) as customer_count
      FROM (
        SELECT 
          user_id,
          SUM(total_amount) as total_spent
        FROM orders
        GROUP BY user_id
      ) as customer_spending
      GROUP BY segment
      ORDER BY FIELD(segment, 'VIP', 'High Value', 'Medium Value', 'Low Value')
    `);
    
    res.json({
      returning_customers: retention[0].returning_customers || 0,
      total_customers: totalCustomers[0].total_customers || 0,
      return_rate: returnRate,
      avg_orders_per_customer: avgOrders[0].avg_orders_per_customer || 0,
      customer_segments: customerSegments
    });
  } catch (error) {
    console.error('Error fetching customer insights data:', error);
    res.status(500).json({ message: 'Error fetching customer insights data' });
  }
});

/**
 * Get sales by category
 */
router.get('/analytics/sales-by-category', authenticateAdmin, async (req, res) => {
  try {
    const period = req.query.period || '90'; // Default to 90 days
    const days = parseInt(period);

    // Get sales by category
    const [categorySales] = await pool.query(`
      SELECT 
        p.Category as category,
        SUM(oi.quantity * oi.price) as revenue,
        COUNT(DISTINCT o.id) as order_count
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.order_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY p.Category
      ORDER BY revenue DESC
    `, [days]);

    // Get category growth (comparing to previous period)
    const [categoryGrowth] = await pool.query(`
      SELECT 
        current.category,
        current.revenue as current_revenue,
        previous.revenue as previous_revenue,
        ((current.revenue - previous.revenue) / previous.revenue) * 100 as growth_percentage
      FROM (
        SELECT 
          p.Category as category,
          SUM(oi.quantity * oi.price) as revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.order_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY p.Category
      ) current
      LEFT JOIN (
        SELECT 
          p.Category as category,
          SUM(oi.quantity * oi.price) as revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE 
          o.order_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND
          o.order_date < DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY p.Category
      ) previous ON current.category = previous.category
    `, [days, days*2, days]);

    res.json({
      category_sales: categorySales,
      category_growth: categoryGrowth
    });
  } catch (error) {
    console.error('Error fetching sales by category data:', error);
    res.status(500).json({ message: 'Error fetching sales by category data' });
  }
});

/**
 * Get order status analysis data
 */
router.get('/analytics/order-status-analysis', authenticateAdmin, async (req, res) => {
  try {
    // Current status distribution
    const [statusDistribution] = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(total_amount) as total_value
      FROM orders
      GROUP BY status
    `);
    
    // Status transition rates (simulated as we don't have status history)
    const statusTransitions = [];
    if (statusDistribution.length > 0) {
      const totalOrders = statusDistribution.reduce((sum, item) => sum + item.count, 0);
      
      statusDistribution.forEach(item => {
        statusTransitions.push({
          status: item.status,
          count: item.count,
          percentage: totalOrders > 0 ? (item.count / totalOrders) * 100 : 0
        });
      });
    }
    
    res.json({
      status_distribution: statusDistribution,
      status_transitions: statusTransitions
    });
  } catch (error) {
    console.error('Error fetching order status analysis data:', error);
    res.status(500).json({ message: 'Error fetching order status analysis data' });
  }
});

/**
 * Get sales by category data
 */
router.get('/analytics/category-performance', authenticateAdmin, async (req, res) => {
  try {
    // Get sales data grouped by product category
    const [categoryData] = await pool.query(`
      SELECT 
        p.Category as category,
        COUNT(DISTINCT p.id) as product_count,
        SUM(oi.quantity) as units_sold,
        SUM(oi.quantity * oi.price) as revenue,
        AVG(p.price) as avg_price,
        AVG(o.total_amount) as avg_order_value
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      GROUP BY p.Category
      ORDER BY revenue DESC
    `);
    
    // Format currency values as numbers
    const formattedData = categoryData.map(category => ({
      ...category,
      revenue: parseFloat(category.revenue) || 0,
      avg_price: parseFloat(category.avg_price) || 0,
      avg_order_value: parseFloat(category.avg_order_value) || 0
    }));

    // Return properly formatted JSON
    res.setHeader('Content-Type', 'application/json');
    res.json({
      category_performance: formattedData
    });
  } catch (error) {
    console.error('Error fetching category performance data:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ message: 'Error fetching category performance data' });
  }
});

// CUSTOMER MANAGEMENT ENDPOINTS

/**
 * Get all customers
 */
router.get('/customers', authenticateAdmin, async (req, res) => {
  try {
    const [results] = await pool.query(`
      SELECT * FROM registrations
      ORDER BY created_at DESC
    `);
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Error fetching customers' });
  }
});

/**
 * Get single customer
 */
router.get('/customers/:id', authenticateAdmin, async (req, res) => {
  try {
    const [results] = await pool.query(
      'SELECT * FROM registrations WHERE id = ?',
      [req.params.id]
    );
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json(results[0]);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ message: 'Error fetching customer details' });
  }
});

/**
 * Update customer
 */
router.put('/customers/:id', authenticateAdmin, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address, birthDate } = req.body;
    
    await pool.query(
      'UPDATE registrations SET firstName = ?, lastName = ?, email = ?, phone = ?, address = ?, birthDate = ? WHERE id = ?',
      [firstName, lastName, email, phone, address, birthDate, req.params.id]
    );
    
    res.json({ message: 'Customer updated successfully' });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ message: 'Error updating customer' });
  }
});

/**
 * Delete customer
 */
router.delete('/customers/:id', authenticateAdmin, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM registrations WHERE id = ?',
      [req.params.id]
    );
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ message: 'Error deleting customer' });
  }
});

// MESSAGE MANAGEMENT ENDPOINTS

/**
 * Get all messages
 */
router.get('/messages', authenticateAdmin, async (req, res) => {
  try {
    const [results] = await pool.query(`
      SELECT * FROM contact_messages
      ORDER BY created_at DESC
    `);
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

/**
 * Get single message
 */
router.get('/messages/:id', authenticateAdmin, async (req, res) => {
  try {
    const [results] = await pool.query(
      'SELECT * FROM contact_messages WHERE id = ?',
      [req.params.id]
    );
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.json(results[0]);
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({ message: 'Error fetching message details' });
  }
});

/**
 * Delete message
 */
router.delete('/messages/:id', authenticateAdmin, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM contact_messages WHERE id = ?',
      [req.params.id]
    );
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Error deleting message' });
  }
});

// VOLUNTEER MANAGEMENT ENDPOINTS

/**
 * Get all volunteers
 */
router.get('/volunteers', authenticateAdmin, async (req, res) => {
  try {
    const [results] = await pool.query(`
      SELECT * FROM volunteers
      ORDER BY id DESC
    `);
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching volunteers:', error);
    res.status(500).json({ message: 'Error fetching volunteers' });
  }
});

/**
 * Get single volunteer
 */
router.get('/volunteers/:id', authenticateAdmin, async (req, res) => {
  try {
    const [results] = await pool.query(
      'SELECT * FROM volunteers WHERE id = ?',
      [req.params.id]
    );
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }
    
    res.json(results[0]);
  } catch (error) {
    console.error('Error fetching volunteer:', error);
    res.status(500).json({ message: 'Error fetching volunteer details' });
  }
});

/**
 * Update volunteer
 */
router.put('/volunteers/:id', authenticateAdmin, async (req, res) => {
  try {
    const { full_name, age, email, phone, location, availability, volunteering_area } = req.body;
    
    await pool.query(
      'UPDATE volunteers SET full_name = ?, age = ?, email = ?, phone = ?, location = ?, availability = ?, volunteering_area = ? WHERE id = ?',
      [full_name, age, email, phone, location, availability, JSON.stringify(volunteering_area), req.params.id]
    );
    
    res.json({ message: 'Volunteer updated successfully' });
  } catch (error) {
    console.error('Error updating volunteer:', error);
    res.status(500).json({ message: 'Error updating volunteer' });
  }
});

/**
 * Delete volunteer
 */
router.delete('/volunteers/:id', authenticateAdmin, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM volunteers WHERE id = ?',
      [req.params.id]
    );
    
    res.json({ message: 'Volunteer deleted successfully' });
  } catch (error) {
    console.error('Error deleting volunteer:', error);
    res.status(500).json({ message: 'Error deleting volunteer' });
  }
});

// SUPPLIER MANAGEMENT ENDPOINTS

/**
 * Get all suppliers
 */
router.get('/suppliers', authenticateAdmin, async (req, res) => {
  try {
    const [results] = await pool.query(`
      SELECT * FROM suppliers
      ORDER BY created_at DESC
    `);
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ message: 'Error fetching suppliers' });
  }
});

/**
 * Get single supplier
 */
router.get('/suppliers/:id', authenticateAdmin, async (req, res) => {
  try {
    const [results] = await pool.query(
      'SELECT * FROM suppliers WHERE id = ?',
      [req.params.id]
    );
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    res.json(results[0]);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ message: 'Error fetching supplier details' });
  }
});

/**
 * Update supplier
 */
router.put('/suppliers/:id', authenticateAdmin, async (req, res) => {
  try {
    const { name, email, phone, location, sponsorshipTypes, collaboration, visibility } = req.body;
    
    await pool.query(
      'UPDATE suppliers SET name = ?, email = ?, phone = ?, location = ?, sponsorshipTypes = ?, collaboration = ?, visibility = ? WHERE id = ?',
      [name, email, phone, location, JSON.stringify(sponsorshipTypes), collaboration, visibility, req.params.id]
    );
    
    res.json({ message: 'Supplier updated successfully' });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ message: 'Error updating supplier' });
  }
});

/**
 * Delete supplier
 */
router.delete('/suppliers/:id', authenticateAdmin, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM suppliers WHERE id = ?',
      [req.params.id]
    );
    
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ message: 'Error deleting supplier' });
  }
});

// PRODUCT MANAGEMENT ENDPOINTS

/**
 * Get all products
 */
router.get('/products', authenticateAdmin, async (req, res) => {
  try {
    const [results] = await pool.query(`
      SELECT * FROM products
      ORDER BY id DESC
    `);
    
    console.log('Product list requested, found', results.length, 'products');
    console.log('First few products:', results.slice(0, 3).map(p => ({
      id: p.id,
      name: p.name,
      image: p.image
    })));
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

/**
 * Get single product
 */
router.get('/products/:id', authenticateAdmin, async (req, res) => {
  try {
    const [results] = await pool.query(
      'SELECT * FROM products WHERE id = ?',
      [req.params.id]
    );
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(results[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product details' });
  }
});

/**
 * Create new product
 */
router.post('/products', authenticateAdmin, async (req, res) => {
  console.log("Received product creation request");
  console.log("Headers:", req.headers);
  
  // Use upload function as middleware
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      console.error("Multer error:", err);
      return res.status(400).json({ status: 'error', message: `Upload error: ${err.message}` });
    } else if (err) {
      console.error("Unknown error:", err);
      return res.status(400).json({ status: 'error', message: `Error: ${err.message}` });
    }
    
    console.log("Request processed successfully");
    console.log("Request body:", req.body);
    
    if (req.file) {
      console.log("Uploaded file details:", {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        filename: req.file.filename
      });
    } else {
      console.log("No file was uploaded in this request");
    }
    
    // Extract product data from the request
    const { name, description, price, old_price, Category, type } = req.body;
    
    // Validate required fields
    if (!name || !description || !price || !Category) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }
    
    // Set image path if file was uploaded
    let imagePath = null;
    if (req.file) {
      // Use relative path to the images directory
      imagePath = `images/${req.file.filename}`;
      console.log(`Image saved as: ${imagePath}`);
      
      // Check if file exists at the physical location
      const fullPath = path.join(__dirname, '..', '..', imagePath);
      console.log(`Checking if image exists at: ${fullPath}`);
      const fileExists = fs.existsSync(fullPath);
      console.log(`File exists: ${fileExists}`);
      
      if (!fileExists) {
        console.error('WARNING: The image file does not exist at the expected path!');
      }
    }
    
    console.log('Inserting product into database with values:', {
      name, description, price, imagePath, old_price, type, Category
    });
    
    // Wrap database operation in try/catch for more detailed error handling
    let result;
    try {
      [result] = await pool.query(
      'INSERT INTO products (name, description, price, image, old_price, type, Category) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, description, price, imagePath, old_price || null, type || null, Category]
    );
      console.log('Product created successfully in database:', result);
      
      // Verify the product was inserted with correct image path
      if (result.insertId) {
        const [verifyResult] = await pool.query(
          'SELECT * FROM products WHERE id = ?',
          [result.insertId]
        );
        
        if (verifyResult.length > 0) {
          console.log('Verification of inserted product:', {
            id: verifyResult[0].id,
            name: verifyResult[0].name,
            imagePath: verifyResult[0].image
          });
        }
      }
    } catch (dbError) {
      console.error('Database error during product creation:', dbError);
      // If there was an uploaded file, try to delete it
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
          console.log('Deleted uploaded file due to database error');
        } catch (unlinkError) {
          console.error('Error deleting file after database error:', unlinkError);
        }
      }
      return res.status(500).json({ 
        message: 'Database error when creating product', 
        error: dbError.message
      });
    }
    
    // Set proper content type and return success
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json({
      message: 'Product created successfully',
      productId: result.insertId,
      imagePath: imagePath,
      productDetails: {
        id: result.insertId,
        name: name,
        image: imagePath
      }
    });
  });
});

/**
 * Update product
 */
router.put('/products/:id', authenticateAdmin, upload, async (req, res) => {
  try {
    console.log(`Updating product with ID: ${req.params.id}`);
    console.log("Request body:", req.body);
    
    const { name, description, price, old_price, type, Category } = req.body;
    let imagePath = req.body.existingImage;
    
    console.log(`Current image path: ${imagePath}`);
    
    if (req.file) {
      console.log("Uploaded file details:", {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        filename: req.file.filename
      });
      
      // Use relative path to the images directory
      imagePath = `images/${req.file.filename}`;
      console.log(`New image path set to: ${imagePath}`);
      
      // Check if file exists at the physical location
      const fullPath = path.join(__dirname, '..', '..', imagePath);
      console.log(`Checking if new image exists at: ${fullPath}`);
      console.log(`File exists: ${fs.existsSync(fullPath)}`);
      
      // Delete old image if exists and it's not the default image
      if (req.body.existingImage && !req.body.existingImage.includes('placeholder')) {
        const oldImagePath = path.join(__dirname, '..', '..', req.body.existingImage);
        console.log(`Attempting to delete old image at: ${oldImagePath}`);
        console.log(`Old image exists: ${fs.existsSync(oldImagePath)}`);
        
        fs.unlink(oldImagePath, (err) => {
          if (err) console.error('Could not delete old image:', err);
          else console.log('Old image deleted successfully');
        });
      }
    }
    
    console.log('Updating product in database with image path:', imagePath);
    
    await pool.query(
      'UPDATE products SET name = ?, description = ?, price = ?, image = ?, old_price = ?, type = ?, Category = ? WHERE id = ?',
      [name, description, price, imagePath, old_price || null, type || null, Category, req.params.id]
    );
    
    console.log('Product updated successfully in database');
    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
});

/**
 * Delete product
 */
router.delete('/products/:id', authenticateAdmin, async (req, res) => {
  try {
    // First get the product to access the image path
    const [product] = await pool.query(
      'SELECT image FROM products WHERE id = ?',
      [req.params.id]
    );
    
    if (product.length > 0 && product[0].image) {
      // Delete the image file if it's not a default image
      if (!product[0].image.includes('placeholder')) {
        const imagePath = path.join(__dirname, '..', '..', product[0].image);
        fs.unlink(imagePath, (err) => {
          if (err) console.error('Could not delete product image:', err);
        });
      }
    }
    
    await pool.query(
      'DELETE FROM products WHERE id = ?',
      [req.params.id]
    );
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
});

// ORDER MANAGEMENT ENDPOINTS

/**
 * Get all orders
 */
router.get('/orders', authenticateAdmin, async (req, res) => {
  try {
    // First get all orders with customer info
    const [orders] = await pool.query(`
      SELECT o.*, r.firstName, r.lastName, r.email 
      FROM orders o
      JOIN registrations r ON o.user_id = r.id
      ORDER BY o.order_date DESC
    `);
    
    // Now get all order items with product details for all orders
    const orderIds = orders.map(order => order.id);
    
    if (orderIds.length === 0) {
      return res.json(orders);
    }
    
    const [allOrderItems] = await pool.query(`
      SELECT oi.*, p.name as product_name, p.image, p.price
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id IN (?)
    `, [orderIds]);
    
    // Group items by order_id
    const itemsByOrderId = {};
    allOrderItems.forEach(item => {
      if (!itemsByOrderId[item.order_id]) {
        itemsByOrderId[item.order_id] = [];
      }
      itemsByOrderId[item.order_id].push(item);
    });
    
    // Add items to each order
    orders.forEach(order => {
      order.items = itemsByOrderId[order.id] || [];
    });
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

/**
 * Get order with items
 */
router.get('/orders/:id', authenticateAdmin, async (req, res) => {
  try {
    // Get order
    const [orderResults] = await pool.query(
      `SELECT o.*, r.firstName, r.lastName, r.email, r.phone, r.address 
       FROM orders o
       JOIN registrations r ON o.user_id = r.id
       WHERE o.id = ?`,
      [req.params.id]
    );
    
    if (orderResults.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Get order items
    const [itemResults] = await pool.query(
      `SELECT oi.*, p.name, p.image
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [req.params.id]
    );
    
    const order = orderResults[0];
    order.items = itemResults;
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ message: 'Error fetching order details' });
  }
});

/**
 * Update order status
 */
router.put('/orders/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    await pool.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    
    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status' });
  }
});

// ADMIN AUTH ENDPOINTS

/**
 * Admin login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    
    // First check for admin credentials
    if ((email === 'admin@gmail.com' || phone === '01111901033') && password === '4420041234@a') {
      // Generate JWT token for admin
      const token = jwt.sign(
        { 
          id: 1, 
          email: 'admin@gmail.com',
          isAdmin: true 
        },
        JWT_SECRET,
        { expiresIn: '8h' }
      );
      
      // Set the token in a cookie
      res.cookie('adminToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 8 * 60 * 60 * 1000 // 8 hours
      });
      
      return res.json({
        message: 'Admin login successful',
        token,
        admin: {
          id: 1,
          email: 'admin@gmail.com',
          firstName: 'Admin',
          lastName: 'User'
        }
      });
    }
    
    // If not admin, check in users table first
    const [users] = await pool.query(
      'SELECT * FROM users WHERE (email = ? OR phone = ?)',
      [email || phone, email || phone]
    );
    
    if (users.length > 0) {
      const user = users[0];
      // Check if password is hashed
      if (user.password.startsWith('$2')) {
        // Password is hashed with bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          const token = jwt.sign(
            { 
              id: user.id, 
              email: user.email,
              isAdmin: false 
            },
            JWT_SECRET,
            { expiresIn: '8h' }
          );
          
          return res.json({
            message: 'Login successful',
            token,
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName
            }
          });
        }
      } else if (user.password === password) {
        // Fallback for non-hashed passwords
        const token = jwt.sign(
          { 
            id: user.id, 
            email: user.email,
            isAdmin: false 
          },
          JWT_SECRET,
          { expiresIn: '8h' }
        );
        
        return res.json({
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
          }
        });
      }
    }
    
    // If not found in users, check in registrations table
    const [registrations] = await pool.query(
      'SELECT * FROM registrations WHERE (email = ? OR phone = ?)',
      [email || phone, email || phone]
    );
    
    if (registrations.length > 0) {
      const user = registrations[0];
      // Check if newPassword is hashed
      if (user.newPassword && user.newPassword.startsWith('$2')) {
        // Password is hashed with bcrypt
        const isMatch = await bcrypt.compare(password, user.newPassword);
        if (isMatch) {
          const token = jwt.sign(
            { 
              id: user.id, 
              email: user.email,
              isAdmin: false 
            },
            JWT_SECRET,
            { expiresIn: '8h' }
          );
          
          return res.json({
            message: 'Login successful',
            token,
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName
            }
          });
        }
      } else if (user.newPassword === password) {
        // Fallback for non-hashed passwords
        const token = jwt.sign(
          { 
            id: user.id, 
            email: user.email,
            isAdmin: false 
          },
          JWT_SECRET,
          { expiresIn: '8h' }
        );
        
        return res.json({
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
          }
        });
      }
    }
    
    // If we get here, no valid credentials were found
    return res.status(401).json({ message: 'Invalid credentials' });
    
  } catch (error) {
    console.error('Error in login:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Test API endpoint with CORS headers
router.get('/test-json', (req, res) => {
  try {
    console.log('Test JSON endpoint called');
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Set explicit content type
    res.setHeader('Content-Type', 'application/json');
    
    // Simple hardcoded object
    const data = {
      success: true,
      message: "This is a test endpoint",
      timestamp: new Date().toISOString(),
      items: [
        { id: 1, name: "Test Item 1" },
        { id: 2, name: "Test Item 2" },
        { id: 3, name: "Test Item 3" }
      ]
    };
    
    // Log what we're sending
    console.log('Sending test data:', data);
    
    // Return the data
    res.json(data);
  } catch (error) {
    console.error('Error in test endpoint:', error);
    
    // Even on error, still return valid JSON
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      success: false, 
      message: "Error in test endpoint", 
      error: error.message 
    });
  }
});

// Debug endpoint to test connectivity
router.get('/test-connection', (req, res) => {
  console.log('GET /api/admin/test-connection - Testing API connectivity');
  
  // Return basic info about the request
  res.json({
    message: 'API is accessible',
    timestamp: new Date().toISOString(),
    headers: req.headers,
    ip: req.ip,
    success: true
  });
});

module.exports = router; 
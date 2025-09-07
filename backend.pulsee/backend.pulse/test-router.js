/**
 * Simple test router to debug API issues
 */
const express = require('express');
const router = express.Router();

// Test endpoint that returns simple JSON
router.get('/hello', (req, res) => {
  // Set all necessary headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Log request info
  console.log('TEST ROUTER - Request received:', {
    url: req.url,
    method: req.method,
    headers: req.headers,
    query: req.query
  });
  
  // Return simple JSON
  const data = {
    message: "Hello from test router!",
    success: true,
    timestamp: new Date().toISOString()
  };
  
  console.log('TEST ROUTER - Sending response:', data);
  
  // Send response
  res.json(data);
});

// Best sellers test endpoint - guaranteed valid JSON
router.get('/best-sellers-test', (req, res) => {
  // Set all necessary headers explicitly
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Log the request
  console.log('TEST ROUTER - Best sellers test endpoint called');
  
  // Create guaranteed valid JSON response
  const testData = [
    {
      id: 1,
      name: "Test Product 1",
      price: 800.00,
      image: "images/Image 1.jpg",
      units_sold: 28,
      revenue: 22400.00
    },
    {
      id: 2,
      name: "Test Product 2",
      price: 250.00,
      image: "images/Image 3.jpg",
      units_sold: 23,
      revenue: 5750.00
    },
    {
      id: 3,
      name: "Test Product 3",
      price: 450.00,
      image: "images/Image 7.jpg",
      units_sold: 19,
      revenue: 8550.00
    }
  ];
  
  // Log what we're sending
  console.log('TEST ROUTER - Sending test best sellers:', testData);
  
  // Stringify manually to ensure proper JSON format
  const jsonString = JSON.stringify(testData);
  console.log('TEST ROUTER - JSON string:', jsonString);
  
  // Send the response directly as string with correct content type
  res.status(200).send(jsonString);
});

// Array endpoint that returns an array
router.get('/array', (req, res) => {
  // Set all necessary headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Return array data
  const data = [
    { id: 1, name: "Test Item 1" },
    { id: 2, name: "Test Item 2" },
    { id: 3, name: "Test Item 3" }
  ];
  
  console.log('TEST ROUTER - Sending array response');
  
  // Send response
  res.json(data);
});

// Echo endpoint that returns whatever is sent
router.post('/echo', express.json(), (req, res) => {
  // Set all necessary headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Log request body
  console.log('TEST ROUTER - Echo request body:', req.body);
  
  // Return the request body
  res.json({
    message: "Echo response",
    receivedData: req.body,
    timestamp: new Date().toISOString()
  });
});

// CORS preflight handler
router.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(204);
});

module.exports = router; 
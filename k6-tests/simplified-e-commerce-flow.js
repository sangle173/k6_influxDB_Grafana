import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const UserActions = new Counter('user_actions');
const PageLoadTime = new Trend('page_load_time');
const CheckoutTime = new Trend('checkout_time');
const ApiLatency = new Trend('api_latency');

// Configure a much lighter load test suitable for a PHP development server
export const options = {
  stages: [
    { duration: '15s', target: 2 },  // Ramp up to just 2 users
    { duration: '30s', target: 2 },  // Stay at 2 users for 30 seconds
    { duration: '15s', target: 5 },  // Ramp up to 5 users 
    { duration: '30s', target: 5 },  // Stay at 5 users for 30 seconds
    { duration: '15s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests must complete below 1s
    'page_load_time': ['p(95)<2000'],  // 95% of page loads must complete below 2s
    'checkout_time': ['p(95)<3000'],   // 95% of checkouts must complete below 3s
    'api_latency': ['p(95)<500'],      // 95% of API calls must complete below 500ms
  },
};

// Helper function to measure API call latency
function measureApiCall(name, method, url, payload = null, params = null) {
  const start = new Date();
  
  let response;
  if (method.toLowerCase() === 'get') {
    response = http.get(url, params);
  } else if (method.toLowerCase() === 'post') {
    response = http.post(url, payload, params);
  } else if (method.toLowerCase() === 'put') {
    response = http.put(url, payload, params);
  } else if (method.toLowerCase() === 'delete') {
    response = http.del(url, payload, params);
  }
  
  const duration = new Date() - start;
  ApiLatency.add(duration);
  
  return response;
}

// Test setup - we'll skip user creation to simplify
export function setup() {
  const baseUrl = __ENV.API_URL || 'http://localhost:8000/api';
  return { baseUrl };
}

// Main e-commerce user flow
export default function(data) {
  const baseUrl = data.baseUrl;
  
  // Add random sleep between user actions to simulate real user behavior
  const actionPause = randomIntBetween(1, 3);
  
  group('Browse Products', function() {
    // Start timing for page load
    const pageStart = new Date();
    
    // Get product categories
    const categoriesRes = measureApiCall(
      'Get Categories',
      'GET', 
      `${baseUrl}/categories`
    );
    
    check(categoriesRes, {
      'categories loaded': (r) => r.status === 200,
      'categories contain data': (r) => r.json().length > 0,
    });
    
    if (categoriesRes.status === 200 && categoriesRes.json().length > 0) {
      // Select a random category
      const categories = categoriesRes.json();
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      
      sleep(actionPause);
      
      // Get products from the selected category
      const categoryProductsRes = measureApiCall(
        'Get Category Products',
        'GET', 
        `${baseUrl}/categories/${randomCategory.id}`
      );
      
      check(categoryProductsRes, {
        'category products loaded': (r) => r.status === 200,
      });
      
      // Record page load time
      const pageLoadTime = new Date() - pageStart;
      PageLoadTime.add(pageLoadTime);
      UserActions.add(1, { action: 'browse_products' });
    }
    
    sleep(actionPause);
  });
  
  group('View Product Details', function() {
    // Get all products
    const productsRes = measureApiCall(
      'Get Products',
      'GET', 
      `${baseUrl}/products`
    );
    
    check(productsRes, {
      'products loaded': (r) => r.status === 200,
      'products contain data': (r) => r.json().length > 0,
    });
    
    if (productsRes.status === 200 && productsRes.json().length > 0) {
      // Select a random product
      const products = productsRes.json();
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      
      sleep(actionPause);
      
      // Get product details
      const productDetailsRes = measureApiCall(
        'Get Product Details',
        'GET', 
        `${baseUrl}/products/${randomProduct.id}`
      );
      
      check(productDetailsRes, {
        'product details loaded': (r) => r.status === 200,
        'product has name': (r) => r.json().name !== undefined,
        'product has price': (r) => r.json().price !== undefined,
      });
      
      UserActions.add(1, { action: 'view_product' });
    }
    
    sleep(actionPause);
  });
  
  // Note: We'll skip the login/register flow to simplify the test
  // and avoid creating too many test users in your database
  
  group('Add to Cart', function() {
    // Get all products
    const productsRes = measureApiCall(
      'Get Products',
      'GET', 
      `${baseUrl}/products`
    );
    
    if (productsRes.status === 200 && productsRes.json().length > 0) {
      // Select a random product
      const products = productsRes.json();
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      
      // We would need to be logged in to add to cart
      // For this test, we'll just validate the API endpoints exist
      // by making a request to get the cart (which should return 401 for non-logged in users)
      
      const cartRes = measureApiCall(
        'Get Cart', 
        'GET',
        `${baseUrl}/cart`
      );
      
      check(cartRes, {
        'cart endpoint exists': (r) => r.status === 401 || r.status === 200,
      });
      
      UserActions.add(1, { action: 'add_to_cart' });
    }
    
    sleep(actionPause);
  });
  
  // Again, we'll just verify the order endpoints exist
  group('Checkout Process', function() {
    const checkoutStart = new Date();
    
    const ordersRes = measureApiCall(
      'Get Orders',
      'GET',
      `${baseUrl}/orders`
    );
    
    check(ordersRes, {
      'orders endpoint exists': (r) => r.status === 401 || r.status === 200,
    });
    
    const checkoutTime = new Date() - checkoutStart;
    CheckoutTime.add(checkoutTime);
    UserActions.add(1, { action: 'checkout' });
    
    sleep(actionPause);
  });
}

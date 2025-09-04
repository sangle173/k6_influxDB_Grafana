import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const UserActions = new Counter('user_actions');
const PageLoadTime = new Trend('page_load_time');
const CheckoutTime = new Trend('checkout_time');
const ApiLatency = new Trend('api_latency');

// Configure load test
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users over 30 seconds
    { duration: '1m', target: 10 },  // Stay at 10 users for 1 minute
    { duration: '30s', target: 30 }, // Ramp up to 30 users over 30 seconds
    { duration: '1m', target: 30 },  // Stay at 30 users for 1 minute
    { duration: '30s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests must complete below 1s
    'page_load_time': ['p(95)<2000'],  // 95% of page loads must complete below 2s
    'checkout_time': ['p(95)<3000'],   // 95% of checkouts must complete below 3s
    'api_latency': ['p(95)<500'],      // 95% of API calls must complete below 500ms
  },
};

// Test setup - creates test user accounts
export function setup() {
  const users = [];
  
  // Create 5 test users
  for (let i = 0; i < 5; i++) {
    const userId = Math.floor(Math.random() * 100000);
    
    // Register
    const registerUrl = 'http://localhost:8000/api/register';
    const registerPayload = JSON.stringify({
      name: `LoadTestUser${userId}`,
      email: `loadtestuser${userId}@example.com`,
      password: 'testpassword123',
      password_confirmation: 'testpassword123'
    });

    const registerParams = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    const registerResponse = http.post(registerUrl, registerPayload, registerParams);
    
    if (registerResponse.status === 201) {
      const userData = JSON.parse(registerResponse.body);
      
      users.push({
        id: userData.user.id,
        email: userData.user.email,
        token: userData.token,
      });
    }
  }
  
  return { users };
}

// Main test function - simulates user journey
export default function(data) {
  // Select a random user from the pool
  const userIndex = randomIntBetween(0, data.users.length - 1);
  const user = data.users[userIndex];
  
  // Each group represents a distinct user action
  group('Browse Homepage', function() {
    const startTime = new Date();
    
    // Get all products (homepage)
    const response = http.get('http://localhost:8000/api/products');
    
    check(response, {
      'Homepage loaded successfully': (r) => r.status === 200,
    });
    
    PageLoadTime.add(new Date() - startTime);
    UserActions.add(1, { action: 'browse_homepage' });
    ApiLatency.add(response.timings.duration);
    
    sleep(randomIntBetween(1, 3));
  });
  
  group('Browse Categories', function() {
    const startTime = new Date();
    
    // Get all categories
    const response = http.get('http://localhost:8000/api/categories');
    
    check(response, {
      'Categories loaded successfully': (r) => r.status === 200,
    });
    
    // Randomly select a category to browse
    if (response.status === 200) {
      const categories = JSON.parse(response.body).data;
      
      if (categories.length > 0) {
        const randomCategoryIndex = randomIntBetween(0, categories.length - 1);
        const categoryId = categories[randomCategoryIndex].id;
        
        // Get products from the selected category
        const categoryResponse = http.get(`http://localhost:8000/api/categories/${categoryId}`);
        
        check(categoryResponse, {
          'Category products loaded successfully': (r) => r.status === 200,
        });
        
        ApiLatency.add(categoryResponse.timings.duration);
      }
    }
    
    PageLoadTime.add(new Date() - startTime);
    UserActions.add(1, { action: 'browse_categories' });
    ApiLatency.add(response.timings.duration);
    
    sleep(randomIntBetween(2, 5));
  });
  
  group('Product Search', function() {
    const startTime = new Date();
    
    // Search terms
    const searchTerms = ['phone', 'laptop', 'headphones', 'watch', 'camera'];
    const randomTermIndex = randomIntBetween(0, searchTerms.length - 1);
    
    // Search for products
    const response = http.get(`http://localhost:8000/api/products/search?q=${searchTerms[randomTermIndex]}`);
    
    check(response, {
      'Search results loaded successfully': (r) => r.status === 200,
    });
    
    PageLoadTime.add(new Date() - startTime);
    UserActions.add(1, { action: 'product_search' });
    ApiLatency.add(response.timings.duration);
    
    sleep(randomIntBetween(1, 3));
  });
  
  group('View Product Details', function() {
    const startTime = new Date();
    
    // Get all products
    const productsResponse = http.get('http://localhost:8000/api/products');
    
    if (productsResponse.status === 200) {
      const products = JSON.parse(productsResponse.body).data;
      
      if (products.length > 0) {
        // Select a random product
        const randomProductIndex = randomIntBetween(0, products.length - 1);
        const productId = products[randomProductIndex].id;
        
        // View product details
        const response = http.get(`http://localhost:8000/api/products/${productId}`);
        
        check(response, {
          'Product details loaded successfully': (r) => r.status === 200,
          'Product has details': (r) => JSON.parse(r.body).data.id === productId,
        });
        
        ApiLatency.add(response.timings.duration);
      }
    }
    
    PageLoadTime.add(new Date() - startTime);
    UserActions.add(1, { action: 'view_product' });
    ApiLatency.add(productsResponse.timings.duration);
    
    sleep(randomIntBetween(3, 8));
  });
  
  // From this point, we need authentication
  group('User Login', function() {
    // Login with the test user
    const loginUrl = 'http://localhost:8000/api/login';
    const loginPayload = JSON.stringify({
      email: user.email,
      password: 'testpassword123'
    });
    
    const loginParams = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };
    
    const response = http.post(loginUrl, loginPayload, loginParams);
    
    check(response, {
      'Login successful': (r) => r.status === 200,
      'Token received': (r) => JSON.parse(r.body).token !== undefined,
    });
    
    // Update the token in case it changed
    if (response.status === 200) {
      user.token = JSON.parse(response.body).token;
    }
    
    UserActions.add(1, { action: 'login' });
    ApiLatency.add(response.timings.duration);
    
    sleep(randomIntBetween(1, 2));
  });
  
  group('Add to Cart', function() {
    // Get all products
    const productsResponse = http.get('http://localhost:8000/api/products');
    
    if (productsResponse.status === 200) {
      const products = JSON.parse(productsResponse.body).data;
      
      if (products.length > 0) {
        // Select 1-3 random products to add to cart
        const numProductsToAdd = randomIntBetween(1, 3);
        
        for (let i = 0; i < numProductsToAdd; i++) {
          const randomProductIndex = randomIntBetween(0, products.length - 1);
          const productId = products[randomProductIndex].id;
          const quantity = randomIntBetween(1, 3);
          
          // Add to cart
          const cartPayload = JSON.stringify({
            product_id: productId,
            quantity: quantity
          });
          
          const cartParams = {
            headers: {
              'Authorization': `Bearer ${user.token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          };
          
          const response = http.post('http://localhost:8000/api/cart/items', cartPayload, cartParams);
          
          check(response, {
            'Product added to cart': (r) => r.status === 201 || r.status === 200,
          });
          
          ApiLatency.add(response.timings.duration);
          sleep(randomIntBetween(1, 2));
        }
      }
    }
    
    UserActions.add(1, { action: 'add_to_cart' });
    
    sleep(randomIntBetween(2, 4));
  });
  
  group('View Cart', function() {
    const params = {
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Accept': 'application/json',
      },
    };
    
    const response = http.get('http://localhost:8000/api/cart', params);
    
    check(response, {
      'Cart loaded successfully': (r) => r.status === 200,
    });
    
    UserActions.add(1, { action: 'view_cart' });
    ApiLatency.add(response.timings.duration);
    
    sleep(randomIntBetween(2, 5));
  });
  
  group('Checkout Process', function() {
    const startTime = new Date();
    
    const params = {
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };
    
    // Add a 1-second delay to ensure cart operations are complete
    sleep(1);
    
    // Create an order from the cart
    const orderPayload = JSON.stringify({
      shipping_address: '123 Test Street, Test City',
      billing_address: '123 Test Street, Test City',
      payment_method: 'credit_card',
    });
    
    const response = http.post('http://localhost:8000/api/orders', orderPayload, params);
    
    check(response, {
      'Order created successfully': (r) => r.status === 201 || r.status === 200,
    });
    
    CheckoutTime.add(new Date() - startTime);
    UserActions.add(1, { action: 'checkout' });
    ApiLatency.add(response.timings.duration);
    
    sleep(randomIntBetween(2, 4));
  });
  
  group('View Orders', function() {
    const params = {
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Accept': 'application/json',
      },
    };
    
    const response = http.get('http://localhost:8000/api/orders', params);
    
    check(response, {
      'Orders loaded successfully': (r) => r.status === 200,
    });
    
    UserActions.add(1, { action: 'view_orders' });
    ApiLatency.add(response.timings.duration);
    
    sleep(randomIntBetween(2, 5));
  });
  
  group('Logout', function() {
    const params = {
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Accept': 'application/json',
      },
    };
    
    const response = http.post('http://localhost:8000/api/logout', {}, params);
    
    check(response, {
      'Logout successful': (r) => r.status === 200,
    });
    
    UserActions.add(1, { action: 'logout' });
    ApiLatency.add(response.timings.duration);
  });
}

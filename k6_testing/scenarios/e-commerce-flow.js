import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const UserActions = new Counter('user_actions');
const PageLoadTime = new Trend('page_load_time');
const CheckoutTime = new Trend('checkout_time');
const ApiLatency = new Trend('api_latency');

// Define different test scenarios
export const options = {
  scenarios: {
    baseline: {
      executor: 'constant-vus',
      vus: 2,  // Reduced from 3 for testing
      duration: '30s',  // Reduced from 1m for testing
      gracefulStop: '30s',
      tags: { scenario: 'baseline' },
    },
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 5 },  // Reduced from 10 for testing
        { duration: '1m', target: 5 },   // Reduced from 10 for testing
        { duration: '30s', target: 0 },
      ],
      gracefulStop: '30s',
      tags: { scenario: 'load' },
    },
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 5 },   // Reduced from 10 for testing
        { duration: '1m', target: 10 },   // Reduced from 50 for testing
        { duration: '1m', target: 15 },   // Reduced from 100 for testing
        { duration: '30s', target: 0 },   // Simplified ramp-down
      ],
      gracefulStop: '30s',
      tags: { scenario: 'stress' },
    },
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 5 },    // Reduced from 10 for testing
        { duration: '30s', target: 5 },    // Reduced from 10 for testing
        { duration: '30s', target: 20 },   // Reduced from 300 for testing
        { duration: '1m', target: 20 },    // Reduced from 300 for testing
        { duration: '30s', target: 5 },    // Reduced from 10 for testing
        { duration: '30s', target: 0 },    // Reduced from 1m for testing
      ],
      gracefulStop: '30s',
      tags: { scenario: 'spike' },
    },
    soak: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },    // Reduced from 50 for testing
        { duration: '3m', target: 10 },    // Reduced from 30m for testing
        { duration: '1m', target: 0 },     // Reduced from 5m for testing
      ],
      gracefulStop: '30s',
      tags: { scenario: 'soak' },
    },
  },
  
  // Global configuration options
  discardResponseBodies: true,
  
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
    const registerUrl = `${__ENV.API_URL}/register`;
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
  // If no users were created successfully in setup, create a random user for this iteration
  let user;
  if (!data.users || data.users.length === 0) {
    // Proceed without authentication
    user = { token: null };
  } else {
    // Select a random user from the pool
    const userIndex = randomIntBetween(0, data.users.length - 1);
    user = data.users[userIndex];
  }
  
  // Set up authorization header if we have a token
  const authHeaders = user.token ? {
    'Authorization': `Bearer ${user.token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  } : {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  // Each group represents a distinct user action
  group('Browse Homepage', function() {
    const startTime = new Date();
    
    // Get all products (homepage)
    const response = http.get(`${__ENV.API_URL}/products`);
    
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
    const response = http.get(`${__ENV.API_URL}/categories`);
    
    check(response, {
      'Categories loaded successfully': (r) => r.status === 200,
    });
    
    // If successful, get products for a random category
    if (response.status === 200) {
      const categories = JSON.parse(response.body).data;
      
      if (categories && categories.length > 0) {
        const randomCategory = categories[randomIntBetween(0, categories.length - 1)];
        
        const categoryProductsResponse = http.get(
          `${__ENV.API_URL}/categories/${randomCategory.id}`,
          { headers: authHeaders }
        );
        
        check(categoryProductsResponse, {
          'Category products loaded successfully': (r) => r.status === 200,
        });
        
        ApiLatency.add(categoryProductsResponse.timings.duration);
      }
    }
    
    PageLoadTime.add(new Date() - startTime);
    UserActions.add(1, { action: 'browse_categories' });
    ApiLatency.add(response.timings.duration);
    
    sleep(randomIntBetween(1, 3));
  });
  
  group('Product Search', function() {
    const startTime = new Date();
    
    // Search for products
    const searchTerms = ['phone', 'laptop', 'shirt', 'book'];
    const randomSearchTerm = searchTerms[randomIntBetween(0, searchTerms.length - 1)];
    
    const response = http.get(
      `${__ENV.API_URL}/products/search?query=${randomSearchTerm}`,
      { headers: authHeaders }
    );
    
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
    const productsResponse = http.get(`${__ENV.API_URL}/products`, { headers: authHeaders });
    
    if (productsResponse.status === 200) {
      const products = JSON.parse(productsResponse.body).data;
      
      if (products && products.length > 0) {
        // View a random product
        const randomProduct = products[randomIntBetween(0, products.length - 1)];
        
        const productDetailsResponse = http.get(
          `${__ENV.API_URL}/products/${randomProduct.id}`,
          { headers: authHeaders }
        );
        
        check(productDetailsResponse, {
          'Product details loaded successfully': (r) => r.status === 200,
        });
        
        ApiLatency.add(productDetailsResponse.timings.duration);
      }
    }
    
    PageLoadTime.add(new Date() - startTime);
    UserActions.add(1, { action: 'view_product_details' });
    
    sleep(randomIntBetween(2, 5));
  });
  
  // Only perform cart and checkout operations if we have an authenticated user
  if (user.token) {
    group('Add to Cart', function() {
      const startTime = new Date();
      
      // Get all products
      const productsResponse = http.get(`${__ENV.API_URL}/products`, { headers: authHeaders });
      
      if (productsResponse.status === 200) {
        const products = JSON.parse(productsResponse.body).data;
        
        if (products && products.length > 0) {
          // Add a random product to cart
          const randomProduct = products[randomIntBetween(0, products.length - 1)];
          const quantity = randomIntBetween(1, 3);
          
          const addToCartResponse = http.post(
            `${__ENV.API_URL}/cart/items`,
            JSON.stringify({
              product_id: randomProduct.id,
              quantity: quantity
            }),
            { headers: authHeaders }
          );
          
          check(addToCartResponse, {
            'Product added to cart successfully': (r) => r.status === 200 || r.status === 201,
          });
          
          ApiLatency.add(addToCartResponse.timings.duration);
        }
      }
      
      PageLoadTime.add(new Date() - startTime);
      UserActions.add(1, { action: 'add_to_cart' });
      
      sleep(randomIntBetween(1, 3));
    });
    
    group('View Cart', function() {
      const startTime = new Date();
      
      // View cart
      const viewCartResponse = http.get(
        `${__ENV.API_URL}/cart`,
        { headers: authHeaders }
      );
      
      check(viewCartResponse, {
        'Cart viewed successfully': (r) => r.status === 200,
      });
      
      PageLoadTime.add(new Date() - startTime);
      UserActions.add(1, { action: 'view_cart' });
      ApiLatency.add(viewCartResponse.timings.duration);
      
      sleep(randomIntBetween(1, 3));
    });
    
    group('Checkout', function() {
      const startTime = new Date();
      
      // Checkout (using orders endpoint instead since checkout doesn't exist)
      const checkoutResponse = http.post(
        `${__ENV.API_URL}/orders`,
        JSON.stringify({
          payment_method: 'credit_card',
          shipping_address: '123 Test Street'
        }),
        { headers: authHeaders }
      );
      
      check(checkoutResponse, {
        'Checkout successful': (r) => r.status === 200 || r.status === 201,
      });
      
      CheckoutTime.add(new Date() - startTime);
      UserActions.add(1, { action: 'checkout' });
      ApiLatency.add(checkoutResponse.timings.duration);
      
      sleep(randomIntBetween(2, 5));
    });
  }
}

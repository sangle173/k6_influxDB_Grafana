import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Default options
export const options = {
  stages: [
    { duration: '1m', target: 10 }, // Ramp up to 10 users over 1 minute
    { duration: '3m', target: 10 }, // Stay at 10 users for 3 minutes
    { duration: '1m', target: 0 },  // Ramp down to 0 users over 1 minute
  ],
  thresholds: {
    http_req_duration: ['p(50) < 200', 'p(90) < 400', 'p(95) < 600'],
    errors: ['rate<0.1'], // Error rate should be less than 10%
  },
};

// Setup function - called once before the test starts
export function setup() {
  // You can perform setup tasks here, like creating test data or getting auth tokens
  const loginRes = http.post(`${__ENV.API_URL}/api/v1/auth/login`, {
    email: 'test@example.com',
    password: 'password',
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });

  const token = loginRes.json('token');
  return { token };
}

// Default function - called for each virtual user
export default function(data) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.token}`,
    },
  };
  
  // Browse products
  const productsRes = http.get(`${__ENV.API_URL}/api/v1/products`, params);
  check(productsRes, {
    'products status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  sleep(1);
  
  // View product details (assuming there's a product with ID 1)
  const productDetailsRes = http.get(`${__ENV.API_URL}/api/v1/products/1`, params);
  check(productDetailsRes, {
    'product details status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  sleep(1);
  
  // Add product to cart
  const addToCartRes = http.post(`${__ENV.API_URL}/api/v1/cart/items`, 
    JSON.stringify({
      product_id: 1,
      quantity: 1
    }), 
    params
  );
  
  check(addToCartRes, {
    'add to cart status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  sleep(1);
  
  // View cart
  const cartRes = http.get(`${__ENV.API_URL}/api/v1/cart`, params);
  check(cartRes, {
    'cart status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  sleep(1);
}

// Teardown function - called once after the test is over
export function teardown(data) {
  // Clean up after the test if needed
  http.post(`${__ENV.API_URL}/api/v1/auth/logout`, {}, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.token}`,
    },
  });
}

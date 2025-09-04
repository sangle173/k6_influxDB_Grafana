import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Baseline/smoke test - few users for basic functionality check
export const options = {
  vus: 3,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(50) < 200', 'p(90) < 400', 'p(95) < 600'],
    errors: ['rate<0.1'], // Error rate should be less than 10%
  },
};

// Setup function - called once before the test starts
export function setup() {
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
  
  // Quick test of all main API endpoints
  
  // Auth endpoints
  const registerRes = http.post(`${__ENV.API_URL}/api/v1/auth/register`, 
    JSON.stringify({
      name: `User${Date.now()}`,
      email: `user${Date.now()}@example.com`,
      password: 'password123',
      password_confirmation: 'password123'
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  check(registerRes, {
    'register status is 201': (r) => r.status === 201,
  }) || errorRate.add(1);
  
  // Products endpoints
  const productsRes = http.get(`${__ENV.API_URL}/api/v1/products`, params);
  check(productsRes, {
    'products status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  const productDetailsRes = http.get(`${__ENV.API_URL}/api/v1/products/1`, params);
  check(productDetailsRes, {
    'product details status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  // Categories endpoints
  const categoriesRes = http.get(`${__ENV.API_URL}/api/v1/categories`, params);
  check(categoriesRes, {
    'categories status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  // Cart endpoints
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
  
  const cartRes = http.get(`${__ENV.API_URL}/api/v1/cart`, params);
  check(cartRes, {
    'cart status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  // Order endpoints
  const checkoutRes = http.post(`${__ENV.API_URL}/api/v1/checkout`, 
    JSON.stringify({
      payment_method: 'credit_card',
      shipping_address: '123 Test Street'
    }), 
    params
  );
  
  check(checkoutRes, {
    'checkout status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  const ordersRes = http.get(`${__ENV.API_URL}/api/v1/orders`, params);
  check(ordersRes, {
    'orders status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  sleep(1);
}

// Teardown function - called once after the test is over
export function teardown(data) {
  http.post(`${__ENV.API_URL}/api/v1/auth/logout`, {}, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.token}`,
    },
  });
}

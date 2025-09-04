import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Spike test - sudden surge of traffic
export const options = {
  stages: [
    { duration: '1m', target: 10 },    // Ramp up to 10 users
    { duration: '1m', target: 10 },    // Stay at 10 users
    { duration: '1m', target: 300 },   // Spike to 300 users
    { duration: '3m', target: 300 },   // Stay at 300 users
    { duration: '1m', target: 10 },    // Scale down to 10 users
    { duration: '1m', target: 0 },     // Ramp down to 0 users
  ],
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
  
  // Focus on read-heavy operations for spike test
  
  // Browse categories
  const categoriesRes = http.get(`${__ENV.API_URL}/api/v1/categories`, params);
  check(categoriesRes, {
    'categories status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  // Browse products with different filters
  const productsRes = http.get(`${__ENV.API_URL}/api/v1/products?category=2&sort=price_asc&page=1`, params);
  check(productsRes, {
    'products status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  sleep(0.5);
  
  // View specific product details
  const productId = Math.floor(Math.random() * 10) + 1; // Random product ID between 1-10
  const productDetailsRes = http.get(`${__ENV.API_URL}/api/v1/products/${productId}`, params);
  check(productDetailsRes, {
    'product details status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  sleep(0.5);
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

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Baseline/smoke test - few users for basic functionality check
export const options = {
  vus: 3,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(50) < 200', 'p(90) < 400', 'p(95) < 600'],
    errors: ['rate<0.1'], // Error rate should be less than 10%
  },
};

// Default function - called for each virtual user
export default function() {
  // Public API endpoints
  const productsRes = http.get(`${__ENV.API_URL}/products`);
  check(productsRes, {
    'products status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  const productDetailsRes = http.get(`${__ENV.API_URL}/products/1`);
  check(productDetailsRes, {
    'product details status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  const categoriesRes = http.get(`${__ENV.API_URL}/categories`);
  check(categoriesRes, {
    'categories status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  // Add a small delay between requests to simulate user behavior
  sleep(1);
}

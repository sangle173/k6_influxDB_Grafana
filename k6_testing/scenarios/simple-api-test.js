import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Simple test - reduced load for API stability
export const options = {
  vus: 1,
  duration: '10s',
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests must complete below 1s
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
  
  // Get all categories
  const categoriesRes = http.get(`${__ENV.API_URL}/categories`);
  check(categoriesRes, {
    'categories status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  // Get all products in a category if categories returned successfully
  if (categoriesRes.status === 200) {
    const categories = JSON.parse(categoriesRes.body).data;
    if (categories && categories.length > 0) {
      const categoryId = categories[0].id;
      const categoryProductsRes = http.get(`${__ENV.API_URL}/categories/${categoryId}`);
      check(categoryProductsRes, {
        'category products status is 200': (r) => r.status === 200,
      }) || errorRate.add(1);
    }
  }
  
  sleep(1);
}

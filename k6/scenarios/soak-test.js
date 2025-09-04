import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Soak test - long duration stability test
export const options = {
  stages: [
    { duration: '5m', target: 50 },    // Ramp up to 50 users
    { duration: '2h', target: 50 },    // Stay at 50 users for 2 hours
    { duration: '5m', target: 0 },     // Ramp down to 0 users
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
  
  // For soak test, we simulate a realistic user flow with all operations
  
  // 1. Browse categories
  const categoriesRes = http.get(`${__ENV.API_URL}/api/v1/categories`, params);
  check(categoriesRes, {
    'categories status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  sleep(2);
  
  // 2. Browse products with filters
  const productsRes = http.get(`${__ENV.API_URL}/api/v1/products?category=1&sort=price_asc&page=1`, params);
  check(productsRes, {
    'products status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  sleep(3);
  
  // 3. View product details
  const productId = Math.floor(Math.random() * 20) + 1; // Random product ID between 1-20
  const productDetailsRes = http.get(`${__ENV.API_URL}/api/v1/products/${productId}`, params);
  check(productDetailsRes, {
    'product details status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  sleep(5);
  
  // 4. Add product to cart
  const addToCartRes = http.post(`${__ENV.API_URL}/api/v1/cart/items`, 
    JSON.stringify({
      product_id: productId,
      quantity: 1
    }), 
    params
  );
  
  check(addToCartRes, {
    'add to cart status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  sleep(2);
  
  // 5. View cart
  const cartRes = http.get(`${__ENV.API_URL}/api/v1/cart`, params);
  check(cartRes, {
    'cart status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  sleep(3);
  
  // 6. Checkout (for some users)
  if (Math.random() < 0.3) { // 30% of users complete checkout
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
    
    // 7. View orders
    const ordersRes = http.get(`${__ENV.API_URL}/api/v1/orders`, params);
    check(ordersRes, {
      'orders status is 200': (r) => r.status === 200,
    }) || errorRate.add(1);
  }
  
  sleep(5);
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

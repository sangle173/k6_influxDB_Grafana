import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// Create custom metrics
const publicEndpointCalls = new Counter('public_endpoint_calls');
const authEndpointCalls = new Counter('auth_endpoint_calls');
const protectedEndpointCalls = new Counter('protected_endpoint_calls');
const apiResponseTime = new Trend('api_response_time');

// Options for the test
export const options = {
  vus: 10, // Number of virtual users
  duration: '30s', // Test duration
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should complete within 500ms
    'public_endpoint_calls': ['count>100'],
    'auth_endpoint_calls': ['count>50'],
    'protected_endpoint_calls': ['count>50'],
  },
};

// Test setup function - runs once per VU
export function setup() {
  // Register a test user
  const registerUrl = 'http://localhost:8000/api/register';
  const registerPayload = JSON.stringify({
    name: `TestUser${Math.floor(Math.random() * 100000)}`,
    email: `testuser${Math.floor(Math.random() * 100000)}@example.com`,
    password: 'password123',
    password_confirmation: 'password123'
  });

  const registerParams = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };

  const registerResponse = http.post(registerUrl, registerPayload, registerParams);
  check(registerResponse, {
    'User registration successful': (r) => r.status === 201,
  });

  // Login with the registered user
  const loginUrl = 'http://localhost:8000/api/login';
  const loginPayload = JSON.stringify({
    email: JSON.parse(registerResponse.body).user.email,
    password: 'password123'
  });

  const loginParams = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };

  const loginResponse = http.post(loginUrl, loginPayload, loginParams);
  check(loginResponse, {
    'Login successful': (r) => r.status === 200,
  });

  // Return the token to be used in the VU iterations
  return {
    token: JSON.parse(loginResponse.body).token,
    email: JSON.parse(registerResponse.body).user.email,
  };
}

// Main test function - runs for each VU iteration
export default function(data) {
  // Test public endpoints
  testPublicEndpoints();
  
  // Test authentication endpoints
  testAuthEndpoints(data.email);
  
  // Test protected endpoints with token
  testProtectedEndpoints(data.token);
  
  sleep(1);
}

function testPublicEndpoints() {
  // GET products
  let response = http.get('http://localhost:8000/api/products');
  publicEndpointCalls.add(1);
  apiResponseTime.add(response.timings.duration);
  check(response, {
    'GET products status is 200': (r) => r.status === 200,
    'GET products has data': (r) => JSON.parse(r.body).data.length > 0,
  });

  // GET categories
  response = http.get('http://localhost:8000/api/categories');
  publicEndpointCalls.add(1);
  apiResponseTime.add(response.timings.duration);
  check(response, {
    'GET categories status is 200': (r) => r.status === 200,
    'GET categories has data': (r) => JSON.parse(r.body).data.length > 0,
  });

  // GET single product
  response = http.get('http://localhost:8000/api/products/1');
  publicEndpointCalls.add(1);
  apiResponseTime.add(response.timings.duration);
  check(response, {
    'GET single product status is 200': (r) => r.status === 200,
    'GET single product has ID': (r) => JSON.parse(r.body).data.id === 1,
  });

  // GET single category
  response = http.get('http://localhost:8000/api/categories/1');
  publicEndpointCalls.add(1);
  apiResponseTime.add(response.timings.duration);
  check(response, {
    'GET single category status is 200': (r) => r.status === 200,
    'GET single category has ID': (r) => JSON.parse(r.body).data.id === 1,
  });

  // Search products
  response = http.get('http://localhost:8000/api/products/search?q=phone');
  publicEndpointCalls.add(1);
  apiResponseTime.add(response.timings.duration);
  check(response, {
    'GET product search status is 200': (r) => r.status === 200,
  });
}

function testAuthEndpoints(email) {
  // Login with credentials
  let loginPayload = JSON.stringify({
    email: email,
    password: 'password123'
  });
  
  let params = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };

  let response = http.post('http://localhost:8000/api/login', loginPayload, params);
  authEndpointCalls.add(1);
  apiResponseTime.add(response.timings.duration);
  check(response, {
    'POST login status is 200': (r) => r.status === 200,
    'POST login returns token': (r) => JSON.parse(r.body).token !== undefined,
  });
}

function testProtectedEndpoints(token) {
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  };

  // GET user profile
  let response = http.get('http://localhost:8000/api/user', params);
  protectedEndpointCalls.add(1);
  apiResponseTime.add(response.timings.duration);
  check(response, {
    'GET user profile status is 200': (r) => r.status === 200,
    'GET user profile has data': (r) => JSON.parse(r.body).user !== undefined,
  });

  // GET cart
  response = http.get('http://localhost:8000/api/cart', params);
  protectedEndpointCalls.add(1);
  apiResponseTime.add(response.timings.duration);
  check(response, {
    'GET cart status is 200': (r) => r.status === 200,
  });

  // Add item to cart
  const cartPayload = JSON.stringify({
    product_id: 1,
    quantity: 1
  });
  
  const cartParams = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };

  response = http.post('http://localhost:8000/api/cart/items', cartPayload, cartParams);
  protectedEndpointCalls.add(1);
  apiResponseTime.add(response.timings.duration);
  check(response, {
    'POST add to cart status is 201': (r) => r.status === 201,
  });

  // GET orders
  response = http.get('http://localhost:8000/api/orders', params);
  protectedEndpointCalls.add(1);
  apiResponseTime.add(response.timings.duration);
  check(response, {
    'GET orders status is 200': (r) => r.status === 200,
  });
}

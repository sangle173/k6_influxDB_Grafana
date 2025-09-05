#!/bin/bash

# Define colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get server IP instead of using localhost (helps avoid connection issues)
SERVER_IP=$(hostname -I | awk '{print $1}')
API_URL="http://${SERVER_IP}:8000/api"
INFLUX_OUT="--out influxdb=http://localhost:8086/k6"

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}Multi-Scenario Performance Test${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "${BLUE}Using API URL:${NC} $API_URL"
echo -e "${BLUE}Running multiple scenarios in parallel:${NC}"
echo -e "  ${YELLOW}baseline${NC}: 3 VUs for 1 minute"
echo -e "  ${YELLOW}load${NC}: Up to 10 VUs for 5 minutes"
echo -e "  ${YELLOW}soak${NC}: Up to 50 VUs for 40 minutes"
echo -e "  ${YELLOW}spike${NC}: Up to 300 VUs for 8 minutes"
echo -e "${GREEN}============================================${NC}"

# Create a temporary multi-scenario test
cat > /tmp/multi-scenario-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Multi-scenario test configuration
export const options = {
  scenarios: {
    // Baseline: 3 VUs for 1 minute
    baseline: {
      executor: 'constant-vus',
      vus: 3,
      duration: '1m',
      gracefulStop: '30s',
      tags: { scenario: 'baseline' },
    },
    
    // Load: Ramping up to 10 VUs over 5 minutes
    load: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '1m', target: 5 },
        { duration: '2m', target: 10 },
        { duration: '1m30s', target: 5 },
        { duration: '30s', target: 0 },
      ],
      gracefulStop: '30s',
      tags: { scenario: 'load' },
    },
    
    // Soak: 50 VUs for 40 minutes
    soak: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 50 },   // Ramp up to 50 users over 5 minutes
        { duration: '30m', target: 50 },  // Stay at 50 users for 30 minutes
        { duration: '5m', target: 0 },    // Ramp down to 0 users over 5 minutes
      ],
      gracefulStop: '30s',
      tags: { scenario: 'soak' },
    },
    
    // Spike: Sudden spikes to 300 VUs over 8 minutes
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },   // Ramp up to 100 users
        { duration: '1m', target: 100 },   // Stay at 100
        { duration: '1m', target: 300 },   // Spike to 300
        { duration: '1m', target: 300 },   // Stay at 300
        { duration: '1m', target: 100 },   // Drop to 100
        { duration: '2m', target: 0 },     // Ramp down to 0
      ],
      gracefulStop: '30s',
      tags: { scenario: 'spike' },
    },
  },
  
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests must complete below 1s
    errors: ['rate<0.1'], // Error rate should be less than 10%
  },
};

// Default function - called for each virtual user
export default function() {
  // Get API URL from environment variables or use default
  const baseUrl = __ENV.API_URL || 'http://localhost:8000/api';
  
  // Add a small random pause to simulate real user behavior
  sleep(Math.random() * 1);
  
  group('Public Endpoints', function() {
    // Test products endpoint
    const productsRes = http.get(`${baseUrl}/products`);
    check(productsRes, {
      'products status is 200': (r) => r.status === 200,
    }) || errorRate.add(1);
    
    // Test categories endpoint
    const categoriesRes = http.get(`${baseUrl}/categories`);
    check(categoriesRes, {
      'categories status is 200': (r) => r.status === 200,
    }) || errorRate.add(1);
    
    if (categoriesRes.status === 200) {
      try {
        const categoriesData = JSON.parse(categoriesRes.body);
        const categories = categoriesData.data || categoriesData;
        
        if (categories && categories.length > 0) {
          // Get a random category to test
          const randomIndex = Math.floor(Math.random() * categories.length);
          const categoryId = categories[randomIndex].id;
          
          // Test category details endpoint
          const categoryDetailsRes = http.get(`${baseUrl}/categories/${categoryId}`);
          check(categoryDetailsRes, {
            'category details status is 200': (r) => r.status === 200,
          }) || errorRate.add(1);
        }
      } catch (e) {
        console.error('Error parsing categories response:', e);
        errorRate.add(1);
      }
    }
  });
  
  // Add another random pause between groups of requests
  sleep(Math.random() * 2);
  
  group('Product Search', function() {
    // Test search endpoint with random terms
    const searchTerms = ['shirt', 'phone', 'book', 'computer', 'desk'];
    const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    
    const searchRes = http.get(`${baseUrl}/products/search?q=${randomTerm}`);
    check(searchRes, {
      'search results status is 200': (r) => r.status === 200,
    }) || errorRate.add(1);
  });
  
  // Final pause to simulate user thinking time
  sleep(Math.random() * 3);
}
EOF

# Ask if user wants to run with shortened durations for testing
echo -e "${YELLOW}Note:${NC} The full test takes over 40 minutes to complete."
echo -e "${YELLOW}Would you like to run a shortened version for testing?${NC} (y/n)"
read -p "Run shortened version? " shortened

if [[ "$shortened" =~ ^[Yy] ]]; then
    echo -e "${BLUE}Running shortened version for testing...${NC}"
    
# Update the file with shorter durations
    sed -i 's/duration: "1m"/duration: "15s"/g' /tmp/multi-scenario-test.js
    sed -i 's/duration: "2m"/duration: "30s"/g' /tmp/multi-scenario-test.js
    sed -i 's/duration: "5m"/duration: "1m"/g' /tmp/multi-scenario-test.js
    sed -i 's/duration: "30m"/duration: "2m"/g' /tmp/multi-scenario-test.js
    sed -i 's/duration: "1m30s"/duration: "20s"/g' /tmp/multi-scenario-test.js
    sed -i 's/duration: "30s"/duration: "10s"/g' /tmp/multi-scenario-test.js
fi

# Run the test
echo -e "${GREEN}Starting multi-scenario test...${NC}"
echo -e "${YELLOW}Results will be available in Grafana: http://localhost:3000${NC}"

# Construct the command
cmd="k6 run $INFLUX_OUT -e API_URL=$API_URL /tmp/multi-scenario-test.js"

# Echo the command for transparency
echo -e "${BLUE}Executing:${NC} $cmd"
echo -e "${YELLOW}Press Ctrl+C if you need to stop the test early${NC}"

# Execute the command
eval $cmd

# Check exit status
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Test completed successfully!${NC}"
else
    echo -e "${YELLOW}Test completed with warnings or errors.${NC}"
    echo -e "${YELLOW}Check your server logs for more details.${NC}"
fi

echo -e "${YELLOW}View detailed results in Grafana:${NC} http://localhost:3000/d/k6-v1-dashboard/k6-performance-dashboard-influxdb-v1-x"

# Clean up temp script
rm -f /tmp/multi-scenario-test.js

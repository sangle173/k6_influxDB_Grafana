#!/bin/bash

# Define colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Set defaults for the test
VUS=3
DURATION="15s"
INFLUX_OUT="--out influxdb=http://localhost:8086/k6"

# Get server IP instead of using localhost (helps avoid connection issues)
SERVER_IP=$(hostname -I | awk '{print $1}')
API_URL="http://${SERVER_IP}:8000/api"
API_ENV="-e API_URL=$API_URL"

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}Running Simple API Stress Test${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "${BLUE}Using API URL:${NC} $API_URL"
echo -e "${BLUE}Test Parameters:${NC} ${VUS} VUs for ${DURATION}"
echo -e "${GREEN}============================================${NC}"

# Create a temporary simple test script
cat > /tmp/simple-stress-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Stress test with customizable parameters
export const options = {
  vus: __ENV.VUS || 3,
  duration: __ENV.DURATION || '15s',
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
    const categoriesData = JSON.parse(categoriesRes.body);
    const categories = categoriesData.data || categoriesData;
    
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
EOF

# Main test execution
echo -e "${GREEN}Running Simple API Stress Test...${NC}"
echo -e "${YELLOW}Test results will be available in Grafana: http://localhost:3000${NC}"

# Construct the command
cmd="k6 run $INFLUX_OUT $API_ENV -e VUS=$VUS -e DURATION=$DURATION /tmp/simple-stress-test.js"

# Echo the command for transparency
echo -e "${BLUE}Executing:${NC} $cmd"

# Execute the command
eval $cmd

# Check exit status
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Test completed successfully!${NC}"
else
    echo -e "${YELLOW}Test completed with warnings or errors.${NC}"
    echo -e "${YELLOW}Please check the following:${NC}"
    echo -e "1. Is InfluxDB running? Try: ${BLUE}curl http://localhost:8086/ping${NC}"
    echo -e "2. Is Laravel API running? Try: ${BLUE}curl ${API_URL}/products${NC}"
fi

echo -e "${YELLOW}View detailed results in Grafana:${NC} http://localhost:3000/d/k6-v1-dashboard/k6-performance-dashboard-influxdb-v1-x"

# Clean up temp script
rm -f /tmp/simple-stress-test.js

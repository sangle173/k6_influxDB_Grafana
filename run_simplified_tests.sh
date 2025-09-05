#!/bin/bash

# Define colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default settings
API_URL=${API_URL:-"http://localhost:8000/api"}
INFLUXDB_URL=${INFLUXDB_URL:-"http://localhost:8086/k6"}

# Print summary of what will be executed
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}k6 Performance Testing${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "${BLUE}API URL:${NC} $API_URL"
echo -e "${BLUE}InfluxDB URL:${NC} $INFLUXDB_URL"
echo -e "${BLUE}Grafana Dashboard:${NC} http://localhost:3000"
echo -e "${GREEN}============================================${NC}"

# Menu function
function show_menu() {
    echo -e "${BLUE}Choose a test to run:${NC}"
    echo "1) Simple API Test (Very Low Load)"
    echo "2) Simplified E-Commerce Flow (Low Load)"
    echo "q) Quit"
    echo -n "Enter your choice: "
}

# Function to run a test with common parameters
function run_test() {
    local test_file=$1
    local test_name=$2
    
    echo -e "${GREEN}Running $test_name...${NC}"
    echo -e "${YELLOW}Test results will be available in Grafana: http://localhost:3000${NC}"
    
    k6 run \
      --out influxdb=$INFLUXDB_URL \
      -e API_URL=$API_URL \
      "$test_file"
      
    echo -e "${GREEN}Test completed!${NC}"
    echo -e "${YELLOW}View results in Grafana: http://localhost:3000${NC}"
}

# Main menu loop
while true; do
    show_menu
    read -r choice
    
    case $choice in
        1)
            # This is your existing simple API test that worked well
            run_test "k6_testing/scenarios/simple-api-test.js" "Simple API Test"
            ;;
        2)
            # This is the new simplified e-commerce flow test
            run_test "k6-tests/simplified-e-commerce-flow.js" "Simplified E-Commerce Flow"
            ;;
        q|Q)
            echo -e "${GREEN}Exiting...${NC}"
            exit 0
            ;;
        *)
            echo -e "${YELLOW}Invalid choice. Please try again.${NC}"
            ;;
    esac
    
    echo ""
done

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
echo -e "${GREEN}Running E-commerce Flow Stress Test${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "${BLUE}Using API URL:${NC} $API_URL"
echo -e "${BLUE}Test Parameters:${NC} ${VUS} VUs for ${DURATION}"
echo -e "${GREEN}============================================${NC}"

# Function to create a temporary test script with custom parameters
create_temp_script() {
    local script=$1
    local vus=$2
    local duration=$3
    local scenario=$4
    
    # Create a temporary directory if it doesn't exist
    mkdir -p /tmp/k6-tests
    
    # Create a temporary copy of the script
    temp_script="/tmp/k6-tests/$(basename $script)"
    cp "$script" "$temp_script"
    
    # For e-commerce flow with stress scenario
    sed -i "s/stress: {/stress: {\\n      executor: 'ramping-vus',\\n      startVUs: 0,\\n      stages: [\\n        { duration: '${duration}', target: ${vus} },\\n      ],/g" "$temp_script"
    
    echo "$temp_script"
}

# Main test execution
echo -e "${GREEN}Running E-commerce Flow (Stress)...${NC}"
echo -e "${YELLOW}Test results will be available in Grafana: http://localhost:3000${NC}"

# Create temporary script with custom parameters
test_script="k6_testing/scenarios/e-commerce-flow.js"
temp_script=$(create_temp_script "$test_script" "$VUS" "$DURATION" "stress")

# Construct the command
cmd="k6 run $INFLUX_OUT $API_ENV --tag scenario=stress $temp_script"

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
    echo -e "3. Does the test file exist? Try: ${BLUE}cat $test_script${NC}"
fi

echo -e "${YELLOW}View detailed results in Grafana:${NC} http://localhost:3000/d/k6-v1-dashboard/k6-performance-dashboard-influxdb-v1-x"

# Clean up temp script
rm -f "$temp_script"

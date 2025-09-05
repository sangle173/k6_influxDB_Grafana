#!/bin/bash

# Define colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Set defaults
DEFAULT_VUS=5
DEFAULT_DURATION="30s"
INFLUX_OUT="--out influxdb=http://localhost:8086/k6"

# Get server IP instead of using localhost (helps avoid connection issues)
SERVER_IP=$(hostname -I | awk '{print $1}')
API_URL="http://${SERVER_IP}:8000/api"
API_ENV="-e API_URL=$API_URL"

clear
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}K6 Performance Testing Scenarios${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "${BLUE}Using API URL:${NC} $API_URL"
echo -e "${BLUE}Sending metrics to:${NC} InfluxDB (http://localhost:8086)"
echo -e "${BLUE}View results at:${NC} Grafana (http://localhost:3000)"
echo -e "${GREEN}============================================${NC}"
echo

# Function to get custom parameters
get_custom_parameters() {
    # Ask for number of virtual users
    echo -e "${BLUE}Enter number of Virtual Users (VUs)${NC}"
    echo -e "${YELLOW}Default: ${DEFAULT_VUS}${NC}"
    echo -e "${YELLOW}Recommendation: 1-3 VUs for dev server, 5-10 for staging, 10+ for production${NC}"
    read -p "VUs [${DEFAULT_VUS}]: " vus
    vus=${vus:-$DEFAULT_VUS}
    
    # Validate VUs is a number
    if ! [[ "$vus" =~ ^[0-9]+$ ]]; then
        echo -e "${YELLOW}Invalid input. Using default: ${DEFAULT_VUS} VUs${NC}"
        vus=$DEFAULT_VUS
    fi
    
    # Ask for test duration
    echo -e "${BLUE}Enter test duration${NC}"
    echo -e "${YELLOW}Default: ${DEFAULT_DURATION}${NC}"
    echo -e "${YELLOW}Format examples: 30s, 1m, 2m30s${NC}"
    read -p "Duration [${DEFAULT_DURATION}]: " duration
    duration=${duration:-$DEFAULT_DURATION}
    
    # Validate duration format (simple check)
    if ! [[ "$duration" =~ ^[0-9]+[smh]([0-9]+[smh])?$ ]]; then
        echo -e "${YELLOW}Invalid format. Using default: ${DEFAULT_DURATION}${NC}"
        duration=$DEFAULT_DURATION
    fi
    
    echo -e "${GREEN}Test will run with:${NC} ${vus} VUs for ${duration}"
    
    # Create the override options for k6
    # K6 uses --stage flag for stages configuration
    # For the k6 scenario structure, we need to use environment variables
    
    # Set environment variables for the test
    VU_ENV="-e VUS=$vus"
    DURATION_ENV="-e DURATION=$duration"
    
    # Return both in a format that can be used directly with k6 run
    K6_OVERRIDES="$VU_ENV $DURATION_ENV"
}

# Main menu
show_menu() {
    echo -e "${BLUE}Available Test Scenarios:${NC}"
    echo "1. Baseline test (basic functionality check)"
    echo "2. Load test (normal expected load)"
    echo "3. Soak test (long duration, stability check)"
    echo "4. Spike test (sudden traffic surge)"
    echo "5. Stress test (find breaking point)"
    echo "6. Simple API test (minimal load)"
    echo "7. E-commerce flow - Baseline scenario"
    echo "8. E-commerce flow - Load scenario"
    echo "9. E-commerce flow - Stress scenario" 
    echo "10. E-commerce flow - Spike scenario"
    echo "11. E-commerce flow - Soak scenario"
    echo "12. Exit"
    echo
    read -p "Enter your choice (1-12): " choice
}

# Run the selected test
run_test() {
    local test_script=$1
    local test_name=$2
    local additional_params=$3
    
    echo -e "${GREEN}Running ${test_name}...${NC}"
    echo -e "${YELLOW}Test results will be available in Grafana: http://localhost:3000${NC}"
    
    # Construct the command
    cmd="k6 run $INFLUX_OUT $API_ENV $K6_OVERRIDES $additional_params $test_script"
    
    # Echo the command for transparency
    echo -e "${BLUE}Executing:${NC} $cmd"
    
    # Execute the command
    eval $cmd
    
    # Check exit status
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Test completed successfully!${NC}"
    else
        echo -e "${YELLOW}Test completed with warnings or errors.${NC}"
    fi
    
    echo -e "${YELLOW}View detailed results in Grafana:${NC} http://localhost:3000/d/k6-v1-dashboard/k6-performance-dashboard-influxdb-v1-x"
}

# Main execution loop
while true; do
    show_menu
    
    if [ "$choice" = "12" ]; then
        echo -e "${GREEN}Exiting...${NC}"
        exit 0
    fi
    
    # If valid choice, get custom parameters
    if [[ "$choice" =~ ^[1-9]|10|11$ ]]; then
        get_custom_parameters
    fi
    
    case $choice in
        1)
            run_test "k6_testing/scenarios/baseline-test.js" "Baseline Test"
            ;;
        2)
            run_test "k6_testing/scenarios/load-test.js" "Load Test"
            ;;
        3)
            echo -e "${YELLOW}NOTE: Soak tests run for a long time. Press Ctrl+C to stop early.${NC}"
            run_test "k6_testing/scenarios/soak-test.js" "Soak Test"
            ;;
        4)
            run_test "k6_testing/scenarios/spike-test.js" "Spike Test"
            ;;
        5)
            run_test "k6_testing/scenarios/stress-test.js" "Stress Test"
            ;;
        6)
            run_test "k6_testing/scenarios/simple-api-test.js" "Simple API Test"
            ;;
        7)
            run_test "k6_testing/scenarios/e-commerce-flow.js" "E-commerce Flow (Baseline)" \
                "--tag scenario=baseline -o scenarios.baseline.executor=shared-iterations -o scenarios.spike.executor=none -o scenarios.load.executor=none -o scenarios.soak.executor=none -o scenarios.stress.executor=none"
            ;;
        8)
            run_test "k6_testing/scenarios/e-commerce-flow.js" "E-commerce Flow (Load)" \
                "--tag scenario=load -o scenarios.load.executor=shared-iterations -o scenarios.baseline.executor=none -o scenarios.spike.executor=none -o scenarios.soak.executor=none -o scenarios.stress.executor=none"
            ;;
        9)
            run_test "k6_testing/scenarios/e-commerce-flow.js" "E-commerce Flow (Stress)" \
                "--tag scenario=stress -o scenarios.stress.executor=shared-iterations -o scenarios.baseline.executor=none -o scenarios.spike.executor=none -o scenarios.soak.executor=none -o scenarios.load.executor=none"
            ;;
        10)
            run_test "k6_testing/scenarios/e-commerce-flow.js" "E-commerce Flow (Spike)" \
                "--tag scenario=spike -o scenarios.spike.executor=shared-iterations -o scenarios.baseline.executor=none -o scenarios.load.executor=none -o scenarios.soak.executor=none -o scenarios.stress.executor=none"
            ;;
        11)
            echo -e "${YELLOW}NOTE: Soak tests run for a long time. Press Ctrl+C to stop early.${NC}"
            run_test "k6_testing/scenarios/e-commerce-flow.js" "E-commerce Flow (Soak)" \
                "--tag scenario=soak -o scenarios.soak.executor=shared-iterations -o scenarios.baseline.executor=none -o scenarios.spike.executor=none -o scenarios.load.executor=none -o scenarios.stress.executor=none"
            ;;
        *)
            echo -e "${YELLOW}Invalid choice. Please try again.${NC}"
            ;;
    esac
    
    echo
    read -p "Press Enter to continue..."
    clear
done

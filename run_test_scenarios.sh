#!/bin/bash

echo "K6 Performance Testing Scenarios"

echo
echo "1. Run baseline test"
echo "2. Run load test"
echo "3. Run soak test"
echo "4. Run spike test"
echo "5. Run stress test"
echo "6. Run simple test"
echo "7. Run e-commerce flow test (baseline scenario)"
echo "8. Run e-commerce flow test (load scenario)"
echo "9. Run e-commerce flow test (stress scenario)"
echo "10. Run e-commerce flow test (spike scenario)"
echo "11. Run e-commerce flow test (soak scenario)"
echo "12. Exit"
echo

read -p "Enter your choice (1-12): " choice

# Set the InfluxDB output option
INFLUX_OUT="--out influxdb=http://localhost:8086/k6"

# API URL for the tests
# Using IP address instead of localhost to avoid connection issues under load
API_URL="http://172.18.100.149:8000/api"
API_ENV="-e API_URL=$API_URL"

if [ "$choice" = "1" ]; then
    echo "Running baseline test..."
    k6 run $INFLUX_OUT $API_ENV k6_testing/scenarios/baseline-test.js
elif [ "$choice" = "2" ]; then
    echo "Running load test..."
    k6 run $INFLUX_OUT $API_ENV k6_testing/scenarios/load-test.js
elif [ "$choice" = "3" ]; then
    echo "Running soak test..."
    echo "NOTE: Soak tests run for a long time. Press Ctrl+C to stop early."
    k6 run $INFLUX_OUT $API_ENV k6_testing/scenarios/soak-test.js
elif [ "$choice" = "4" ]; then
    echo "Running spike test..."
    k6 run $INFLUX_OUT $API_ENV k6_testing/scenarios/spike-test.js
elif [ "$choice" = "5" ]; then
    echo "Running stress test..."
    k6 run $INFLUX_OUT $API_ENV k6_testing/scenarios/stress-test.js
elif [ "$choice" = "6" ]; then
    echo "Running simple test..."
    k6 run $INFLUX_OUT $API_ENV k6_testing/scenarios/simple-test.js
elif [ "$choice" = "7" ]; then
    echo "Running e-commerce flow test (baseline scenario)..."
    k6 run $INFLUX_OUT $API_ENV k6_testing/scenarios/e-commerce-flow.js --tag scenario=baseline -o scenarios.baseline.executor=shared-iterations -o scenarios.spike.executor=none -o scenarios.load.executor=none -o scenarios.soak.executor=none -o scenarios.stress.executor=none
elif [ "$choice" = "8" ]; then
    echo "Running e-commerce flow test (load scenario)..."
    k6 run $INFLUX_OUT $API_ENV k6_testing/scenarios/e-commerce-flow.js --tag scenario=load -o scenarios.load.executor=shared-iterations -o scenarios.baseline.executor=none -o scenarios.spike.executor=none -o scenarios.soak.executor=none -o scenarios.stress.executor=none
elif [ "$choice" = "9" ]; then
    echo "Running e-commerce flow test (stress scenario)..."
    k6 run $INFLUX_OUT $API_ENV k6_testing/scenarios/e-commerce-flow.js --tag scenario=stress -o scenarios.stress.executor=shared-iterations -o scenarios.baseline.executor=none -o scenarios.spike.executor=none -o scenarios.soak.executor=none -o scenarios.load.executor=none
elif [ "$choice" = "10" ]; then
    echo "Running e-commerce flow test (spike scenario)..."
    k6 run $INFLUX_OUT $API_ENV k6_testing/scenarios/e-commerce-flow.js --tag scenario=spike -o scenarios.spike.executor=shared-iterations -o scenarios.baseline.executor=none -o scenarios.load.executor=none -o scenarios.soak.executor=none -o scenarios.stress.executor=none
elif [ "$choice" = "11" ]; then
    echo "Running e-commerce flow test (soak scenario)..."
    echo "NOTE: Soak tests run for a long time. Press Ctrl+C to stop early."
    k6 run $INFLUX_OUT $API_ENV k6_testing/scenarios/e-commerce-flow.js --tag scenario=soak -o scenarios.soak.executor=shared-iterations -o scenarios.baseline.executor=none -o scenarios.spike.executor=none -o scenarios.load.executor=none -o scenarios.stress.executor=none
elif [ "$choice" = "12" ]; then
    echo "Exiting..."
    exit 0
else
    echo "Invalid choice. Please try again."
    exit 1
fi

echo
echo "Test completed. View results in Grafana at http://localhost:3000"
echo "Dashboard URL: http://localhost:3000/d/k6-v1-dashboard/k6-performance-dashboard-influxdb-v1-x"
read -p "Press Enter to continue..."

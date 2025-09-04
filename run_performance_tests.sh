#!/bin/bash

echo "Laravel E-Commerce API Performance Testing"

echo
echo "1. Run basic API test"
echo "2. Run E-commerce flow test"
echo "3. Run both tests"
echo "4. Exit"
echo

read -p "Enter your choice (1-4): " choice

if [ "$choice" = "1" ]; then
    echo "Running basic API test..."
    k6 run --out influxdb=http://localhost:8086/k6?org=k6org\&bucket=k6\&token=my-super-secret-token k6-tests/api-test.js
elif [ "$choice" = "2" ]; then
    echo "Running E-commerce flow test..."
    k6 run --out influxdb=http://localhost:8086/k6?org=k6org\&bucket=k6\&token=my-super-secret-token k6-tests/e-commerce-flow.js
elif [ "$choice" = "3" ]; then
    echo "Running basic API test..."
    k6 run --out influxdb=http://localhost:8086/k6?org=k6org\&bucket=k6\&token=my-super-secret-token k6-tests/api-test.js
    echo
    echo "Running E-commerce flow test..."
    k6 run --out influxdb=http://localhost:8086/k6?org=k6org\&bucket=k6\&token=my-super-secret-token k6-tests/e-commerce-flow.js
elif [ "$choice" = "4" ]; then
    echo "Exiting..."
    exit 0
else
    echo "Invalid choice. Please try again."
    exit 1
fi

echo
echo "Test(s) completed. View results in Grafana at http://localhost:3000"
read -p "Press Enter to continue..."

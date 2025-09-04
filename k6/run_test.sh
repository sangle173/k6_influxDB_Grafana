#!/bin/bash

# k6 Run Script for Laravel E-Commerce API Performance Testing

# Default values
API_URL="http://localhost:8000"
SCENARIO="baseline"
VU=10
DURATION="1m"

# Display usage information
usage() {
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  -s, --scenario SCENARIO   Test scenario to run (baseline, load, stress, spike, soak)"
  echo "  -u, --url URL             Base URL of the API (default: http://localhost:8000)"
  echo "  -v, --vu NUMBER           Number of virtual users (default: 10)"
  echo "  -d, --duration STRING     Test duration (default: 1m)"
  echo "  -h, --help                Display this help message"
  echo ""
  echo "Examples:"
  echo "  $0 --scenario load --vu 50 --duration 5m"
  echo "  $0 -s stress -u http://api.example.com -v 100 -d 10m"
  exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -s|--scenario)
      SCENARIO="$2"
      shift 2
      ;;
    -u|--url)
      API_URL="$2"
      shift 2
      ;;
    -v|--vu)
      VU="$2"
      shift 2
      ;;
    -d|--duration)
      DURATION="$2"
      shift 2
      ;;
    -h|--help)
      usage
      ;;
    *)
      echo "Unknown option: $1"
      usage
      ;;
  esac
done

# Validate scenario
if [[ ! "$SCENARIO" =~ ^(baseline|load|stress|spike|soak)$ ]]; then
  echo "Error: Invalid scenario. Must be one of: baseline, load, stress, spike, soak"
  exit 1
fi

# Set script path
SCRIPT_PATH="./scenarios/${SCENARIO}-test.js"
if [ ! -f "$SCRIPT_PATH" ]; then
  echo "Error: Script not found at $SCRIPT_PATH"
  exit 1
fi

# Create results directory if it doesn't exist
mkdir -p ./results

# Output file
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="./results/${SCENARIO}_${TIMESTAMP}.json"

# InfluxDB settings (if using InfluxDB output)
INFLUXDB_ADDR=${INFLUXDB_ADDR:-"http://localhost:8086"}
INFLUXDB_ORG=${INFLUXDB_ORG:-"k6org"}
INFLUXDB_BUCKET=${INFLUXDB_BUCKET:-"k6"}
INFLUXDB_TOKEN=${INFLUXDB_TOKEN:-"my-super-secret-token"}

# Display test configuration
echo "========================================"
echo "k6 Performance Test Configuration"
echo "========================================"
echo "Scenario:   $SCENARIO"
echo "Script:     $SCRIPT_PATH"
echo "API URL:    $API_URL"
echo "VUs:        $VU"
echo "Duration:   $DURATION"
echo "Output:     $OUTPUT_FILE"
echo "InfluxDB:   $INFLUXDB_ADDR"
echo "========================================"

# Run the test
K6_INFLUXDB_ADDR=$INFLUXDB_ADDR \
K6_INFLUXDB_ORGANIZATION=$INFLUXDB_ORG \
K6_INFLUXDB_BUCKET=$INFLUXDB_BUCKET \
K6_INFLUXDB_TOKEN=$INFLUXDB_TOKEN \
k6 run \
  --out json=$OUTPUT_FILE \
  --out influxdb=http://localhost:8086/api/v2/write?org=k6org&bucket=k6 \
  --vus $VU \
  --duration $DURATION \
  -e API_URL=$API_URL \
  -e VU=$VU \
  -e DURATION=$DURATION \
  $SCRIPT_PATH

# Display results location
echo ""
echo "Test completed. Results saved to: $OUTPUT_FILE"
echo "Check Grafana dashboard at: http://localhost:3000"

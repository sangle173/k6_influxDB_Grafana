# Performance Testing Guide

## Prerequisites

To run the performance tests, you need:

1. **k6** - Install from https://k6.io/docs/get-started/installation/
2. **Docker and Docker Compose** - For InfluxDB and Grafana (optional for viewing results)

## Installation Options for k6

### Option 1: Using Chocolatey (Recommended for Windows)

```powershell
# Install Chocolatey if not already installed
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install k6
choco install k6 -y
```

### Option 2: Direct Download (Windows)

1. Download the latest release from: https://github.com/grafana/k6/releases
2. Extract the ZIP file
3. Add the extracted directory to your PATH or use the full path to the executable

## Running Tests

### Basic Test (Without InfluxDB/Grafana)

```powershell
# Navigate to the project directory
cd D:\k6_influxDB_Grafana

# Run the basic API test
k6 run k6-tests/api-test.js

# OR run the e-commerce flow test
k6 run k6-tests/e-commerce-flow.js
```

### Full Test (With InfluxDB/Grafana)

If you have Docker and Docker Compose installed:

```powershell
# Start InfluxDB and Grafana
docker-compose up -d

# Run test with InfluxDB output
k6 run --out influxdb=http://localhost:8086/k6?org=k6org&bucket=k6&token=my-super-secret-token k6-tests/api-test.js

# View results in Grafana
# Open browser to http://localhost:3000
```

## Test Descriptions

1. **api-test.js** - Tests basic API functionality including public, auth, and protected endpoints
2. **e-commerce-flow.js** - Simulates a realistic user journey through the e-commerce site

## Troubleshooting

If you encounter issues:

1. **k6 command not found** - Ensure k6 is installed and in your PATH
2. **Docker Compose errors** - Make sure Docker and Docker Compose are installed
3. **API connection errors** - Verify your Laravel API is running on http://localhost:8000

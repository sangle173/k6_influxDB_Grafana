# Performance Testing Guide for k6, InfluxDB, and Grafana

## Prerequisites

To run the performance tests, you need:

1. **k6** - Install from https://k6.io/docs/get-started/installation/
2. **Docker and Docker Compose** - For InfluxDB and Grafana (for viewing results)
3. **Laravel API** - Running on localhost:8000 (or configurable)

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

### Option 3: Linux Installation

```bash
# For Debian/Ubuntu
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# For Red Hat/CentOS
sudo dnf install https://dl.k6.io/rpm/repo.rpm
sudo dnf install k6
```

## Setup Infrastructure

### Start InfluxDB and Grafana

```bash
# Navigate to the project directory
cd k6_influxDB_Grafana

# Start InfluxDB and Grafana with Docker Compose
docker-compose up -d

# Verify services are running
docker ps
```

### Start Laravel API

```bash
# Navigate to your Laravel project
cd backend-laravel

# Start the Laravel development server
# Important: Use 0.0.0.0 as the host to allow connections from any IP
php artisan serve --host=0.0.0.0 --port=8000
```

## Running Tests

### Simplified Testing (Recommended for Development)

We've created a script that makes it easy to run different test scenarios:

```bash
# Make the script executable (Linux/Mac)
chmod +x run_simplified_tests.sh

# Run the script
./run_simplified_tests.sh
```

This script provides a menu with different test options:

1. **Simple API Test (Very Low Load)**: A minimal test that verifies the basic functionality of your API.
2. **Simplified E-Commerce Flow (Low Load)**: Simulates a complete user journey with a small number of virtual users.

### Manual Test Execution

If you prefer to run tests manually:

```bash
# Basic test with output to console
k6 run k6-tests/api-test.js

# Test with InfluxDB output
k6 run --out influxdb=http://localhost:8086/k6 -e API_URL=http://localhost:8000/api k6-tests/api-test.js
```

## Viewing Results

Test results are stored in InfluxDB and can be visualized in Grafana:

1. Open Grafana at http://localhost:3000 (default credentials: admin/admin)
2. The dashboard should be pre-configured to show k6 test results

## Understanding Test Types

### 1. Baseline/Smoke Testing (baseline-test.js)
- **Purpose**: Verify that the system works under minimal load
- **Characteristics**: Few users, basic functionality check
- **When to Use**: After deployments or changes to ensure functionality works

### 2. Load Testing (load-test.js)
- **Purpose**: Evaluate performance under expected normal conditions
- **Characteristics**: Normal user load over a moderate duration
- **When to Use**: To verify performance is acceptable under typical usage

### 3. Stress Testing (stress-test.js)
- **Purpose**: Find the system's breaking point
- **Characteristics**: Gradually increasing load until system breaks
- **When to Use**: To determine maximum capacity and identify bottlenecks

### 4. Soak Testing (soak-test.js)
- **Purpose**: Evaluate system behavior under prolonged load
- **Characteristics**: Moderate load over an extended period
- **When to Use**: To identify memory leaks, resource depletion issues

### 5. Spike Testing (spike-test.js)
- **Purpose**: Evaluate system response to sudden traffic surges
- **Characteristics**: Rapid increases and decreases in load
- **When to Use**: To test how the system handles traffic spikes (e.g., flash sales)

## Troubleshooting

### Connection Timeouts

If you encounter connection timeouts during testing, consider:

1. **PHP Development Server Limitations**: The PHP development server is not designed for production loads. It has limited concurrency and can easily become overwhelmed. For testing with higher loads, consider using:
   - Apache or Nginx with PHP-FPM
   - Laravel Sail with Docker

2. **Reducing Test Load**: Modify the test parameters to reduce load:
   - Decrease the number of virtual users (vus)
   - Shorten test duration
   - Increase sleep times between requests

3. **Server Configuration**:
   - Start the Laravel server with `--host=0.0.0.0` to allow connections from any IP
   - Check for firewalls or other network restrictions

4. **Connection Pooling**: 
   - PHP's development server has limited connection handling capability
   - When running tests, ensure connection keep-alive is enabled in k6 tests

### InfluxDB Issues

1. **InfluxDB v1.x vs v2.x**: Note that InfluxDB v1.x (used in this project) does not have a web UI. You must use Grafana to visualize the data.

2. **Checking InfluxDB Health**:
```bash
curl -I http://localhost:8086/ping
```

### Grafana Issues

1. **Default Login**: admin/admin
2. **No Data**: Ensure InfluxDB is running and k6 tests are sending data to the correct URL

## Best Practices

1. **Start Simple**: Begin with the simplest test (simple-api-test.js) to verify connectivity
2. **Progressive Load**: Increase load gradually to find the optimal capacity of your system
3. **Realistic Scenarios**: The e-commerce flow test simulates real user behavior
4. **Regular Testing**: Incorporate performance testing into your development workflow

## Conclusion

Performance testing is a critical part of ensuring your application can handle the expected load. By using k6, InfluxDB, and Grafana, you can identify and address performance issues before they affect your users.

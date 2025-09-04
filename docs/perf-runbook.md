# Performance Testing Runbook

This document provides instructions for setting up and running performance tests against the Laravel E-Commerce API using k6, InfluxDB, and Grafana.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup](#setup)
3. [Running Tests](#running-tests)
4. [Test Scenarios](#test-scenarios)
5. [Analyzing Results](#analyzing-results)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

- [k6](https://k6.io/docs/getting-started/installation/) - Performance testing tool
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) - For running InfluxDB and Grafana
- [xk6-output-influxdb](https://github.com/grafana/xk6-output-influxdb) - k6 extension for InfluxDB v2 output

## Setup

### 1. Start InfluxDB and Grafana

From the project root directory, navigate to the `infra` folder and start the Docker containers:

```bash
cd infra
docker-compose up -d
```

After starting the containers, you can access:
- InfluxDB UI: http://localhost:8086
- Grafana: http://localhost:3000

### 2. Configure InfluxDB

1. Open InfluxDB UI at http://localhost:8086
2. Log in with the following credentials:
   - Username: `admin`
   - Password: `password123`
3. Verify that the organization `k6org` and bucket `k6` exist
4. Copy your API token (if needed)

### 3. Configure Grafana

1. Open Grafana at http://localhost:3000
2. Log in with the following credentials:
   - Username: `admin`
   - Password: `admin`
3. Add InfluxDB data source:
   - Click on Configuration (gear icon) > Data sources
   - Click "Add data source"
   - Select "InfluxDB"
   - Set URL to `http://influxdb:8086`
   - Under "Auth", set Basic auth to "No"
   - Under "InfluxDB Details":
     - Set "Database" to `k6`
     - Set "Organization" to `k6org`
     - Set "Token" to the token value from InfluxDB
     - Set "Default Bucket" to `k6`
   - Click "Save & Test"

4. Import k6 dashboards:
   - Click the "+" icon in the sidebar > Import
   - Enter dashboard ID `2587` (for k6 Load Testing Results)
   - Click "Load"
   - Select the InfluxDB data source you created
   - Click "Import"
   - Repeat for dashboard ID `4411` (for k6 Native result metrics)

## Running Tests

You can run tests using either the provided shell script (`run_test.sh`) or PowerShell script (`run_test.ps1`).

### Using PowerShell (Windows)

```powershell
cd k6
.\run_test.ps1 -Scenario baseline -Url http://localhost:8000 -VU 10 -Duration 1m
```

### Using Bash (Linux/Mac/WSL)

```bash
cd k6
chmod +x run_test.sh
./run_test.sh --scenario baseline --url http://localhost:8000 --vu 10 --duration 1m
```

### Parameters

- `-Scenario` / `--scenario`: Test scenario to run (baseline, load, stress, spike, soak)
- `-Url` / `--url`: Base URL of the API (default: http://localhost:8000)
- `-VU` / `--vu`: Number of virtual users (default: 10)
- `-Duration` / `--duration`: Test duration (default: 1m)

## Test Scenarios

The following test scenarios are available:

1. **Baseline Test** - Quick smoke test with few users
   ```
   .\run_test.ps1 -Scenario baseline -VU 3 -Duration 1m
   ```

2. **Load Test** - Ramp up to a moderate load
   ```
   .\run_test.ps1 -Scenario load -VU 50 -Duration 5m
   ```

3. **Stress Test** - Increase load until system fails
   ```
   .\run_test.ps1 -Scenario stress -VU 200 -Duration 24m
   ```

4. **Spike Test** - Sudden surge of traffic
   ```
   .\run_test.ps1 -Scenario spike -VU 300 -Duration 8m
   ```

5. **Soak Test** - Long duration stability test
   ```
   .\run_test.ps1 -Scenario soak -VU 50 -Duration 2h
   ```

## Analyzing Results

During and after test execution, you can:

1. View real-time metrics in Grafana dashboards:
   - Open http://localhost:3000
   - Go to Dashboards > k6 Load Testing Results or k6 Native result metrics

2. Examine the JSON output file in the `k6/results` directory:
   - Each test run creates a timestamped JSON file
   - These files can be parsed and analyzed programmatically

3. Key metrics to monitor:
   - **p95 Response Time**: 95% of requests should complete within threshold
   - **Error Rate**: Percentage of failed requests
   - **Request Rate**: Number of requests per second
   - **Virtual Users**: Number of active users
   - **HTTP Errors**: Count of HTTP error responses

## Troubleshooting

### Common Issues

1. **InfluxDB Connection Issues**:
   - Verify InfluxDB container is running: `docker ps`
   - Check InfluxDB logs: `docker logs influxdb`
   - Ensure token is correctly set in environment variables

2. **k6 Errors**:
   - Ensure you have the latest version of k6
   - For InfluxDB output issues, make sure xk6-output-influxdb is installed
   - Check that the API URL is accessible from the machine running k6

3. **Grafana Dashboard Issues**:
   - Verify data source is correctly configured
   - Check if data is flowing into InfluxDB
   - Reset the time range in Grafana to include the test period

### Getting Help

If you encounter persistent issues:

1. Check k6 documentation: https://k6.io/docs/
2. Examine InfluxDB logs: `docker logs influxdb`
3. Examine Grafana logs: `docker logs grafana`

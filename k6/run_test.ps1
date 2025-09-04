# k6 Run Script for Laravel E-Commerce API Performance Testing (PowerShell)

# Default values
$API_URL = "http://localhost:8000"
$SCENARIO = "baseline"
$VU = 10
$DURATION = "1m"

# Display usage information
function Show-Usage {
    Write-Host "Usage: .\run_test.ps1 [options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Scenario SCENARIO   Test scenario to run (baseline, load, stress, spike, soak)"
    Write-Host "  -Url URL             Base URL of the API (default: http://localhost:8000)"
    Write-Host "  -VU NUMBER           Number of virtual users (default: 10)"
    Write-Host "  -Duration STRING     Test duration (default: 1m)"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\run_test.ps1 -Scenario load -VU 50 -Duration 5m"
    Write-Host "  .\run_test.ps1 -Scenario stress -Url http://api.example.com -VU 100 -Duration 10m"
    exit 1
}

# Parse command line arguments
param (
    [string]$Scenario = "baseline",
    [string]$Url = "http://localhost:8000",
    [int]$VU = 10,
    [string]$Duration = "1m",
    [switch]$Help = $false
)

if ($Help) {
    Show-Usage
}

# Override default values with command line arguments
$API_URL = $Url
$SCENARIO = $Scenario
$VU = $VU
$DURATION = $Duration

# Validate scenario
$validScenarios = @("baseline", "load", "stress", "spike", "soak")
if ($validScenarios -notcontains $SCENARIO) {
    Write-Host "Error: Invalid scenario. Must be one of: baseline, load, stress, spike, soak" -ForegroundColor Red
    exit 1
}

# Set script path
$SCRIPT_PATH = ".\scenarios\$SCENARIO-test.js"
if (-not (Test-Path $SCRIPT_PATH)) {
    Write-Host "Error: Script not found at $SCRIPT_PATH" -ForegroundColor Red
    exit 1
}

# Create results directory if it doesn't exist
$resultsDir = ".\results"
if (-not (Test-Path $resultsDir)) {
    New-Item -ItemType Directory -Path $resultsDir | Out-Null
}

# Output file
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$OUTPUT_FILE = ".\results\${SCENARIO}_${TIMESTAMP}.json"

# InfluxDB settings (if using InfluxDB output)
$INFLUXDB_ADDR = if ($env:INFLUXDB_ADDR) { $env:INFLUXDB_ADDR } else { "http://localhost:8086" }
$INFLUXDB_ORG = if ($env:INFLUXDB_ORG) { $env:INFLUXDB_ORG } else { "k6org" }
$INFLUXDB_BUCKET = if ($env:INFLUXDB_BUCKET) { $env:INFLUXDB_BUCKET } else { "k6" }
$INFLUXDB_TOKEN = if ($env:INFLUXDB_TOKEN) { $env:INFLUXDB_TOKEN } else { "my-super-secret-token" }

# Display test configuration
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "k6 Performance Test Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Scenario:   $SCENARIO"
Write-Host "Script:     $SCRIPT_PATH"
Write-Host "API URL:    $API_URL"
Write-Host "VUs:        $VU"
Write-Host "Duration:   $DURATION"
Write-Host "Output:     $OUTPUT_FILE"
Write-Host "InfluxDB:   $INFLUXDB_ADDR"
Write-Host "========================================" -ForegroundColor Cyan

# Run the test
$env:K6_INFLUXDB_ADDR = $INFLUXDB_ADDR
$env:K6_INFLUXDB_ORGANIZATION = $INFLUXDB_ORG
$env:K6_INFLUXDB_BUCKET = $INFLUXDB_BUCKET
$env:K6_INFLUXDB_TOKEN = $INFLUXDB_TOKEN

$k6Command = "k6 run --out json=$OUTPUT_FILE --out influxdb=http://localhost:8086/api/v2/write?org=k6org&bucket=k6 --vus $VU --duration $DURATION -e API_URL=$API_URL -e VU=$VU -e DURATION=$DURATION $SCRIPT_PATH"
Invoke-Expression $k6Command

# Display results location
Write-Host ""
Write-Host "Test completed. Results saved to: $OUTPUT_FILE" -ForegroundColor Green
Write-Host "Check Grafana dashboard at: http://localhost:3000" -ForegroundColor Green

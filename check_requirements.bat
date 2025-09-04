@echo off
echo Checking system requirements...
echo.

REM Check for Docker
echo Checking for Docker...
docker --version > nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not installed or not in PATH.
    echo Please install Docker from https://www.docker.com/products/docker-desktop
    echo.
) else (
    echo Docker is installed.
    echo.
)

REM Check for Docker Compose
echo Checking for Docker Compose...
docker-compose --version > nul 2>&1
if %errorlevel% neq 0 (
    echo Docker Compose is not installed or not in PATH.
    echo If you have Docker Desktop, Docker Compose should be included.
    echo If using standalone Docker, please install Docker Compose separately.
    echo.
) else (
    echo Docker Compose is installed.
    echo.
)

REM Check for k6
echo Checking for k6...
k6 version > nul 2>&1
if %errorlevel% neq 0 (
    echo k6 is not installed or not in PATH.
    echo You can install k6 using:
    echo 1. Chocolatey: choco install k6
    echo 2. Direct download: https://github.com/grafana/k6/releases
    echo 3. Or run the install_k6.bat script included in this project
    echo.
) else (
    echo k6 is installed.
    echo.
)

REM Final message
echo If any requirements are missing, please install them before continuing.
echo Once all requirements are installed, you can run:
echo 1. start_monitoring.bat - to start InfluxDB and Grafana
echo 2. run_performance_tests.bat - to run the k6 tests
echo.
pause

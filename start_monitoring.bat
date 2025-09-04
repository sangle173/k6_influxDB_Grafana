@echo off
echo Checking Docker and Docker Compose...

REM Check Docker is installed
docker --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not in your PATH.
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    echo or Docker Engine from https://docs.docker.com/engine/install/
    goto :end
)

REM Check Docker Compose is installed
docker-compose --version > nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Docker Compose not found. Trying with 'docker compose' (new syntax)...
    
    REM Try new Docker Compose syntax
    docker compose version > nul 2>&1
    if %errorlevel% neq 0 (
        echo ERROR: Docker Compose is not installed.
        echo If you have Docker Desktop, it should include Docker Compose.
        echo Otherwise, please install Docker Compose separately.
        goto :end
    ) else (
        echo Using new Docker Compose syntax.
        echo Starting InfluxDB and Grafana containers...
        docker compose up -d
    )
) else (
    echo Starting InfluxDB and Grafana containers...
    docker-compose up -d
)

echo.
echo Containers started!
echo.
echo InfluxDB is running at http://localhost:8086
echo Grafana is running at http://localhost:3000
echo.
echo You can now run performance tests using the run_performance_tests.bat script.

:end
pause

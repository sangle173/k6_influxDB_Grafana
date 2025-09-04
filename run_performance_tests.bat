@echo off
echo Laravel E-Commerce API Performance Testing

echo.
echo 1. Run basic API test
echo 2. Run E-commerce flow test
echo 3. Run both tests
echo 4. Exit
echo.

set /p choice="Enter your choice (1-4): "

REM Set path to k6 binary
set K6_PATH=k6\k6-v0.45.0-windows-amd64\k6.exe

REM Check if k6 directory exists, if not try to use global k6
if not exist "%K6_PATH%" (
    echo K6 not found in local directory. Trying global installation...
    set K6_PATH=k6
)

if "%choice%"=="1" (
    echo Running basic API test...
    %K6_PATH% run --out influxdb=http://localhost:8086/k6?org=k6org^&bucket=k6^&token=my-super-secret-token k6-tests/api-test.js
) else if "%choice%"=="2" (
    echo Running E-commerce flow test...
    %K6_PATH% run --out influxdb=http://localhost:8086/k6?org=k6org^&bucket=k6^&token=my-super-secret-token k6-tests/e-commerce-flow.js
) else if "%choice%"=="3" (
    echo Running basic API test...
    %K6_PATH% run --out influxdb=http://localhost:8086/k6?org=k6org^&bucket=k6^&token=my-super-secret-token k6-tests/api-test.js
    echo.
    echo Running E-commerce flow test...
    %K6_PATH% run --out influxdb=http://localhost:8086/k6?org=k6org^&bucket=k6^&token=my-super-secret-token k6-tests/e-commerce-flow.js
) else if "%choice%"=="4" (
    echo Exiting...
    exit /b 0
) else (
    echo Invalid choice. Please try again.
    exit /b 1
)

echo.
echo Test(s) completed. View results in Grafana at http://localhost:3000
pause

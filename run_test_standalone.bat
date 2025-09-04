@echo off
echo Running k6 test without InfluxDB...

REM Check if local k6 binary exists
if exist "k6\k6-v0.45.0-windows-amd64\k6.exe" (
    echo Using local k6 binary...
    set K6_PATH=k6\k6-v0.45.0-windows-amd64\k6.exe
) else (
    REM Check if k6 is installed globally
    k6 version > nul 2>&1
    if %errorlevel% neq 0 (
        echo k6 is not installed. Running the installer...
        call install_k6.bat
        if exist "k6\k6-v0.45.0-windows-amd64\k6.exe" (
            set K6_PATH=k6\k6-v0.45.0-windows-amd64\k6.exe
        ) else (
            echo Failed to install k6. Please install it manually.
            goto :end
        )
    ) else (
        echo Using globally installed k6...
        set K6_PATH=k6
    )
)

echo.
echo 1. Run basic API test
echo 2. Run E-commerce flow test
echo 3. Exit
echo.

set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo Running basic API test (without InfluxDB)...
    %K6_PATH% run k6-tests/api-test.js
) else if "%choice%"=="2" (
    echo Running E-commerce flow test (without InfluxDB)...
    %K6_PATH% run k6-tests/e-commerce-flow.js
) else if "%choice%"=="3" (
    echo Exiting...
    exit /b 0
) else (
    echo Invalid choice. Please try again.
    exit /b 1
)

:end
echo.
echo Test completed. Results shown above.
pause

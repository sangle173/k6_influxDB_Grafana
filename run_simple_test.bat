@echo off
echo Simple k6 test launcher
echo.

echo Checking for k6...
k6 version >nul 2>&1
if %errorlevel% neq 0 (
    echo k6 not found. Installing...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/grafana/k6/releases/download/v0.45.0/k6-v0.45.0-windows-amd64.zip' -OutFile 'k6.zip'"
    powershell -Command "Expand-Archive -Path 'k6.zip' -DestinationPath '.' -Force"
    del k6.zip
    echo k6 installed.
    set k6_cmd=.\k6.exe
) else (
    set k6_cmd=k6
)

echo.
echo Running basic API test...
%k6_cmd% run k6-tests\api-test.js

echo.
echo Test completed.
pause

@echo off
echo Checking for Chocolatey...

where choco >nul 2>&1
if %errorlevel% neq 0 (
    echo Chocolatey not found. Installing...
    
    @powershell -NoProfile -ExecutionPolicy Bypass -Command "[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))"
    
    echo Chocolatey installed. Refreshing environment variables...
    call refreshenv
) else (
    echo Chocolatey is already installed.
)

echo Installing k6 using Chocolatey...
choco install k6 -y

echo.
echo Installation complete. You should now be able to run k6 tests.
echo Please try running run_performance_tests.bat again.
echo.
pause

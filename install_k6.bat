@echo off
echo Installing k6 on your system...

REM Create a directory for k6
if not exist "k6" mkdir k6

REM Download k6 binary
echo Downloading k6 binary...
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/grafana/k6/releases/download/v0.45.0/k6-v0.45.0-windows-amd64.zip' -OutFile 'k6.zip'"

echo Extracting k6 binary...
powershell -Command "Expand-Archive -Path 'k6.zip' -DestinationPath 'k6' -Force"

echo Cleaning up...
del k6.zip

echo K6 installed successfully!
echo.
echo You can now run the performance tests with the installed k6 binary.
echo.
pause

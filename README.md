# Laravel E-Commerce API + k6 Performance Testing Framework

This project combines a Laravel E-Commerce REST API with a comprehensive performance testing framework using k6, InfluxDB, and Grafana for real-time performance monitoring and visualization.

## Project Overview

The project consists of two main components:

1. **Laravel E-Commerce API** (backend-laravel)
   - REST API for e-commerce operations
   - User authentication with Laravel Sanctum
   - Product, category, cart, and order management
   - MySQL database (via XAMPP)

2. **Performance Testing Framework** (k6 + InfluxDB + Grafana)
   - Load, stress, spike, and soak testing scenarios
   - Real-time metrics visualization
   - Test execution scripts for Windows and Linux
   - Detailed performance dashboards

## Tech Stack

- **Backend API**: Laravel 10+, PHP 8.2
- **Database**: MySQL (XAMPP + phpMyAdmin)
- **Auth**: Laravel Sanctum (token-based)
- **Performance Testing**: k6 (with `xk6-output-influxdb` for InfluxDB v2)
- **Metrics Storage**: InfluxDB v2
- **Visualization**: Grafana (community edition)

## Project Structure

```
/repo-root
  /backend-laravel      # Laravel API app
  /k6-bin               # k6 binaries for Windows
  /k6-tests             # Test scripts
    api-test.js         # API endpoint tests
    e-commerce-flow.js  # E-commerce user flow test
  /infra
    docker-compose.yml  # InfluxDB + Grafana containers
  run_performance_tests.bat  # Windows test runner
  run_performance_tests.sh   # Linux test runner
  README.md
```

## Getting Started

### Prerequisites

- PHP 8.2 with Composer
- XAMPP (for MySQL)
- Node.js and npm (optional, for frontend development)
- Docker and Docker Compose (for InfluxDB and Grafana)
- k6 performance testing tool

### API Setup (Windows)

1. Install XAMPP and start Apache and MySQL services.
2. Create a database named `laravel_ecommerce` using phpMyAdmin.
3. Configure the Laravel API:

```bash
# Navigate to backend directory
cd backend-laravel

# Install dependencies
composer install

# Create .env file
cp .env.example .env

# Configure database connection in .env
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=laravel_ecommerce
# DB_USERNAME=root
# DB_PASSWORD=

# Generate application key
php artisan key:generate

# Run migrations and seeders
php artisan migrate --seed

# Start development server
php artisan serve
```

### Running Performance Tests (Windows)

1. Download k6 for Windows (if not already in k6-bin directory):
   - Visit [k6.io/docs/get-started/installation](https://k6.io/docs/get-started/installation/)
   - Download the Windows binary
   - Extract to the `k6-bin` directory

2. Run the API test:
```powershell
# From project root
.\k6-bin\k6-v0.45.0-windows-amd64\k6.exe run k6-tests\api-test.js
```

3. Run the E-commerce flow test:
```powershell
# From project root
.\k6-bin\k6-v0.45.0-windows-amd64\k6.exe run k6-tests\e-commerce-flow.js --duration 30s --vus 5
```

4. Use the batch script for multiple test execution:
```powershell
# From project root
.\run_performance_tests.bat
```

### API Setup (Ubuntu 24.04)

1. Install the required packages:
```bash
sudo apt update
sudo apt install php8.2 php8.2-cli php8.2-common php8.2-mbstring php8.2-xml php8.2-curl php8.2-mysql composer mysql-server apache2 libapache2-mod-php8.2
```

2. Start and enable MySQL:
```bash
sudo systemctl start mysql
sudo systemctl enable mysql
```

3. Create a database:
```bash
sudo mysql -e "CREATE DATABASE laravel_ecommerce;"
sudo mysql -e "CREATE USER 'laraveluser'@'localhost' IDENTIFIED BY 'password';"
sudo mysql -e "GRANT ALL ON laravel_ecommerce.* TO 'laraveluser'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

4. Configure the Laravel API:
```bash
# Navigate to backend directory
cd backend-laravel

# Install dependencies
composer install

# Create .env file
cp .env.example .env

# Edit the .env file to match your database settings
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=laravel_ecommerce
# DB_USERNAME=laraveluser
# DB_PASSWORD=password

# Generate application key
php artisan key:generate

# Run migrations and seeders
php artisan migrate --seed

# Start development server
php artisan serve --host=0.0.0.0 --port=8000
```

### Running Performance Tests (Ubuntu 24.04)

1. Install k6:
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt update
sudo apt install k6
```

2. Run the API test:
```bash
# From project root
k6 run k6-tests/api-test.js
```

3. Run the E-commerce flow test:
```bash
# From project root
k6 run k6-tests/e-commerce-flow.js --duration 30s --vus 5
```

4. Use the shell script for multiple test execution:
```bash
# From project root
chmod +x run_performance_tests.sh
./run_performance_tests.sh
```

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login user
- `POST /api/logout` - Logout user (requires authentication)
- `GET /api/user` - Get authenticated user (requires authentication)

### Products
- `GET /api/products` - List all products
- `GET /api/products/{product}` - Get a specific product
- `GET /api/products/search?q={query}` - Search products
- `POST /api/products` - Create a product (admin only)
- `PUT /api/products/{product}` - Update a product (admin only)
- `DELETE /api/products/{product}` - Delete a product (admin only)

### Categories
- `GET /api/categories` - List all categories
- `GET /api/categories/{category}` - Get a specific category
- `POST /api/categories` - Create a category (admin only)
- `PUT /api/categories/{category}` - Update a category (admin only)
- `DELETE /api/categories/{category}` - Delete a category (admin only)

### Cart
- `GET /api/cart` - View cart (requires authentication)
- `POST /api/cart/items` - Add item to cart (requires authentication)
- `PUT /api/cart/items/{cartItem}` - Update cart item (requires authentication)
- `DELETE /api/cart/items/{cartItem}` - Remove cart item (requires authentication)
- `DELETE /api/cart` - Clear cart (requires authentication)

### Orders
- `GET /api/orders` - List all orders (requires authentication)
- `POST /api/orders` - Create a new order (requires authentication)
- `GET /api/orders/{order}` - View a specific order (requires authentication)
- `PUT /api/orders/{order}/cancel` - Cancel an order (requires authentication)
- `PUT /api/orders/{order}/status` - Update order status (admin only)

## Performance Testing

The project includes several k6 test scenarios:

1. **Baseline Test** - Quick smoke test with few users
2. **Load Test** - Ramp up to a moderate load
3. **Stress Test** - Increase load until system fails
4. **Spike Test** - Sudden surge of traffic
5. **Soak Test** - Long duration stability test

For detailed instructions on running and analyzing performance tests, see the [Performance Testing Runbook](docs/perf-runbook.md).

## Performance Targets

- p50 < 200ms
- p90 < 400ms
- p95 < 600ms

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

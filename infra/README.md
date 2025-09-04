# Laravel E-Commerce API - Project Structure

This document outlines the recommended structure for the Laravel E-Commerce API project. The backend should follow Laravel best practices and implement the required API endpoints.

## Database Migrations

Create the following migrations in the `database/migrations` directory:

1. `create_users_table.php` - Enhanced user table with roles
2. `create_categories_table.php` - Product categories with parent relationship
3. `create_products_table.php` - Products with category relationship
4. `create_carts_table.php` - User shopping cart
5. `create_cart_items_table.php` - Items in a cart
6. `create_orders_table.php` - User orders
7. `create_order_items_table.php` - Items in an order

## Models

Create the following models in the `app/Models` directory:

1. `User.php` - Enhanced user model with roles
2. `Category.php` - Product category with parent/child relationship
3. `Product.php` - Product with category relationship
4. `Cart.php` - User shopping cart
5. `CartItem.php` - Item in a cart
6. `Order.php` - User order
7. `OrderItem.php` - Item in an order

## Controllers

Create the following controllers in the `app/Http/Controllers/Api/V1` directory:

1. `AuthController.php` - User authentication (register, login, logout)
2. `ProductController.php` - Product CRUD operations
3. `CategoryController.php` - Category CRUD operations
4. `CartController.php` - Cart management
5. `OrderController.php` - Order management and checkout

## Routes

Define API routes in `routes/api.php`:

```php
Route::prefix('v1')->group(function () {
    // Auth routes
    Route::prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);
        Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    });
    
    // Public routes
    Route::get('products', [ProductController::class, 'index']);
    Route::get('products/{id}', [ProductController::class, 'show']);
    Route::get('categories', [CategoryController::class, 'index']);
    Route::get('categories/{id}', [CategoryController::class, 'show']);
    
    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        // Products (admin only)
        Route::post('products', [ProductController::class, 'store'])->middleware('admin');
        Route::put('products/{id}', [ProductController::class, 'update'])->middleware('admin');
        Route::delete('products/{id}', [ProductController::class, 'destroy'])->middleware('admin');
        
        // Categories (admin only)
        Route::post('categories', [CategoryController::class, 'store'])->middleware('admin');
        Route::put('categories/{id}', [CategoryController::class, 'update'])->middleware('admin');
        Route::delete('categories/{id}', [CategoryController::class, 'destroy'])->middleware('admin');
        
        // Cart
        Route::get('cart', [CartController::class, 'show']);
        Route::post('cart/items', [CartController::class, 'addItem']);
        Route::put('cart/items/{id}', [CartController::class, 'updateItem']);
        Route::delete('cart/items/{id}', [CartController::class, 'removeItem']);
        
        // Orders
        Route::post('checkout', [OrderController::class, 'checkout']);
        Route::get('orders', [OrderController::class, 'index']);
        Route::get('orders/{id}', [OrderController::class, 'show']);
    });
});
```

## Request Validation

Create the following request validation classes in `app/Http/Requests`:

1. `RegisterRequest.php`
2. `LoginRequest.php`
3. `ProductRequest.php`
4. `CategoryRequest.php`
5. `CartItemRequest.php`
6. `CheckoutRequest.php`

## Resources (API Responses)

Create the following resource classes in `app/Http/Resources`:

1. `UserResource.php`
2. `ProductResource.php`
3. `CategoryResource.php`
4. `CartResource.php`
5. `OrderResource.php`

## Middleware

Create the following middleware in `app/Http/Middleware`:

1. `AdminMiddleware.php` - Check if user has admin role

## Database Seeders

Create the following seeders in `database/seeders`:

1. `UserSeeder.php` - Create admin and regular users
2. `CategorySeeder.php` - Create product categories
3. `ProductSeeder.php` - Create sample products

## Tests

Create the following test classes in `tests/Feature`:

1. `AuthTest.php` - Test authentication endpoints
2. `ProductTest.php` - Test product endpoints
3. `CategoryTest.php` - Test category endpoints
4. `CartTest.php` - Test cart endpoints
5. `OrderTest.php` - Test order endpoints

## Implementation Steps

1. Set up a new Laravel project with Sanctum authentication
2. Create database migrations
3. Create models with relationships
4. Implement authentication with Sanctum
5. Create controllers with CRUD operations
6. Set up routes with proper middleware
7. Create request validation classes
8. Implement API resources for consistent responses
9. Create seeders for test data
10. Write feature tests for all endpoints
11. Implement rate limiting for public endpoints
12. Add pagination and filtering for collection endpoints

## Installation Instructions

1. Clone the repository
2. Install dependencies with Composer
3. Set up environment variables
4. Run migrations and seeders
5. Start the development server

## Security Considerations

1. Use Laravel Sanctum for token-based authentication
2. Implement role-based access control (admin vs. regular users)
3. Validate all input data
4. Implement rate limiting for public endpoints
5. Use proper HTTP status codes in responses
6. Handle exceptions and provide meaningful error messages

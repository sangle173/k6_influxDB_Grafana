<?php
/**
 * Laravel E-Commerce API Test Script
 * 
 * This script helps test the API endpoints of the Laravel E-Commerce application.
 * Run this script from the command line to perform API tests.
 */

$baseUrl = 'http://localhost:8000/api';  // Update this if your API is hosted elsewhere
$adminToken = null;
$userToken = null;

// Colors for terminal output
$green = "\033[32m";
$red = "\033[31m";
$yellow = "\033[33m";
$reset = "\033[0m";

/**
 * Make an HTTP request to the API
 */
function makeRequest($endpoint, $method = 'GET', $data = [], $token = null) {
    global $baseUrl;
    
    $url = $baseUrl . $endpoint;
    $ch = curl_init($url);
    
    $headers = ['Accept: application/json', 'Content-Type: application/json'];
    
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    if (!empty($data) && in_array($method, ['POST', 'PUT', 'PATCH'])) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'status' => $httpCode,
        'data' => json_decode($response, true)
    ];
}

/**
 * Print the result of a test
 */
function printResult($testName, $response, $expectedStatus = 200) {
    global $green, $red, $yellow, $reset;
    
    echo "Test: {$testName}\n";
    echo "Status: {$response['status']}\n";
    
    if ($response['status'] === $expectedStatus) {
        echo "{$green}✓ Test passed{$reset}\n";
    } else {
        echo "{$red}✗ Test failed{$reset}\n";
        echo "Response data: " . print_r($response['data'], true) . "\n";
    }
    
    echo "----------------------------------------\n";
    return $response['status'] === $expectedStatus;
}

/**
 * Run all API tests
 */
function runTests() {
    global $adminToken, $userToken, $yellow, $reset;
    
    $totalTests = 0;
    $passedTests = 0;
    
    // Register and login tests
    echo "{$yellow}Authentication Tests{$reset}\n";
    
    // Register admin
    $response = makeRequest('/register', 'POST', [
        'name' => 'Test Admin',
        'email' => 'testadmin@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123'
    ]);
    if (printResult('Register Admin', $response, 201)) $passedTests++;
    $totalTests++;
    
    if ($response['status'] === 201) {
        $adminToken = $response['data']['token'];
        echo "Admin token: " . substr($adminToken, 0, 10) . "...\n";
    }
    
    // Register regular user
    $response = makeRequest('/register', 'POST', [
        'name' => 'Test User',
        'email' => 'testuser@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123'
    ]);
    if (printResult('Register User', $response, 201)) $passedTests++;
    $totalTests++;
    
    if ($response['status'] === 201) {
        $userToken = $response['data']['token'];
        echo "User token: " . substr($userToken, 0, 10) . "...\n";
    }
    
    // Login as admin
    $response = makeRequest('/login', 'POST', [
        'email' => 'admin@example.com',
        'password' => 'password'
    ]);
    if (printResult('Login as Admin', $response, 200)) $passedTests++;
    $totalTests++;
    
    if ($response['status'] === 200) {
        $adminToken = $response['data']['token'];
        echo "Admin token: " . substr($adminToken, 0, 10) . "...\n";
    }
    
    // Login as user
    $response = makeRequest('/login', 'POST', [
        'email' => 'user@example.com',
        'password' => 'password'
    ]);
    if (printResult('Login as User', $response, 200)) $passedTests++;
    $totalTests++;
    
    if ($response['status'] === 200) {
        $userToken = $response['data']['token'];
        echo "User token: " . substr($userToken, 0, 10) . "...\n";
    }
    
    // Category Tests
    echo "\n{$yellow}Category Tests{$reset}\n";
    
    // Get categories
    $response = makeRequest('/categories');
    if (printResult('Get All Categories', $response)) $passedTests++;
    $totalTests++;
    
    // Create category (admin only)
    $response = makeRequest('/categories', 'POST', [
        'name' => 'Test Category',
        'description' => 'Test category description'
    ], $adminToken);
    if (printResult('Create Category (Admin)', $response, 201)) $passedTests++;
    $totalTests++;
    
    $categoryId = $response['data']['category']['id'] ?? null;
    
    // Create category (regular user - should fail)
    $response = makeRequest('/categories', 'POST', [
        'name' => 'Unauthorized Category',
        'description' => 'This should fail'
    ], $userToken);
    if (printResult('Create Category (User - Should Fail)', $response, 403)) $passedTests++;
    $totalTests++;
    
    // Product Tests
    echo "\n{$yellow}Product Tests{$reset}\n";
    
    // Get products
    $response = makeRequest('/products');
    if (printResult('Get All Products', $response)) $passedTests++;
    $totalTests++;
    
    // Create product (admin only)
    $response = makeRequest('/products', 'POST', [
        'name' => 'Test Product',
        'description' => 'Test product description',
        'price' => 99.99,
        'stock' => 100,
        'category_id' => 1
    ], $adminToken);
    if (printResult('Create Product (Admin)', $response, 201)) $passedTests++;
    $totalTests++;
    
    $productId = $response['data']['product']['id'] ?? 1;
    
    // Get specific product
    $response = makeRequest('/products/' . $productId);
    if (printResult('Get Specific Product', $response)) $passedTests++;
    $totalTests++;
    
    // Search products
    $response = makeRequest('/products/search?q=Test');
    if (printResult('Search Products', $response)) $passedTests++;
    $totalTests++;
    
    // Cart Tests
    echo "\n{$yellow}Cart Tests{$reset}\n";
    
    // View cart (authenticated)
    $response = makeRequest('/cart', 'GET', [], $userToken);
    if (printResult('View Cart', $response)) $passedTests++;
    $totalTests++;
    
    // Add item to cart
    $response = makeRequest('/cart/items', 'POST', [
        'product_id' => $productId,
        'quantity' => 2
    ], $userToken);
    if (printResult('Add Item to Cart', $response)) $passedTests++;
    $totalTests++;
    
    // Get cart after adding item
    $response = makeRequest('/cart', 'GET', [], $userToken);
    if (printResult('View Cart After Adding Item', $response)) $passedTests++;
    $totalTests++;
    
    $cartItemId = null;
    if ($response['status'] === 200 && isset($response['data']['cart']['items']) && count($response['data']['cart']['items']) > 0) {
        $cartItemId = $response['data']['cart']['items'][0]['id'];
    }
    
    if ($cartItemId) {
        // Update cart item
        $response = makeRequest('/cart/items/' . $cartItemId, 'PUT', [
            'quantity' => 3
        ], $userToken);
        if (printResult('Update Cart Item', $response)) $passedTests++;
        $totalTests++;
        
        // Remove cart item
        $response = makeRequest('/cart/items/' . $cartItemId, 'DELETE', [], $userToken);
        if (printResult('Remove Cart Item', $response)) $passedTests++;
        $totalTests++;
    }
    
    // Order Tests
    echo "\n{$yellow}Order Tests{$reset}\n";
    
    // Add item to cart for order
    $response = makeRequest('/cart/items', 'POST', [
        'product_id' => $productId,
        'quantity' => 1
    ], $userToken);
    
    // Create order
    $response = makeRequest('/orders', 'POST', [
        'shipping_address' => '123 Test Street, Test City',
        'payment_method' => 'credit_card',
        'payment_details' => 'Card ending in 1234'
    ], $userToken);
    if (printResult('Create Order', $response, 201)) $passedTests++;
    $totalTests++;
    
    $orderId = $response['data']['order']['id'] ?? null;
    
    if ($orderId) {
        // Get specific order
        $response = makeRequest('/orders/' . $orderId, 'GET', [], $userToken);
        if (printResult('Get Specific Order', $response)) $passedTests++;
        $totalTests++;
        
        // Cancel order
        $response = makeRequest('/orders/' . $orderId . '/cancel', 'PUT', [], $userToken);
        if (printResult('Cancel Order', $response)) $passedTests++;
        $totalTests++;
    }
    
    // Get all orders
    $response = makeRequest('/orders', 'GET', [], $userToken);
    if (printResult('Get All Orders', $response)) $passedTests++;
    $totalTests++;
    
    // Summary
    echo "\n{$yellow}Test Summary{$reset}\n";
    echo "Total tests: $totalTests\n";
    echo "Passed tests: $passedTests\n";
    echo "Failed tests: " . ($totalTests - $passedTests) . "\n";
    echo "Pass rate: " . round(($passedTests / $totalTests) * 100) . "%\n";
}

// Run the tests
echo "Starting API tests...\n";
runTests();
echo "API tests completed.\n";

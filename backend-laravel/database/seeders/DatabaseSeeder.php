<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create admin user
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        // Create regular user
        User::create([
            'name' => 'Regular User',
            'email' => 'user@example.com',
            'password' => Hash::make('password'),
            'role' => 'user',
        ]);

        // Create categories
        $categories = [
            [
                'name' => 'Electronics',
                'slug' => 'electronics',
                'description' => 'Electronic devices and gadgets',
            ],
            [
                'name' => 'Clothing',
                'slug' => 'clothing',
                'description' => 'Fashion items and apparel',
            ],
            [
                'name' => 'Books',
                'slug' => 'books',
                'description' => 'Books and publications',
            ],
            [
                'name' => 'Home & Kitchen',
                'slug' => 'home-kitchen',
                'description' => 'Home and kitchen appliances and items',
            ],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }

        // Create products
        $products = [
            [
                'sku' => 'PHONE-001',
                'name' => 'Smartphone X',
                'slug' => 'smartphone-x',
                'description' => 'Latest model with high-end features',
                'price' => 999.99,
                'inventory_count' => 50,
                'category_id' => 1,
            ],
            [
                'sku' => 'LAPTOP-001',
                'name' => 'Laptop Pro',
                'slug' => 'laptop-pro',
                'description' => 'Powerful laptop for professionals',
                'price' => 1499.99,
                'inventory_count' => 30,
                'category_id' => 1,
            ],
            [
                'sku' => 'TSHIRT-001',
                'name' => 'T-shirt',
                'slug' => 't-shirt',
                'description' => 'Comfortable cotton t-shirt',
                'price' => 19.99,
                'inventory_count' => 100,
                'category_id' => 2,
            ],
            [
                'sku' => 'JEANS-001',
                'name' => 'Jeans',
                'slug' => 'jeans',
                'description' => 'Classic blue jeans',
                'price' => 49.99,
                'inventory_count' => 80,
                'category_id' => 2,
            ],
            [
                'sku' => 'BOOK-001',
                'name' => 'Novel',
                'slug' => 'novel',
                'description' => 'Bestselling fiction novel',
                'price' => 14.99,
                'inventory_count' => 150,
                'category_id' => 3,
            ],
            [
                'sku' => 'BOOK-002',
                'name' => 'Cookbook',
                'slug' => 'cookbook',
                'description' => 'Recipe book for home cooking',
                'price' => 24.99,
                'inventory_count' => 70,
                'category_id' => 3,
            ],
            [
                'sku' => 'HOME-001',
                'name' => 'Coffee Maker',
                'slug' => 'coffee-maker',
                'description' => 'Automatic coffee machine',
                'price' => 89.99,
                'inventory_count' => 40,
                'category_id' => 4,
            ],
            [
                'sku' => 'HOME-002',
                'name' => 'Blender',
                'slug' => 'blender',
                'description' => 'High-power kitchen blender',
                'price' => 59.99,
                'inventory_count' => 35,
                'category_id' => 4,
            ],
        ];

        foreach ($products as $product) {
            Product::create($product);
        }
    }
}

<?php

namespace App\Http\Controllers;

use App\Http\Requests\CartRequest;
use App\Http\Resources\CartResource;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\Request;

class CartController extends Controller
{
    /**
     * Display the user's cart.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $cart = $this->getOrCreateCart($request->user());
        return response()->json([
            'cart' => new CartResource($cart)
        ], 200);
    }

    /**
     * Add a product to the cart.
     *
     * @param CartRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function addItem(CartRequest $request)
    {
        $cart = $this->getOrCreateCart($request->user());
        $product = Product::findOrFail($request->product_id);

        // Check if the product is in stock
        if ($product->inventory_count < $request->quantity) {
            return response()->json([
                'message' => 'Not enough stock available'
            ], 400);
        }

        // Check if the product is already in the cart
        $cartItem = $cart->items()->where('product_id', $request->product_id)->first();

        if ($cartItem) {
            // Update quantity if the product is already in the cart
            $cartItem->update([
                'quantity' => $cartItem->quantity + $request->quantity
            ]);
        } else {
            // Add new item to cart
            $cart->items()->create([
                'product_id' => $request->product_id,
                'quantity' => $request->quantity,
                'price' => $product->price
            ]);
        }

        return response()->json([
            'message' => 'Product added to cart successfully',
            'cart' => new CartResource($cart->fresh(['items.product']))
        ], 201);
    }

    /**
     * Update cart item quantity.
     *
     * @param Request $request
     * @param CartItem $cartItem
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateItem(Request $request, CartItem $cartItem)
    {
        $request->validate([
            'quantity' => 'required|integer|min:1'
        ]);

        // Ensure the cart item belongs to the user
        $cart = $this->getOrCreateCart($request->user());
        if ($cartItem->cart_id !== $cart->id) {
            return response()->json([
                'message' => 'Unauthorized action'
            ], 403);
        }

        // Check if the product is in stock
        $product = Product::findOrFail($cartItem->product_id);
        if ($product->inventory_count < $request->quantity) {
            return response()->json([
                'message' => 'Not enough stock available'
            ], 400);
        }

        $cartItem->update([
            'quantity' => $request->quantity
        ]);

        return response()->json([
            'message' => 'Cart item updated successfully',
            'cart' => new CartResource($cart->fresh(['items.product']))
        ], 200);
    }

    /**
     * Remove an item from the cart.
     *
     * @param Request $request
     * @param CartItem $cartItem
     * @return \Illuminate\Http\JsonResponse
     */
    public function removeItem(Request $request, CartItem $cartItem)
    {
        // Ensure the cart item belongs to the user
        $cart = $this->getOrCreateCart($request->user());
        if ($cartItem->cart_id !== $cart->id) {
            return response()->json([
                'message' => 'Unauthorized action'
            ], 403);
        }

        $cartItem->delete();

        return response()->json([
            'message' => 'Cart item removed successfully',
            'cart' => new CartResource($cart->fresh(['items.product']))
        ], 200);
    }

    /**
     * Clear the cart.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function clear(Request $request)
    {
        $cart = $this->getOrCreateCart($request->user());
        $cart->items()->delete();

        return response()->json([
            'message' => 'Cart cleared successfully',
            'cart' => new CartResource($cart->fresh(['items.product']))
        ], 200);
    }

    /**
     * Get user's cart or create a new one if it doesn't exist.
     *
     * @param \App\Models\User $user
     * @return Cart
     */
    protected function getOrCreateCart($user)
    {
        $cart = $user->cart;

        if (!$cart) {
            $cart = Cart::create([
                'user_id' => $user->id
            ]);
        }

        // Eager load items and their products
        return $cart->load('items.product');
    }
}

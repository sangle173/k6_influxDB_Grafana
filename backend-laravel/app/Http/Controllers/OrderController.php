<?php

namespace App\Http\Controllers;

use App\Http\Requests\OrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    /**
     * Display a listing of the user's orders.
     *
     * @param Request $request
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
    public function index(Request $request)
    {
        $orders = $request->user()->orders()->with('items.product')->latest()->get();
        return OrderResource::collection($orders);
    }

    /**
     * Store a newly created order in storage.
     *
     * @param OrderRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(OrderRequest $request)
    {
        $user = $request->user();
        $cart = $user->cart;

        // Check if cart exists and has items
        if (!$cart || $cart->items->isEmpty()) {
            return response()->json([
                'message' => 'Cart is empty'
            ], 400);
        }

        try {
            // Start a database transaction
            DB::beginTransaction();

            // Create the order
            $order = Order::create([
                'user_id' => $user->id,
                'total' => $cart->total(),
                'status' => 'pending',
                'shipping_address' => $request->shipping_address,
                'billing_address' => $request->billing_address ?? $request->shipping_address,
                'payment_method' => $request->payment_method,
                'payment_details' => $request->payment_details ?? 'N/A',
            ]);

            // Create order items and update product stock
            foreach ($cart->items as $cartItem) {
                $product = Product::findOrFail($cartItem->product_id);

                // Check if the product is still in stock
                if ($product->inventory_count < $cartItem->quantity) {
                    throw new \Exception("Not enough stock available for {$product->name}");
                }

                // Create order item
                $order->items()->create([
                    'product_id' => $cartItem->product_id,
                    'quantity' => $cartItem->quantity,
                    'price' => $cartItem->price,
                ]);

                // Update product stock
                $product->update([
                    'inventory_count' => $product->inventory_count - $cartItem->quantity
                ]);
            }

            // Clear the cart
            $cart->items()->delete();

            // Commit the transaction
            DB::commit();

            return response()->json([
                'message' => 'Order created successfully',
                'order' => new OrderResource($order->load('items.product'))
            ], 201);
        } catch (\Exception $e) {
            // Rollback the transaction in case of an error
            DB::rollBack();

            return response()->json([
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Display the specified order.
     *
     * @param Request $request
     * @param Order $order
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Request $request, Order $order)
    {
        // Ensure the order belongs to the authenticated user
        if ($order->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized action'
            ], 403);
        }

        return response()->json([
            'order' => new OrderResource($order->load('items.product'))
        ]);
    }

    /**
     * Update the specified order status (admin only).
     *
     * @param Request $request
     * @param Order $order
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateStatus(Request $request, Order $order)
    {
        $request->validate([
            'status' => 'required|string|in:pending,processing,shipped,delivered,cancelled'
        ]);

        $order->update([
            'status' => $request->status
        ]);

        return response()->json([
            'message' => 'Order status updated successfully',
            'order' => new OrderResource($order->load('items.product'))
        ]);
    }

    /**
     * Cancel an order (if it's still pending).
     *
     * @param Request $request
     * @param Order $order
     * @return \Illuminate\Http\JsonResponse
     */
    public function cancel(Request $request, Order $order)
    {
        // Ensure the order belongs to the authenticated user
        if ($order->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized action'
            ], 403);
        }

        // Only allow cancellation of pending orders
        if ($order->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending orders can be cancelled'
            ], 400);
        }

        try {
            // Start a database transaction
            DB::beginTransaction();

            // Update order status
            $order->update([
                'status' => 'cancelled'
            ]);

                // Restore product stock
                foreach ($order->items as $orderItem) {
                    $product = Product::findOrFail($orderItem->product_id);
                    $product->update([
                        'inventory_count' => $product->inventory_count + $orderItem->quantity
                    ]);
                }            // Commit the transaction
            DB::commit();

            return response()->json([
                'message' => 'Order cancelled successfully',
                'order' => new OrderResource($order->fresh()->load('items.product'))
            ]);
        } catch (\Exception $e) {
            // Rollback the transaction in case of an error
            DB::rollBack();

            return response()->json([
                'message' => $e->getMessage()
            ], 400);
        }
    }
}

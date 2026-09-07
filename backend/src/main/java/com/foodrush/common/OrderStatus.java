package com.foodrush.common;

/**
 * Single shared order status system — must match the frontend exactly.
 */
public enum OrderStatus {
    PENDING_PAYMENT,
    PAID,
    RESTAURANT_ACCEPTED,
    PREPARING,
    READY_FOR_PICKUP,
    RIDER_ASSIGNED,
    PICKED_UP,
    OUT_FOR_DELIVERY,
    DELIVERED,
    CANCELLED,
    REFUNDED
}

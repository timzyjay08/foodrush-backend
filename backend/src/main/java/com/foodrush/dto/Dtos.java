package com.foodrush.dto;

import jakarta.validation.constraints.*;
import com.foodrush.common.Role;
import com.foodrush.entity.User;

import java.time.Instant;
import java.util.List;

/**
 * Request/response DTOs (nested records kept in one place for readability).
 */
public final class Dtos {

    private Dtos() {}

    // ---- Auth ----
    public record RegisterRequest(
            @NotBlank @Size(min = 2, max = 100) String name,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 8, max = 128) String password,
            String phone,
            String role) {}

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password) {}

        public record UserResponse(
                        Long id,
                        String name,
                        String email,
                        String phone,
                        Role role,
                        boolean suspended,
                        Instant createdAt,
                        Instant updatedAt) {

                public static UserResponse from(User user) {
                        return new UserResponse(
                                        user.getId(),
                                        user.getName(),
                                        user.getEmail(),
                                        user.getPhone(),
                                        user.getRole(),
                                        user.isSuspended(),
                                        user.getCreatedAt(),
                                        user.getUpdatedAt());
                }
        }

    public record UpdateUserRequest(
            @Size(min = 2, max = 100) String name,
            String phone,
            @Size(min = 8, max = 128) String password,
            String role,
            Boolean isSuspended) {}

    // ---- Restaurant / Menu ----
    public record RestaurantRequest(
            @NotBlank @Size(min = 2, max = 150) String name,
            String description,
            @NotBlank String cuisine,
            String imageUrl,
            @NotBlank String address,
            String city,
            String phone,
            Integer deliveryTimeMinutes,
            Boolean isOpen) {}

    public record OptionRequest(
            @NotBlank String name,
            @PositiveOrZero double price) {}

    public record MenuItemRequest(
            @NotBlank String name,
            String description,
            @Positive double price,
            String category,
            String imageUrl,
            Boolean isAvailable,
            List<OptionRequest> options) {}

    // ---- Cart ----
    public record CartItemRequest(
            @NotNull @Positive Long menuItemId,
            @Min(1) @Max(50) Integer quantity,
            List<Long> optionIds,
            String specialInstructions) {}

    public record UpdateCartItemRequest(
            @Min(0) @Max(50) Integer quantity,
            String specialInstructions) {}

    // ---- Orders ----
    public record OrderLineRequest(
            @NotNull @Positive Long menuItemId,
            @Min(1) @Max(50) Integer quantity,
            List<Long> optionIds,
            String specialInstructions) {}

    public record OrderRequest(
            @NotNull @Positive Long restaurantId,
            @NotEmpty List<OrderLineRequest> items,
            @NotBlank String deliveryAddress,
            String note,
            @PositiveOrZero Double deliveryDistanceKm,
            String couponCode,
            String paymentMethod) {}

    public record StatusRequest(@NotBlank String status) {}

    public record AssignRiderRequest(@NotNull @Positive Long riderId) {}

    // ---- Reviews ----
    public record ReviewRequest(
            @Min(1) @Max(5) int rating,
            String comment,
            Long restaurantId,
            Long riderId,
            Long orderId) {}

    // ---- Addresses ----
    public record AddressRequest(
            String label,
            @NotBlank String street,
            @NotBlank String city,
            @NotBlank String state,
            String zip,
            Boolean isDefault) {}

    // ---- Riders ----
    public record RiderUpdateRequest(String vehicle, Boolean isOnline) {}

    // ---- Coupons ----
    public record CouponRequest(
            @NotBlank @Size(min = 3, max = 50) String code,
            @NotBlank String discountType,
            @PositiveOrZero double discountValue,
            Integer maxUses,
            Boolean isActive,
            String expiresAt) {}

    // ---- Payments ----
    public record InitializePaymentRequest(@NotNull @Positive Long orderId) {}
    public record VerifyPaymentRequest(@NotBlank String reference) {}
    public record FavoriteRequest(@NotNull @Positive Long restaurantId) {}
    public record OrderIdRequest(@NotNull @Positive Long orderId) {}
}

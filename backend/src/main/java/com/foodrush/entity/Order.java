package com.foodrush.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.foodrush.common.OrderStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "restaurant_id", nullable = false)
    private Long restaurantId;

    @Column(name = "rider_id")
    private Long riderId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING_PAYMENT;

    @Builder.Default
    private double subtotal = 0;
    @Column(name = "delivery_fee")
    @Builder.Default
    private double deliveryFee = 0;
    @Column(name = "service_fee")
    @Builder.Default
    private double serviceFee = 0;
    @Builder.Default
    private double discount = 0;
    @Builder.Default
    private double total = 0;

    @Column(name = "delivery_address", nullable = false)
    private String deliveryAddress;

    @Column(name = "delivery_distance_km")
    @Builder.Default
    private double deliveryDistanceKm = 0;

    @Column(columnDefinition = "text")
    private String note;

    @Column(name = "payment_method")
    @Builder.Default
    private String paymentMethod = "card";

    @CreationTimestamp
    @Column(name = "created_at")
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @JsonIgnore
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();
}

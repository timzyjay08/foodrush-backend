package com.foodrush.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "coupons")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Builder.Default
    @Column(name = "discount_type", nullable = false)
    private String discountType = "percentage"; // percentage | fixed

    @Column(name = "discount_value", nullable = false)
    private double discountValue;

    @Builder.Default
    @Column(name = "max_uses")
    private int maxUses = 100;

    @Builder.Default
    @Column(name = "times_used")
    private int timesUsed = 0;

    @Builder.Default
    @Column(name = "is_active")
    private boolean active = true;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @CreationTimestamp
    @Column(name = "created_at")
    private Instant createdAt;
}

package com.foodrush.entity;

import com.foodrush.common.RiderStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "delivery_riders")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryRider {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Builder.Default
    @Column(name = "is_online")
    private boolean online = false;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RiderStatus status = RiderStatus.OFFLINE;

    @Builder.Default
    private String vehicle = "Motorcycle";

    @Builder.Default
    @Column(name = "total_deliveries")
    private int totalDeliveries = 0;

    @Builder.Default
    @Column(name = "total_earnings")
    private double totalEarnings = 0;

    @Builder.Default
    @Column(name = "is_approved")
    private boolean approved = true;

    @CreationTimestamp
    @Column(name = "created_at")
    private Instant createdAt;
}

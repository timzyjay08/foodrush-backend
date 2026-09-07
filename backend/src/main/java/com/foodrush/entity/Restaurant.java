package com.foodrush.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "restaurants")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Restaurant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_id")
    private Long ownerId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    @Column(nullable = false)
    private String cuisine;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(nullable = false)
    private String address;

    @Builder.Default
    private String city = "Lagos";

    private String phone;

    @Builder.Default
    private double rating = 0;

    @Builder.Default
    @Column(name = "rating_count")
    private int ratingCount = 0;

    @Builder.Default
    @Column(name = "delivery_fee")
    private double deliveryFee = 500;

    @Builder.Default
    @Column(name = "delivery_time_minutes")
    private int deliveryTimeMinutes = 30;

    @Builder.Default
    @Column(name = "is_open")
    private boolean open = true;

    @Builder.Default
    @Column(name = "is_approved")
    private boolean approved = true;

    @CreationTimestamp
    @Column(name = "created_at")
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MenuItem> menuItems = new ArrayList<>();
}

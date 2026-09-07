package com.foodrush.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "order_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "menu_item_id")
    private Long menuItemId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private double price;

    @Builder.Default
    @Column(nullable = false)
    private int quantity = 1;

    // JSON array of selected options (snapshot at order time).
    @Builder.Default
    @Column(name = "options", columnDefinition = "text")
    private String optionsJson = "[]";

    @Column(name = "special_instructions", columnDefinition = "text")
    private String specialInstructions;
}

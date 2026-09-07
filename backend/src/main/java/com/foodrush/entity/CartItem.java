package com.foodrush.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "cart_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    private Cart cart;

    @Column(name = "menu_item_id", nullable = false)
    private Long menuItemId;

    @Builder.Default
    @Column(nullable = false)
    private int quantity = 1;

    // JSON array of selected options, e.g. [{"name":"Extra Cheese","price":500}]
    @Builder.Default
    @Column(name = "options", columnDefinition = "text")
    private String optionsJson = "[]";

    @Column(name = "special_instructions", columnDefinition = "text")
    private String specialInstructions;
}

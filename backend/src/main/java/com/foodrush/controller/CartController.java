package com.foodrush.controller;

import com.foodrush.common.ApiResponse;
import com.foodrush.dto.Dtos;
import com.foodrush.entity.User;
import com.foodrush.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ApiResponse<Map<String, Object>> get(@AuthenticationPrincipal User user) {
        return ApiResponse.ok(cartService.getCart(user));
    }

    @DeleteMapping
    public ApiResponse<Map<String, Object>> clear(@AuthenticationPrincipal User user) {
        return ApiResponse.ok(cartService.clearCart(user));
    }

    @PostMapping("/items")
    public ApiResponse<Map<String, Object>> add(@AuthenticationPrincipal User user,
                                                @Valid @RequestBody Dtos.CartItemRequest req) {
        return ApiResponse.ok(cartService.addItem(user, req));
    }

    @PatchMapping("/items/{id}")
    public ApiResponse<Map<String, Object>> update(@AuthenticationPrincipal User user, @PathVariable Long id,
                                                   @RequestBody Dtos.UpdateCartItemRequest req) {
        return ApiResponse.ok(cartService.updateItem(user, id, req));
    }

    @DeleteMapping("/items/{id}")
    public ApiResponse<Map<String, Object>> remove(@AuthenticationPrincipal User user, @PathVariable Long id) {
        return ApiResponse.ok(cartService.removeItem(user, id));
    }
}

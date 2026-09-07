package com.foodrush.controller;

import com.foodrush.common.ApiResponse;
import com.foodrush.dto.Dtos;
import com.foodrush.entity.Delivery;
import com.foodrush.entity.Order;
import com.foodrush.entity.User;
import com.foodrush.service.DeliveryService;
import com.foodrush.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final DeliveryService deliveryService;

    @GetMapping
    public ApiResponse<List<Order>> list(@AuthenticationPrincipal User user,
                                         @RequestParam(required = false) String status) {
        return ApiResponse.ok(orderService.list(user, status));
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> create(@AuthenticationPrincipal User user,
                                                   @Valid @RequestBody Dtos.OrderRequest req) {
        return ApiResponse.ok(orderService.createOrder(user, req));
    }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> get(@AuthenticationPrincipal User user, @PathVariable Long id) {
        return ApiResponse.ok(orderService.get(user, id));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<Order> updateStatus(@AuthenticationPrincipal User user, @PathVariable Long id,
                                           @Valid @RequestBody Dtos.StatusRequest req) {
        return ApiResponse.ok(orderService.updateStatus(user, id, req.status()));
    }

    @PatchMapping("/{id}/cancel")
    public ApiResponse<Order> cancel(@AuthenticationPrincipal User user, @PathVariable Long id) {
        return ApiResponse.ok(orderService.cancel(user, id));
    }

    @PostMapping("/{id}/assign")
    public ApiResponse<Delivery> assign(@AuthenticationPrincipal User user, @PathVariable Long id,
                                        @Valid @RequestBody Dtos.AssignRiderRequest req) {
        return ApiResponse.ok(deliveryService.assign(user, id, req.riderId()));
    }
}

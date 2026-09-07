package com.foodrush.controller;

import com.foodrush.common.ApiResponse;
import com.foodrush.dto.Dtos;
import com.foodrush.entity.Delivery;
import com.foodrush.entity.User;
import com.foodrush.service.DeliveryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/deliveries")
@RequiredArgsConstructor
public class DeliveryController {

    private final DeliveryService deliveryService;

    @GetMapping
    public ApiResponse<Object> list(@AuthenticationPrincipal User user,
                                    @RequestParam(defaultValue = "false") boolean available) {
        return ApiResponse.ok(deliveryService.list(user, available));
    }

    @PostMapping
    public ApiResponse<Delivery> accept(@AuthenticationPrincipal User user,
                                        @Valid @RequestBody Dtos.OrderIdRequest req) {
        return ApiResponse.ok(deliveryService.accept(user, req.orderId()));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<Map<String, Object>> updateStatus(@AuthenticationPrincipal User user, @PathVariable Long id,
                                                         @Valid @RequestBody Dtos.StatusRequest req) {
        return ApiResponse.ok(deliveryService.updateStatus(user, id, req.status()));
    }
}

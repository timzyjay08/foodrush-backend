package com.foodrush.controller;

import com.foodrush.common.ApiResponse;
import com.foodrush.dto.Dtos;
import com.foodrush.entity.User;
import com.foodrush.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/initialize")
    public ApiResponse<Map<String, Object>> initialize(@AuthenticationPrincipal User user,
                                                       @Valid @RequestBody Dtos.InitializePaymentRequest req) {
        return ApiResponse.ok(paymentService.initialize(user, req.orderId()));
    }

    @PostMapping("/verify")
    public ApiResponse<Map<String, Object>> verify(@AuthenticationPrincipal User user,
                                                   @Valid @RequestBody Dtos.VerifyPaymentRequest req) {
        return ApiResponse.ok(paymentService.verify(user, req.reference()));
    }

    @PostMapping("/webhook")
    public ApiResponse<Map<String, Object>> webhook(
            @RequestHeader(value = "x-paystack-signature", required = false) String signature,
            @RequestBody(required = false) String rawBody) {
        return ApiResponse.ok(paymentService.webhook(signature, rawBody == null ? "" : rawBody));
    }
}

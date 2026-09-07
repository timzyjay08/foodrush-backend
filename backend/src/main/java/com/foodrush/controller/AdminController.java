package com.foodrush.controller;

import com.foodrush.common.ApiException;
import com.foodrush.common.ApiResponse;
import com.foodrush.dto.Dtos;
import com.foodrush.entity.Coupon;
import com.foodrush.repository.CouponRepository;
import com.foodrush.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final CouponRepository couponRepository;

    @GetMapping("/analytics")
    public ApiResponse<Map<String, Object>> analytics() {
        return ApiResponse.ok(adminService.analytics());
    }

    @GetMapping("/coupons")
    public ApiResponse<List<Coupon>> coupons() {
        return ApiResponse.ok(couponRepository.findAll());
    }

    @PostMapping("/coupons")
    public ApiResponse<Coupon> createCoupon(@Valid @RequestBody Dtos.CouponRequest req) {
        String code = req.code().trim().toUpperCase();
        if (couponRepository.findByCode(code).isPresent()) {
            throw ApiException.conflict("A coupon with this code already exists", "CODE_TAKEN");
        }
        Coupon coupon = Coupon.builder()
                .code(code)
                .discountType(req.discountType().trim().toLowerCase())
                .discountValue(req.discountValue())
                .maxUses(req.maxUses() == null ? 100 : req.maxUses())
                .active(req.isActive() == null || req.isActive())
                .build();
        if (req.expiresAt() != null && !req.expiresAt().isBlank()) {
            coupon.setExpiresAt(Instant.parse(req.expiresAt()));
        }
        return ApiResponse.ok(couponRepository.save(coupon));
    }
}

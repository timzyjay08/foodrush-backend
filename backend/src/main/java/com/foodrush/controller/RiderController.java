package com.foodrush.controller;

import com.foodrush.common.ApiException;
import com.foodrush.common.ApiResponse;
import com.foodrush.dto.Dtos;
import com.foodrush.entity.DeliveryRider;
import com.foodrush.entity.User;
import com.foodrush.service.RiderService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/riders")
@RequiredArgsConstructor
public class RiderController {

    private final RiderService riderService;

    @GetMapping("/me")
    public ApiResponse<Map<String, Object>> me(@AuthenticationPrincipal User user) {
        requireRider(user);
        return ApiResponse.ok(riderService.getProfile(user));
    }

    @PatchMapping("/me")
    public ApiResponse<DeliveryRider> update(@AuthenticationPrincipal User user,
                                             @RequestBody Dtos.RiderUpdateRequest req) {
        requireRider(user);
        return ApiResponse.ok(riderService.updateProfile(user, req));
    }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> list(@AuthenticationPrincipal User user) {
        if (user.getRole() != com.foodrush.common.Role.ADMIN && user.getRole() != com.foodrush.common.Role.RESTAURANT) {
            throw ApiException.forbidden("Not authorized", "FORBIDDEN");
        }
        return ApiResponse.ok(riderService.list());
    }

    private void requireRider(User user) {
        if (user.getRole() != com.foodrush.common.Role.RIDER) {
            throw ApiException.forbidden("Not a rider", "FORBIDDEN");
        }
    }
}

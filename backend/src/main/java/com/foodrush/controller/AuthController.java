package com.foodrush.controller;

import com.foodrush.common.ApiException;
import com.foodrush.common.ApiResponse;
import com.foodrush.dto.Dtos;
import com.foodrush.entity.User;
import com.foodrush.security.JwtAuthFilter;
import com.foodrush.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ApiResponse<Map<String, Object>> register(@Valid @RequestBody Dtos.RegisterRequest req) {
        return ApiResponse.ok(authService.register(req));
    }

    @PostMapping("/login")
    public ApiResponse<Map<String, Object>> login(@Valid @RequestBody Dtos.LoginRequest req) {
        return ApiResponse.ok(authService.login(req));
    }

    @GetMapping("/me")
    public ApiResponse<Dtos.UserResponse> me() {
        User user = JwtAuthFilter.currentUser();
        if (user == null) {
            throw ApiException.unauthorized("Authentication required", "UNAUTHORIZED");
        }
        return ApiResponse.ok(Dtos.UserResponse.from(user));
    }
}

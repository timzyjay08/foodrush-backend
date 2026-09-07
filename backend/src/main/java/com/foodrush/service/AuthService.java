package com.foodrush.service;

import com.foodrush.common.ApiException;
import com.foodrush.common.Role;
import com.foodrush.dto.Dtos;
import com.foodrush.entity.DeliveryRider;
import com.foodrush.entity.User;
import com.foodrush.repository.DeliveryRiderRepository;
import com.foodrush.repository.UserRepository;
import com.foodrush.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final DeliveryRiderRepository riderRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public Map<String, Object> register(Dtos.RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw ApiException.conflict("An account with this email already exists", "EMAIL_TAKEN");
        }

        Role role = Role.CUSTOMER;
        if (req.role() != null && !req.role().isBlank()) {
            try {
                role = Role.valueOf(req.role().trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw ApiException.badRequest("Invalid role", "INVALID_ROLE");
            }
            if (role == Role.ADMIN) {
                throw ApiException.forbidden("Admin accounts cannot be self-registered", "FORBIDDEN");
            }
        }

        User user = userRepository.save(User.builder()
                .name(req.name().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(req.password()))
                .phone(req.phone())
                .role(role)
                .build());

        if (role == Role.RIDER) {
            riderRepository.save(DeliveryRider.builder().userId(user.getId()).build());
        }

        return Map.of("user", Dtos.UserResponse.from(user), "token", jwtService.generateToken(user));
    }

    public Map<String, Object> login(Dtos.LoginRequest req) {
        User user = userRepository.findByEmail(req.email().trim().toLowerCase())
                .orElseThrow(() -> ApiException.unauthorized("Invalid email or password", "INVALID_CREDENTIALS"));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
        }
        if (user.isSuspended()) {
            throw ApiException.forbidden("Your account has been suspended. Please contact support.", "ACCOUNT_SUSPENDED");
        }

        return Map.of("user", Dtos.UserResponse.from(user), "token", jwtService.generateToken(user));
    }
}

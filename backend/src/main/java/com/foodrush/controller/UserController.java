package com.foodrush.controller;

import com.foodrush.common.ApiException;
import com.foodrush.common.ApiResponse;
import com.foodrush.common.Role;
import com.foodrush.dto.Dtos;
import com.foodrush.entity.User;
import com.foodrush.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ApiResponse<List<Dtos.UserResponse>> list(@AuthenticationPrincipal User user) {
        if (user.getRole() != Role.ADMIN) {
            throw ApiException.forbidden("Only admins can list users", "FORBIDDEN");
        }
        return ApiResponse.ok(userService.list());
    }

    @PatchMapping("/{id}")
    public ApiResponse<Dtos.UserResponse> update(@AuthenticationPrincipal User actor, @PathVariable Long id,
                                    @Valid @RequestBody Dtos.UpdateUserRequest req) {
        return ApiResponse.ok(userService.update(actor, id, req));
    }
}

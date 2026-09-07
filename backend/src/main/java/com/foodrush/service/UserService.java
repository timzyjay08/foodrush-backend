package com.foodrush.service;

import com.foodrush.common.ApiException;
import com.foodrush.common.Role;
import com.foodrush.dto.Dtos;
import com.foodrush.entity.User;
import com.foodrush.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<Dtos.UserResponse> list() {
        return userRepository.findAll().stream()
                .map(Dtos.UserResponse::from)
                .toList();
    }

    @Transactional
    public Dtos.UserResponse update(User actor, Long id, Dtos.UpdateUserRequest req) {
        boolean self = actor.getId().equals(id);
        if (!self && actor.getRole() != Role.ADMIN) {
            throw ApiException.forbidden("Only admins can modify other users", "FORBIDDEN");
        }

        User target = userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("User not found", "NOT_FOUND"));

        if (req.name() != null) target.setName(req.name().trim());
        if (req.phone() != null) target.setPhone(req.phone());
        if (req.password() != null) target.setPasswordHash(passwordEncoder.encode(req.password()));

        if (req.role() != null && !req.role().isBlank()) {
            if (actor.getRole() != Role.ADMIN) {
                throw ApiException.forbidden("Only admins can change a user role", "FORBIDDEN");
            }
            try {
                target.setRole(Role.valueOf(req.role().trim().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw ApiException.badRequest("Invalid role", "INVALID_ROLE");
            }
        }

        if (req.isSuspended() != null) {
            if (actor.getRole() != Role.ADMIN) {
                throw ApiException.forbidden("Only admins can suspend or unsuspend accounts", "FORBIDDEN");
            }
            target.setSuspended(req.isSuspended());
        }

        return Dtos.UserResponse.from(userRepository.save(target));
    }
}

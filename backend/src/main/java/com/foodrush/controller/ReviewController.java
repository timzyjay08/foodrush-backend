package com.foodrush.controller;

import com.foodrush.common.ApiResponse;
import com.foodrush.dto.Dtos;
import com.foodrush.entity.Review;
import com.foodrush.entity.User;
import com.foodrush.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> list(
            @RequestParam(required = false) Long restaurantId,
            @RequestParam(required = false) Long riderId) {
        return ApiResponse.ok(reviewService.list(restaurantId, riderId));
    }

    @PostMapping
    public ApiResponse<Review> create(@AuthenticationPrincipal User user,
                                      @Valid @RequestBody Dtos.ReviewRequest req) {
        return ApiResponse.ok(reviewService.create(user, req));
    }
}

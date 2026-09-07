package com.foodrush.service;

import com.foodrush.common.ApiException;
import com.foodrush.dto.Dtos;
import com.foodrush.entity.Review;
import com.foodrush.entity.User;
import com.foodrush.repository.RestaurantRepository;
import com.foodrush.repository.ReviewRepository;
import com.foodrush.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;

    public List<Map<String, Object>> list(Long restaurantId, Long riderId) {
        List<Review> reviews;
        if (restaurantId != null) reviews = reviewRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId);
        else if (riderId != null) reviews = reviewRepository.findByRiderIdOrderByCreatedAtDesc(riderId);
        else reviews = reviewRepository.findAll();

        List<Map<String, Object>> result = new ArrayList<>();
        for (Review r : reviews) {
            User author = userRepository.findById(r.getUserId()).orElse(null);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", r.getId());
            m.put("userId", r.getUserId());
            m.put("restaurantId", r.getRestaurantId());
            m.put("riderId", r.getRiderId());
            m.put("orderId", r.getOrderId());
            m.put("rating", r.getRating());
            m.put("comment", r.getComment());
            m.put("createdAt", r.getCreatedAt());
            m.put("authorName", author == null ? "Anonymous" : author.getName());
            result.add(m);
        }
        return result;
    }

    @Transactional
    public Review create(User actor, Dtos.ReviewRequest req) {
        if (req.restaurantId() == null && req.riderId() == null) {
            throw ApiException.badRequest("A review must target a restaurant or a rider", "MISSING_TARGET");
        }

        Review review = reviewRepository.save(Review.builder()
                .userId(actor.getId())
                .restaurantId(req.restaurantId())
                .riderId(req.riderId())
                .orderId(req.orderId())
                .rating(req.rating())
                .comment(req.comment())
                .build());

        if (req.restaurantId() != null) {
            restaurantRepository.findById(req.restaurantId()).ifPresent(rest -> {
                int newCount = rest.getRatingCount() + 1;
                double newRating = round2((rest.getRating() * rest.getRatingCount() + req.rating()) / newCount);
                rest.setRating(newRating);
                rest.setRatingCount(newCount);
                restaurantRepository.save(rest);
            });
        }
        return review;
    }

    private double round2(double n) {
        return Math.round(n * 100.0) / 100.0;
    }
}

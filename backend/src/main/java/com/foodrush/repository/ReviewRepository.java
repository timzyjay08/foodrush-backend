package com.foodrush.repository;

import com.foodrush.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId);
    List<Review> findByRiderIdOrderByCreatedAtDesc(Long riderId);
    long countByRestaurantId(Long restaurantId);
    long countByRiderId(Long riderId);
}

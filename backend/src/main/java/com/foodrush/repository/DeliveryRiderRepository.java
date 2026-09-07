package com.foodrush.repository;

import com.foodrush.entity.DeliveryRider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DeliveryRiderRepository extends JpaRepository<DeliveryRider, Long> {
    Optional<DeliveryRider> findByUserId(Long userId);
}

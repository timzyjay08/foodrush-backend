package com.foodrush.repository;

import com.foodrush.entity.Delivery;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DeliveryRepository extends JpaRepository<Delivery, Long> {
    List<Delivery> findByRiderIdOrderByCreatedAtDesc(Long riderId);
    Optional<Delivery> findByOrderId(Long orderId);
}

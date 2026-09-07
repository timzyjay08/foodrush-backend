package com.foodrush.repository;

import com.foodrush.common.PaymentStatus;
import com.foodrush.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByReference(String reference);
    Optional<Payment> findByOrderIdAndStatus(Long orderId, PaymentStatus status);
    long countByStatus(PaymentStatus status);
}

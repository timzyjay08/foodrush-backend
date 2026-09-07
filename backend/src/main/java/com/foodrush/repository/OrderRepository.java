package com.foodrush.repository;

import com.foodrush.common.OrderStatus;
import com.foodrush.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Order> findByRiderIdOrderByCreatedAtDesc(Long riderId);
    List<Order> findByRestaurantIdInOrderByCreatedAtDesc(Collection<Long> restaurantIds);
    List<Order> findByStatus(OrderStatus status);
    List<Order> findByStatusAndRiderIdIsNullOrderByCreatedAtDesc(OrderStatus status);
}

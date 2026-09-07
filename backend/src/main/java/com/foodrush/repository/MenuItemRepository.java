package com.foodrush.repository;

import com.foodrush.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByRestaurantIdOrderByCategoryAscNameAsc(Long restaurantId);
    List<MenuItem> findByRestaurantIdIn(List<Long> restaurantIds);
}

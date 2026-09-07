package com.foodrush.repository;

import com.foodrush.entity.FoodItemOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FoodItemOptionRepository extends JpaRepository<FoodItemOption, Long> {
    List<FoodItemOption> findByMenuItemIdIn(List<Long> menuItemIds);
}

package com.foodrush.controller;

import com.foodrush.common.ApiResponse;
import com.foodrush.dto.Dtos;
import com.foodrush.entity.MenuItem;
import com.foodrush.entity.Restaurant;
import com.foodrush.entity.User;
import com.foodrush.service.RestaurantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RestaurantController {

    private final RestaurantService restaurantService;

    @GetMapping("/restaurants")
    public ApiResponse<Map<String, Object>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String cuisine,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String open,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        return ApiResponse.ok(restaurantService.list(q, cuisine, city, open, sort, page, limit));
    }

    @GetMapping("/restaurants/{id}")
    public ApiResponse<Map<String, Object>> get(@PathVariable Long id) {
        return ApiResponse.ok(restaurantService.get(id));
    }

    @PostMapping("/restaurants")
    public ApiResponse<Restaurant> create(@AuthenticationPrincipal User user,
                                          @Valid @RequestBody Dtos.RestaurantRequest req) {
        return ApiResponse.ok(restaurantService.create(user, req));
    }

    @PatchMapping("/restaurants/{id}")
    public ApiResponse<Restaurant> update(@AuthenticationPrincipal User user, @PathVariable Long id,
                                          @RequestBody Dtos.RestaurantRequest req) {
        return ApiResponse.ok(restaurantService.update(user, id, req));
    }

    @DeleteMapping("/restaurants/{id}")
    public ApiResponse<Map<String, Object>> delete(@AuthenticationPrincipal User user, @PathVariable Long id) {
        restaurantService.delete(user, id);
        return ApiResponse.ok(Map.of("deleted", true, "id", id));
    }

    @GetMapping("/restaurants/{id}/menu")
    public ApiResponse<Map<String, Object>> menu(@PathVariable Long id) {
        return ApiResponse.ok(restaurantService.menu(id));
    }

    @PostMapping("/restaurants/{id}/menu")
    public ApiResponse<MenuItem> addMenuItem(@AuthenticationPrincipal User user, @PathVariable Long id,
                                             @Valid @RequestBody Dtos.MenuItemRequest req) {
        return ApiResponse.ok(restaurantService.addMenuItem(user, id, req));
    }

    @PatchMapping("/menu-items/{id}")
    public ApiResponse<MenuItem> updateMenuItem(@AuthenticationPrincipal User user, @PathVariable Long id,
                                                @RequestBody Dtos.MenuItemRequest req) {
        return ApiResponse.ok(restaurantService.updateMenuItem(user, id, req));
    }

    @DeleteMapping("/menu-items/{id}")
    public ApiResponse<Map<String, Object>> deleteMenuItem(@AuthenticationPrincipal User user, @PathVariable Long id) {
        restaurantService.deleteMenuItem(user, id);
        return ApiResponse.ok(Map.of("deleted", true, "id", id));
    }

    @GetMapping("/categories")
    public ApiResponse<Map<String, Object>> categories() {
        return ApiResponse.ok(restaurantService.categories());
    }
}

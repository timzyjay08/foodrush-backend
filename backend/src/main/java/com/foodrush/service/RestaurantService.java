package com.foodrush.service;

import com.foodrush.common.ApiException;
import com.foodrush.common.Role;
import com.foodrush.dto.Dtos;
import com.foodrush.entity.FoodItemOption;
import com.foodrush.entity.MenuItem;
import com.foodrush.entity.Restaurant;
import com.foodrush.entity.User;
import com.foodrush.repository.MenuItemRepository;
import com.foodrush.repository.RestaurantRepository;
import com.foodrush.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private final ReviewRepository reviewRepository;

    public Map<String, Object> list(String q, String cuisine, String city, String open, String sort, int page, int limit) {
        List<Restaurant> items = new ArrayList<>(restaurantRepository.findAll());

        if (q != null && !q.isBlank()) {
            String lower = q.toLowerCase();
            items.removeIf(r -> !r.getName().toLowerCase().contains(lower)
                    && !r.getCuisine().toLowerCase().contains(lower));
        }
        if (cuisine != null && !cuisine.isBlank()) items.removeIf(r -> !r.getCuisine().equals(cuisine));
        if (city != null && !city.isBlank()) items.removeIf(r -> !r.getCity().equalsIgnoreCase(city));
        if (open != null && !open.isBlank()) {
            boolean openFlag = Boolean.parseBoolean(open);
            items.removeIf(r -> r.isOpen() != openFlag);
        }

        String sortKey = sort == null ? "rating" : sort;
        switch (sortKey) {
            case "delivery_time" -> items.sort(Comparator.comparingInt(Restaurant::getDeliveryTimeMinutes));
            case "newest" -> items.sort(Comparator.comparing(Restaurant::getCreatedAt,
                    Comparator.nullsLast(Comparator.reverseOrder())));
            default -> items.sort(Comparator.comparingDouble(Restaurant::getRating).reversed());
        }

        int total = items.size();
        int from = Math.min((page - 1) * limit, total);
        int to = Math.min(from + limit, total);
        List<Restaurant> pageItems = items.subList(from, to);

        return Map.of(
                "items", pageItems,
                "total", total,
                "page", page,
                "limit", limit,
                "pages", (int) Math.ceil((double) total / limit));
    }

    public Map<String, Object> get(Long id) {
        Restaurant r = restaurantRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Restaurant not found", "NOT_FOUND"));
        List<MenuItem> menu = menuItemRepository.findByRestaurantIdOrderByCategoryAscNameAsc(id);
        long reviewCount = reviewRepository.countByRestaurantId(id);
        return Map.of("restaurant", r, "menu", menu, "reviewCount", reviewCount);
    }

    public Restaurant create(User actor, Dtos.RestaurantRequest req) {
        if (actor.getRole() != Role.RESTAURANT && actor.getRole() != Role.ADMIN) {
            throw ApiException.forbidden("Only restaurants or admins can create restaurants", "FORBIDDEN");
        }
        Restaurant r = Restaurant.builder()
                .ownerId(actor.getId())
                .name(req.name().trim())
                .description(req.description())
                .cuisine(req.cuisine().trim())
                .imageUrl(req.imageUrl())
                .address(req.address())
                .city(req.city() == null || req.city().isBlank() ? "Lagos" : req.city())
                .phone(req.phone())
                .deliveryTimeMinutes(req.deliveryTimeMinutes() == null ? 30 : req.deliveryTimeMinutes())
                .open(req.isOpen() == null || req.isOpen())
                .approved(actor.getRole() == Role.ADMIN)
                .build();
        return restaurantRepository.save(r);
    }

    @Transactional
    public Restaurant update(User actor, Long id, Dtos.RestaurantRequest req) {
        Restaurant r = restaurantRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Restaurant not found", "NOT_FOUND"));
        assertOwner(actor, r);

        if (req.name() != null) r.setName(req.name().trim());
        if (req.description() != null) r.setDescription(req.description());
        if (req.cuisine() != null) r.setCuisine(req.cuisine().trim());
        if (req.imageUrl() != null) r.setImageUrl(req.imageUrl());
        if (req.address() != null) r.setAddress(req.address());
        if (req.city() != null) r.setCity(req.city());
        if (req.phone() != null) r.setPhone(req.phone());
        if (req.deliveryTimeMinutes() != null) r.setDeliveryTimeMinutes(req.deliveryTimeMinutes());
        if (req.isOpen() != null) r.setOpen(req.isOpen());

        return restaurantRepository.save(r);
    }

    @Transactional
    public void approve(User actor, Long id, boolean approved) {
        if (actor.getRole() != Role.ADMIN) {
            throw ApiException.forbidden("Only admins can change approval status", "FORBIDDEN");
        }
        Restaurant r = restaurantRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Restaurant not found", "NOT_FOUND"));
        r.setApproved(approved);
        restaurantRepository.save(r);
    }

    public void delete(User actor, Long id) {
        Restaurant r = restaurantRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Restaurant not found", "NOT_FOUND"));
        assertOwner(actor, r);
        restaurantRepository.delete(r);
    }

    // ---- Menu items ----

    @Transactional
    public MenuItem addMenuItem(User actor, Long restaurantId, Dtos.MenuItemRequest req) {
        Restaurant r = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> ApiException.notFound("Restaurant not found", "NOT_FOUND"));
        assertOwner(actor, r);

        MenuItem item = MenuItem.builder()
                .restaurant(r)
                .name(req.name().trim())
                .description(req.description())
                .price(req.price())
                .category(req.category())
                .imageUrl(req.imageUrl())
                .available(req.isAvailable() == null || req.isAvailable())
                .build();

        if (req.options() != null) {
            for (Dtos.OptionRequest o : req.options()) {
                item.getOptions().add(FoodItemOption.builder()
                        .menuItem(item).name(o.name().trim()).price(o.price()).build());
            }
        }
        return menuItemRepository.save(item);
    }

    @Transactional
    public MenuItem updateMenuItem(User actor, Long itemId, Dtos.MenuItemRequest req) {
        MenuItem item = menuItemRepository.findById(itemId)
                .orElseThrow(() -> ApiException.notFound("Menu item not found", "NOT_FOUND"));
        assertOwner(actor, item.getRestaurant());

        if (req.name() != null) item.setName(req.name().trim());
        if (req.description() != null) item.setDescription(req.description());
        if (req.price() != 0) item.setPrice(req.price());
        if (req.category() != null) item.setCategory(req.category());
        if (req.imageUrl() != null) item.setImageUrl(req.imageUrl());
        if (req.isAvailable() != null) item.setAvailable(req.isAvailable());

        if (req.options() != null) {
            item.getOptions().clear();
            for (Dtos.OptionRequest o : req.options()) {
                item.getOptions().add(FoodItemOption.builder()
                        .menuItem(item).name(o.name().trim()).price(o.price()).build());
            }
        }
        return menuItemRepository.save(item);
    }

    public void deleteMenuItem(User actor, Long itemId) {
        MenuItem item = menuItemRepository.findById(itemId)
                .orElseThrow(() -> ApiException.notFound("Menu item not found", "NOT_FOUND"));
        assertOwner(actor, item.getRestaurant());
        menuItemRepository.delete(item);
    }

    public Map<String, Object> menu(Long id) {
        restaurantRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Restaurant not found", "NOT_FOUND"));
        return Map.of("restaurantId", id, "items",
                menuItemRepository.findByRestaurantIdOrderByCategoryAscNameAsc(id));
    }

    public Map<String, Object> categories() {
        Map<String, Long> counts = new HashMap<>();
        for (MenuItem m : menuItemRepository.findAll()) {
            if (m.getCategory() != null && !m.getCategory().isBlank()) {
                counts.merge(m.getCategory(), 1L, Long::sum);
            }
        }
        List<Map<String, Object>> list = new ArrayList<>();
        counts.forEach((name, n) -> list.add(Map.of("name", name, "itemCount", n)));
        list.sort((a, b) -> Long.compare((Long) b.get("itemCount"), (Long) a.get("itemCount")));
        return Map.of("categories", list);
    }

    private void assertOwner(User actor, Restaurant r) {
        if (actor.getRole() == Role.ADMIN) return;
        if (r.getOwnerId() == null || !r.getOwnerId().equals(actor.getId())) {
            throw ApiException.forbidden("You do not own this restaurant", "FORBIDDEN");
        }
    }
}

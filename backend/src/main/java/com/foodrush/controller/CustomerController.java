package com.foodrush.controller;

import com.foodrush.common.ApiException;
import com.foodrush.common.ApiResponse;
import com.foodrush.dto.Dtos;
import com.foodrush.entity.Address;
import com.foodrush.entity.Favorite;
import com.foodrush.entity.Notification;
import com.foodrush.entity.Restaurant;
import com.foodrush.entity.User;
import com.foodrush.repository.AddressRepository;
import com.foodrush.repository.FavoriteRepository;
import com.foodrush.repository.NotificationRepository;
import com.foodrush.repository.RestaurantRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CustomerController {

    private final AddressRepository addressRepository;
    private final FavoriteRepository favoriteRepository;
    private final NotificationRepository notificationRepository;
    private final RestaurantRepository restaurantRepository;

    // ---- Addresses ----

    @GetMapping("/addresses")
    public ApiResponse<List<Address>> addresses(@AuthenticationPrincipal User user) {
        return ApiResponse.ok(addressRepository.findByUserIdOrderByIdAsc(user.getId()));
    }

    @PostMapping("/addresses")
    @Transactional
    public ApiResponse<Address> addAddress(@AuthenticationPrincipal User user,
                                           @Valid @RequestBody Dtos.AddressRequest req) {
        boolean isDefault = Boolean.TRUE.equals(req.isDefault());
        if (isDefault) {
            addressRepository.findByUserId(user.getId()).forEach(a -> {
                a.setDefault(false);
                addressRepository.save(a);
            });
        }
        Address a = Address.builder()
                .userId(user.getId())
                .label(req.label())
                .street(req.street())
                .city(req.city())
                .state(req.state())
                .zip(req.zip())
                .isDefault(isDefault)
                .build();
        return ApiResponse.ok(addressRepository.save(a));
    }

    @DeleteMapping("/addresses/{id}")
    public ApiResponse<Map<String, Object>> deleteAddress(@AuthenticationPrincipal User user, @PathVariable Long id) {
        Address a = addressRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Address not found", "NOT_FOUND"));
        if (!a.getUserId().equals(user.getId())) {
            throw ApiException.forbidden("You do not own this address", "FORBIDDEN");
        }
        addressRepository.delete(a);
        return ApiResponse.ok(Map.of("deleted", true, "id", id));
    }

    // ---- Favorites ----

    @GetMapping("/favorites")
    public ApiResponse<List<Map<String, Object>>> favorites(@AuthenticationPrincipal User user) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Favorite f : favoriteRepository.findByUserId(user.getId())) {
            Restaurant r = restaurantRepository.findById(f.getRestaurantId()).orElse(null);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", f.getId());
            m.put("restaurantId", f.getRestaurantId());
            m.put("createdAt", f.getCreatedAt());
            m.put("restaurant", r);
            result.add(m);
        }
        return ApiResponse.ok(result);
    }

    @PostMapping("/favorites")
    public ApiResponse<Favorite> addFavorite(@AuthenticationPrincipal User user,
                                             @Valid @RequestBody Dtos.FavoriteRequest req) {
        if (restaurantRepository.findById(req.restaurantId()).isEmpty()) {
            throw ApiException.notFound("Restaurant not found", "NOT_FOUND");
        }
        Optional<Favorite> existing = favoriteRepository.findByUserIdAndRestaurantId(user.getId(), req.restaurantId());
        if (existing.isPresent()) return ApiResponse.ok(existing.get());

        return ApiResponse.ok(favoriteRepository.save(Favorite.builder()
                .userId(user.getId()).restaurantId(req.restaurantId()).build()));
    }

    @DeleteMapping("/favorites/{restaurantId}")
    public ApiResponse<Map<String, Object>> removeFavorite(@AuthenticationPrincipal User user, @PathVariable Long restaurantId) {
        Favorite f = favoriteRepository.findByUserIdAndRestaurantId(user.getId(), restaurantId)
                .orElseThrow(() -> ApiException.notFound("Favorite not found", "NOT_FOUND"));
        favoriteRepository.delete(f);
        return ApiResponse.ok(Map.of("removed", true, "restaurantId", restaurantId));
    }

    // ---- Notifications ----

    @GetMapping("/notifications")
    public ApiResponse<Map<String, Object>> notifications(@AuthenticationPrincipal User user) {
        List<Notification> list = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        long unread = notificationRepository.countByUserIdAndReadFalse(user.getId());
        return ApiResponse.ok(Map.of("notifications", list, "unreadCount", unread));
    }

    @PatchMapping("/notifications/{id}/read")
    public ApiResponse<Notification> markRead(@AuthenticationPrincipal User user, @PathVariable Long id) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Notification not found", "NOT_FOUND"));
        if (!n.getUserId().equals(user.getId())) {
            throw ApiException.forbidden("You do not own this notification", "FORBIDDEN");
        }
        n.setRead(true);
        return ApiResponse.ok(notificationRepository.save(n));
    }
}

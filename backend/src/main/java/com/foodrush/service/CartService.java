package com.foodrush.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodrush.common.ApiException;
import com.foodrush.dto.Dtos;
import com.foodrush.entity.*;
import com.foodrush.repository.CartRepository;
import com.foodrush.repository.MenuItemRepository;
import com.foodrush.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final MenuItemRepository menuItemRepository;
    private final RestaurantRepository restaurantRepository;
    private final ObjectMapper objectMapper;

    private Cart getOrCreate(Long userId) {
        return cartRepository.findByUserId(userId)
                .orElseGet(() -> cartRepository.save(Cart.builder().userId(userId).build()));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCart(User actor) {
        Cart cart = getOrCreate(actor.getId());
        List<Map<String, Object>> items = new ArrayList<>();
        double subtotal = 0;
        for (CartItem ci : cart.getItems()) {
            MenuItem mi = menuItemRepository.findById(ci.getMenuItemId()).orElse(null);
            double base = mi == null ? 0 : mi.getPrice();
            double optionsTotal = parseOptions(ci.getOptionsJson()).stream()
                    .mapToDouble(o -> ((Number) o.get("price")).doubleValue()).sum();
            double unit = base + optionsTotal;
            subtotal += unit * ci.getQuantity();

            Map<String, Object> line = new LinkedHashMap<>();
            line.put("id", ci.getId());
            line.put("menuItemId", ci.getMenuItemId());
            line.put("quantity", ci.getQuantity());
            line.put("options", parseOptions(ci.getOptionsJson()));
            line.put("specialInstructions", ci.getSpecialInstructions());
            line.put("item", mi);
            items.add(line);
        }
        Restaurant restaurant = cart.getRestaurantId() == null
                ? null : restaurantRepository.findById(cart.getRestaurantId()).orElse(null);

        return Map.of("cart", cart, "items", items, "subtotal", round2(subtotal), "restaurant", restaurant);
    }

    @Transactional
    public Map<String, Object> addItem(User actor, Dtos.CartItemRequest req) {
        MenuItem item = menuItemRepository.findById(req.menuItemId())
                .orElseThrow(() -> ApiException.notFound("Menu item not found", "NOT_FOUND"));
        if (!item.isAvailable()) {
            throw ApiException.conflict("\"" + item.getName() + "\" is currently unavailable", "ITEM_UNAVAILABLE");
        }

        Cart cart = getOrCreate(actor.getId());
        Long itemRestaurantId = item.getRestaurant().getId();

        // Single restaurant per cart.
        if (cart.getRestaurantId() != null && !cart.getRestaurantId().equals(itemRestaurantId)) {
            cart.getItems().clear();
        }

        List<FoodItemOption> selected = resolveOptions(item, req.optionIds());
        String optionsJson = serializeOptions(selected);
        int qty = req.quantity() == null ? 1 : req.quantity();

        Optional<CartItem> existing = cart.getItems().stream()
                .filter(ci -> ci.getMenuItemId().equals(item.getId()) && ci.getOptionsJson().equals(optionsJson))
                .findFirst();

        if (existing.isPresent()) {
            CartItem ci = existing.get();
            ci.setQuantity(ci.getQuantity() + qty);
            if (req.specialInstructions() != null) ci.setSpecialInstructions(req.specialInstructions());
        } else {
            cart.getItems().add(CartItem.builder()
                    .cart(cart)
                    .menuItemId(item.getId())
                    .quantity(qty)
                    .optionsJson(optionsJson)
                    .specialInstructions(req.specialInstructions())
                    .build());
        }

        cart.setRestaurantId(itemRestaurantId);
        cartRepository.save(cart);
        return getCart(actor);
    }

    @Transactional
    public Map<String, Object> updateItem(User actor, Long itemId, Dtos.UpdateCartItemRequest req) {
        Cart cart = getOrCreate(actor.getId());
        CartItem ci = findItem(cart, itemId);

        if (req.quantity() != null) {
            if (req.quantity() == 0) {
                cart.getItems().remove(ci);
            } else {
                ci.setQuantity(req.quantity());
            }
        }
        if (req.specialInstructions() != null) ci.setSpecialInstructions(req.specialInstructions());
        cartRepository.save(cart);
        return getCart(actor);
    }

    @Transactional
    public Map<String, Object> removeItem(User actor, Long itemId) {
        Cart cart = getOrCreate(actor.getId());
        CartItem ci = findItem(cart, itemId);
        cart.getItems().remove(ci);
        cartRepository.save(cart);
        return getCart(actor);
    }

    @Transactional
    public Map<String, Object> clearCart(User actor) {
        Cart cart = getOrCreate(actor.getId());
        cart.getItems().clear();
        cart.setRestaurantId(null);
        cartRepository.save(cart);
        return getCart(actor);
    }

    private CartItem findItem(Cart cart, Long itemId) {
        return cart.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> ApiException.notFound("Cart item not found", "NOT_FOUND"));
    }

    private List<FoodItemOption> resolveOptions(MenuItem item, List<Long> optionIds) {
        if (optionIds == null || optionIds.isEmpty()) return List.of();
        Set<Long> ids = new HashSet<>(optionIds);
        return item.getOptions().stream().filter(o -> ids.contains(o.getId())).toList();
    }

    private String serializeOptions(List<FoodItemOption> options) {
        List<Map<String, Object>> list = options.stream()
                .map(o -> Map.<String, Object>of("name", o.getName(), "price", o.getPrice()))
                .toList();
        try {
            return objectMapper.writeValueAsString(list);
        } catch (Exception e) {
            return "[]";
        }
    }

    private List<Map<String, Object>> parseOptions(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private double round2(double n) {
        return Math.round(n * 100.0) / 100.0;
    }
}

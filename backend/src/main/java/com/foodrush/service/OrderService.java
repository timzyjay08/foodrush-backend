package com.foodrush.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodrush.common.ApiException;
import com.foodrush.common.OrderStatus;
import com.foodrush.common.Role;
import com.foodrush.dto.Dtos;
import com.foodrush.entity.*;
import com.foodrush.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

import static java.util.Map.entry;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private final CouponRepository couponRepository;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @Value("${app.delivery.base-fee}")
    private double baseFee;

    @Value("${app.delivery.rate-per-km}")
    private double ratePerKm;

    @Value("${app.delivery.service-fee-percent}")
    private double serviceFeePercent;

    private static final Map<OrderStatus, List<OrderStatus>> TRANSITIONS = Map.ofEntries(
            entry(OrderStatus.PENDING_PAYMENT, List.of(OrderStatus.PAID, OrderStatus.CANCELLED)),
            entry(OrderStatus.PAID, List.of(OrderStatus.RESTAURANT_ACCEPTED, OrderStatus.CANCELLED)),
            entry(OrderStatus.RESTAURANT_ACCEPTED, List.of(OrderStatus.PREPARING, OrderStatus.CANCELLED)),
            entry(OrderStatus.PREPARING, List.of(OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELLED)),
            entry(OrderStatus.READY_FOR_PICKUP, List.of(OrderStatus.RIDER_ASSIGNED, OrderStatus.CANCELLED)),
            entry(OrderStatus.RIDER_ASSIGNED, List.of(OrderStatus.PICKED_UP, OrderStatus.CANCELLED)),
            entry(OrderStatus.PICKED_UP, List.of(OrderStatus.OUT_FOR_DELIVERY)),
            entry(OrderStatus.OUT_FOR_DELIVERY, List.of(OrderStatus.DELIVERED)),
            entry(OrderStatus.DELIVERED, List.of()),
            entry(OrderStatus.CANCELLED, List.of(OrderStatus.REFUNDED)),
            entry(OrderStatus.REFUNDED, List.of()));

    public List<Order> list(User actor, String status) {
        final OrderStatus filter;
        if (status != null && !status.isBlank()) {
            try {
                filter = OrderStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw ApiException.badRequest("Invalid order status \"" + status + "\"", "INVALID_STATUS");
            }
        } else {
            filter = null;
        }

        List<Order> result;
        switch (actor.getRole()) {
            case ADMIN -> result = orderRepository.findAll();
            case CUSTOMER -> result = orderRepository.findByUserIdOrderByCreatedAtDesc(actor.getId());
            case RIDER -> result = orderRepository.findByRiderIdOrderByCreatedAtDesc(actor.getId());
            case RESTAURANT -> {
                List<Long> ids = restaurantRepository.findByOwnerId(actor.getId())
                        .stream().map(Restaurant::getId).toList();
                result = ids.isEmpty() ? List.of() : orderRepository.findByRestaurantIdInOrderByCreatedAtDesc(ids);
            }
            default -> result = List.of();
        }

        if (filter != null) {
            result = result.stream().filter(o -> o.getStatus() == filter).toList();
        }
        return result.stream().sorted(Comparator.comparing(Order::getCreatedAt,
                Comparator.nullsLast(Comparator.reverseOrder()))).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> get(User actor, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> ApiException.notFound("Order not found", "NOT_FOUND"));
        assertCanView(actor, order);
        return Map.of("order", order, "items", order.getItems());
    }

    @Transactional
    public Map<String, Object> createOrder(User actor, Dtos.OrderRequest req) {
        if (actor.getRole() != Role.CUSTOMER && actor.getRole() != Role.ADMIN) {
            throw ApiException.forbidden("Only customers can place orders", "FORBIDDEN");
        }

        Restaurant restaurant = restaurantRepository.findById(req.restaurantId())
                .orElseThrow(() -> ApiException.notFound("Restaurant not found", "NOT_FOUND"));
        if (!restaurant.isApproved()) throw ApiException.forbidden("This restaurant is not approved", "NOT_APPROVED");
        if (!restaurant.isOpen()) throw ApiException.conflict("This restaurant is currently closed", "RESTAURANT_CLOSED");

        List<MenuItem> menu = menuItemRepository.findByRestaurantIdOrderByCategoryAscNameAsc(restaurant.getId());
        Map<Long, MenuItem> byId = new HashMap<>();
        for (MenuItem m : menu) byId.put(m.getId(), m);

        // Build order lines, resolving options server-side (never trust client prices).
        List<OrderItem> lines = new ArrayList<>();
        double subtotal = 0;
        for (Dtos.OrderLineRequest line : req.items()) {
            MenuItem item = byId.get(line.menuItemId());
            if (item == null) {
                throw ApiException.badRequest("Menu item #" + line.menuItemId() + " does not belong to this restaurant", "INVALID_ITEM");
            }
            if (!item.isAvailable()) {
                throw ApiException.conflict("\"" + item.getName() + "\" is currently unavailable", "ITEM_UNAVAILABLE");
            }
            List<FoodItemOption> selected = resolveOptions(item, line.optionIds());
            double unit = item.getPrice() + selected.stream().mapToDouble(FoodItemOption::getPrice).sum();
            int qty = line.quantity() == null ? 1 : line.quantity();
            subtotal += unit * qty;

            lines.add(OrderItem.builder()
                    .menuItemId(item.getId())
                    .name(item.getName())
                    .price(round2(unit))
                    .quantity(qty)
                    .optionsJson(serializeOptions(selected))
                    .specialInstructions(line.specialInstructions())
                    .build());
        }

        double subtotalRounded = round2(subtotal);
        double distanceKm = req.deliveryDistanceKm() == null ? 3 : req.deliveryDistanceKm();
        double deliveryFee = round2(baseFee + distanceKm * ratePerKm);
        double serviceFee = round2(subtotalRounded * serviceFeePercent);

        // Coupon
        double discount = 0;
        String couponCode = null;
        if (req.couponCode() != null && !req.couponCode().isBlank()) {
            Coupon coupon = couponRepository.findByCode(req.couponCode().trim().toUpperCase())
                    .orElseThrow(() -> ApiException.badRequest("Invalid or expired coupon", "INVALID_COUPON"));
            if (!coupon.isActive() || (coupon.getExpiresAt() != null && coupon.getExpiresAt().isBefore(Instant.now()))
                    || coupon.getTimesUsed() >= coupon.getMaxUses()) {
                throw ApiException.badRequest("Invalid or expired coupon", "INVALID_COUPON");
            }
            discount = "percentage".equalsIgnoreCase(coupon.getDiscountType())
                    ? round2(subtotalRounded * coupon.getDiscountValue() / 100.0)
                    : round2(Math.min(coupon.getDiscountValue(), subtotalRounded));
            discount = round2(Math.min(discount, subtotalRounded + deliveryFee + serviceFee));
            coupon.setTimesUsed(coupon.getTimesUsed() + 1);
            couponRepository.save(coupon);
            couponCode = coupon.getCode();
        }

        double total = round2(subtotalRounded + deliveryFee + serviceFee - discount);

        Order order = Order.builder()
                .userId(actor.getId())
                .restaurantId(restaurant.getId())
                .status(OrderStatus.PENDING_PAYMENT)
                .subtotal(subtotalRounded)
                .deliveryFee(deliveryFee)
                .serviceFee(serviceFee)
                .discount(discount)
                .total(total)
                .deliveryAddress(req.deliveryAddress())
                .deliveryDistanceKm(distanceKm)
                .note(req.note())
                .paymentMethod(req.paymentMethod() == null ? "card" : req.paymentMethod())
                .build();
        for (OrderItem line : lines) {
            line.setOrder(order);
            order.getItems().add(line);
        }

        orderRepository.save(order);
        notificationService.notify(actor.getId(), "Order placed",
                "Order #" + order.getId() + " is awaiting payment.", "order");

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("order", order);
        response.put("items", order.getItems());
        if (couponCode != null) response.put("coupon", Map.of("code", couponCode, "discount", discount));
        return response;
    }

    @Transactional
    public Order updateStatus(User actor, Long orderId, String statusStr) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> ApiException.notFound("Order not found", "NOT_FOUND"));

        OrderStatus next;
        try {
            next = OrderStatus.valueOf(statusStr.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Invalid status", "INVALID_STATUS");
        }

        if (actor.getRole() == Role.RESTAURANT) {
            Restaurant r = restaurantRepository.findById(order.getRestaurantId())
                    .orElseThrow(() -> ApiException.notFound("Restaurant not found", "NOT_FOUND"));
            if (r.getOwnerId() == null || !r.getOwnerId().equals(actor.getId())) {
                throw ApiException.forbidden("You do not own this restaurant", "FORBIDDEN");
            }
        }

        if (!canTransition(actor, order, next)) {
            throw ApiException.conflict("Cannot move order from \"" + order.getStatus() + "\" to \"" + next + "\"", "INVALID_TRANSITION");
        }

        order.setStatus(next);
        orderRepository.save(order);
        notificationService.notify(order.getUserId(), "Order update",
                "Order #" + order.getId() + " is now " + next + ".", "order");
        return order;
    }

    @Transactional
    public Order cancel(User actor, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> ApiException.notFound("Order not found", "NOT_FOUND"));
        boolean owner = actor.getRole() == Role.ADMIN || order.getUserId().equals(actor.getId());
        if (!owner) throw ApiException.forbidden("You cannot cancel this order", "FORBIDDEN");

        if (order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.REFUNDED) {
            throw ApiException.conflict("Order is already cancelled", "ALREADY_CANCELLED");
        }
        List<OrderStatus> nonCancellable = List.of(OrderStatus.PICKED_UP, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED);
        if (nonCancellable.contains(order.getStatus())) {
            throw ApiException.conflict("Order cannot be cancelled while \"" + order.getStatus() + "\"", "INVALID_TRANSITION");
        }

        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
        notificationService.notify(order.getUserId(), "Order cancelled",
                "Order #" + order.getId() + " was cancelled.", "order");
        return order;
    }

    private boolean canTransition(User actor, Order order, OrderStatus next) {
        if (!TRANSITIONS.getOrDefault(order.getStatus(), List.of()).contains(next)) return false;
        if (actor.getRole() == Role.ADMIN) return true;

        return switch (actor.getRole()) {
            case CUSTOMER -> order.getUserId().equals(actor.getId())
                    && (order.getStatus() == OrderStatus.PENDING_PAYMENT || order.getStatus() == OrderStatus.PAID)
                    && next == OrderStatus.CANCELLED;
            case RIDER -> order.getRiderId() != null && order.getRiderId().equals(actor.getId())
                    && (next == OrderStatus.PICKED_UP || next == OrderStatus.OUT_FOR_DELIVERY || next == OrderStatus.DELIVERED);
            case RESTAURANT -> next == OrderStatus.RESTAURANT_ACCEPTED || next == OrderStatus.PREPARING
                    || next == OrderStatus.READY_FOR_PICKUP || next == OrderStatus.CANCELLED;
            default -> false;
        };
    }

    private void assertCanView(User actor, Order order) {
        if (actor.getRole() == Role.ADMIN) return;
        boolean allowed = order.getUserId().equals(actor.getId())
                || (order.getRiderId() != null && order.getRiderId().equals(actor.getId()));
        if (!allowed && actor.getRole() == Role.RESTAURANT) {
            Restaurant r = restaurantRepository.findById(order.getRestaurantId()).orElse(null);
            allowed = r != null && actor.getId().equals(r.getOwnerId());
        }
        if (!allowed) throw ApiException.forbidden("You cannot view this order", "FORBIDDEN");
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

    private double round2(double n) {
        return Math.round(n * 100.0) / 100.0;
    }
}

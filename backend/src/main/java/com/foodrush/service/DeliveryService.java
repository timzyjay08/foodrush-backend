package com.foodrush.service;

import com.foodrush.common.ApiException;
import com.foodrush.common.OrderStatus;
import com.foodrush.common.RiderStatus;
import com.foodrush.common.Role;
import com.foodrush.entity.*;
import com.foodrush.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final OrderRepository orderRepository;
    private final DeliveryRiderRepository riderRepository;
    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public Object list(User actor, boolean available) {
        if (actor.getRole() == Role.ADMIN) return deliveryRepository.findAll();
        if (actor.getRole() != Role.RIDER) {
            throw ApiException.forbidden("Only riders can list deliveries", "FORBIDDEN");
        }
        if (available) {
            List<Order> requests = orderRepository.findByStatusAndRiderIdIsNullOrderByCreatedAtDesc(OrderStatus.READY_FOR_PICKUP);
            List<Map<String, Object>> enriched = new ArrayList<>();
            for (Order o : requests) {
                Restaurant r = restaurantRepository.findById(o.getRestaurantId()).orElse(null);
                enriched.add(Map.of(
                        "order", o,
                        "restaurant", r == null ? null : r.getName(),
                        "pickupAddress", r == null ? null : r.getAddress()));
            }
            return enriched;
        }
        return deliveryRepository.findByRiderIdOrderByCreatedAtDesc(actor.getId());
    }

    @Transactional
    public Delivery accept(User actor, Long orderId) {
        if (actor.getRole() != Role.RIDER) {
            throw ApiException.forbidden("Only riders can accept deliveries", "FORBIDDEN");
        }
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> ApiException.notFound("Order not found", "NOT_FOUND"));
        if (order.getStatus() != OrderStatus.READY_FOR_PICKUP || order.getRiderId() != null) {
            throw ApiException.conflict("This order is not available for pickup", "NOT_AVAILABLE");
        }
        DeliveryRider profile = riderRepository.findByUserId(actor.getId())
                .orElseThrow(() -> ApiException.forbidden("Your rider account is not approved", "NOT_APPROVED"));
        if (!profile.isApproved()) {
            throw ApiException.forbidden("Your rider account is not approved", "NOT_APPROVED");
        }

        Delivery delivery = deliveryRepository.save(Delivery.builder()
                .orderId(orderId)
                .riderId(actor.getId())
                .distanceKm(order.getDeliveryDistanceKm())
                .earnings(round2(order.getDeliveryFee() * 0.8))
                .build());

        order.setRiderId(actor.getId());
        order.setStatus(OrderStatus.RIDER_ASSIGNED);
        orderRepository.save(order);

        profile.setStatus(RiderStatus.ON_DELIVERY);
        riderRepository.save(profile);

        notificationService.notify(order.getUserId(), "Rider assigned",
                "A rider is on the way for order #" + order.getId() + ".", "delivery");
        return delivery;
    }

    @Transactional
    public Map<String, Object> updateStatus(User actor, Long deliveryId, String status) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> ApiException.notFound("Delivery not found", "NOT_FOUND"));
        if (actor.getRole() != Role.ADMIN && !delivery.getRiderId().equals(actor.getId())) {
            throw ApiException.forbidden("You are not assigned to this delivery", "FORBIDDEN");
        }
        Order order = orderRepository.findById(delivery.getOrderId())
                .orElseThrow(() -> ApiException.notFound("Order not found", "NOT_FOUND"));

        OrderStatus next;
        try {
            next = OrderStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Invalid status", "INVALID_STATUS");
        }

        Map<OrderStatus, List<OrderStatus>> validFrom = Map.of(
                OrderStatus.PICKED_UP, List.of(OrderStatus.RIDER_ASSIGNED),
                OrderStatus.OUT_FOR_DELIVERY, List.of(OrderStatus.PICKED_UP),
                OrderStatus.DELIVERED, List.of(OrderStatus.OUT_FOR_DELIVERY));
        if (!validFrom.containsKey(next) || !validFrom.get(next).contains(order.getStatus())) {
            throw ApiException.conflict("Cannot move order from \"" + order.getStatus() + "\" to \"" + next + "\"", "INVALID_TRANSITION");
        }

        if (next == OrderStatus.PICKED_UP) delivery.setPickedUpAt(Instant.now());
        if (next == OrderStatus.DELIVERED) {
            delivery.setDeliveredAt(Instant.now());
            Long riderId = delivery.getRiderId();
            if (riderId != null) {
                riderRepository.findByUserId(riderId).ifPresent(p -> {
                    p.setTotalDeliveries(p.getTotalDeliveries() + 1);
                    p.setTotalEarnings(round2(p.getTotalEarnings() + delivery.getEarnings()));
                    p.setStatus(RiderStatus.AVAILABLE);
                    riderRepository.save(p);
                });
            }
            notificationService.notify(order.getUserId(), "Order delivered",
                    "Order #" + order.getId() + " has been delivered. Enjoy! 🎉", "delivery");
        }

        order.setStatus(next);
        deliveryRepository.save(delivery);
        orderRepository.save(order);
        return Map.of("delivery", delivery, "order", order);
    }

    /** Admin or restaurant owner assigns a rider to a ready order. */
    @Transactional
    public Delivery assign(User actor, Long orderId, Long riderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> ApiException.notFound("Order not found", "NOT_FOUND"));

        if (actor.getRole() != Role.ADMIN) {
            Restaurant r = restaurantRepository.findById(order.getRestaurantId()).orElse(null);
            if (r == null || r.getOwnerId() == null || !r.getOwnerId().equals(actor.getId())) {
                throw ApiException.forbidden("You do not own this restaurant", "FORBIDDEN");
            }
        }
        if (order.getStatus() != OrderStatus.READY_FOR_PICKUP) {
            throw ApiException.conflict("Cannot assign a rider while order is \"" + order.getStatus() + "\"", "INVALID_TRANSITION");
        }

        User rider = userRepository.findById(riderId)
                .orElseThrow(() -> ApiException.badRequest("The assigned user is not a rider", "NOT_A_RIDER"));
        if (rider.getRole() != Role.RIDER) {
            throw ApiException.badRequest("The assigned user is not a rider", "NOT_A_RIDER");
        }
        DeliveryRider profile = riderRepository.findByUserId(riderId)
                .orElseThrow(() -> ApiException.badRequest("This rider is not approved", "NOT_APPROVED"));
        if (!profile.isApproved()) {
            throw ApiException.badRequest("This rider is not approved", "NOT_APPROVED");
        }

        Delivery delivery = deliveryRepository.save(Delivery.builder()
                .orderId(orderId)
                .riderId(riderId)
                .distanceKm(order.getDeliveryDistanceKm())
                .earnings(round2(order.getDeliveryFee() * 0.8))
                .build());
        order.setRiderId(riderId);
        order.setStatus(OrderStatus.RIDER_ASSIGNED);
        orderRepository.save(order);
        profile.setStatus(RiderStatus.ON_DELIVERY);
        riderRepository.save(profile);
        notificationService.notify(riderId, "New delivery", "You are assigned to order #" + orderId + ".", "delivery");
        return delivery;
    }

    private double round2(double n) {
        return Math.round(n * 100.0) / 100.0;
    }
}

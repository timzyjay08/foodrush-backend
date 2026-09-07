package com.foodrush.service;

import com.foodrush.common.OrderStatus;
import com.foodrush.common.PaymentStatus;
import com.foodrush.common.Role;
import com.foodrush.entity.Order;
import com.foodrush.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final DeliveryRiderRepository riderRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;

    public Map<String, Object> analytics() {
        long customers = userRepository.countByRole(Role.CUSTOMER);
        long restaurants = restaurantRepository.count();
        long riders = riderRepository.count();

        List<Order> all = orderRepository.findAll();
        long ordersTotal = all.size();
        long delivered = all.stream().filter(o -> o.getStatus() == OrderStatus.DELIVERED).count();
        long cancelled = all.stream().filter(o -> o.getStatus() == OrderStatus.CANCELLED).count();
        long active = all.stream().filter(o -> !Set.of(OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REFUNDED).contains(o.getStatus())).count();

        Instant startOfDay = Instant.now().truncatedTo(ChronoUnit.DAYS);
        Instant startOfMonth = startOfDay.with(java.time.temporal.ChronoField.DAY_OF_MONTH, 1);

        double revenueToday = all.stream().filter(AdminService::isRevenue)
                .filter(o -> o.getCreatedAt() != null && !o.getCreatedAt().isBefore(startOfDay))
                .mapToDouble(Order::getTotal).sum();
        double monthlyRevenue = all.stream().filter(AdminService::isRevenue)
                .filter(o -> o.getCreatedAt() != null && !o.getCreatedAt().isBefore(startOfMonth))
                .mapToDouble(Order::getTotal).sum();

        Map<String, Long> breakdown = new TreeMap<>();
        for (Order o : all) breakdown.merge(o.getStatus().name(), 1L, Long::sum);

        long paymentFailures = paymentRepository.countByStatus(PaymentStatus.FAILED);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("customers", customers);
        result.put("restaurants", restaurants);
        result.put("riders", riders);
        result.put("ordersTotal", ordersTotal);
        result.put("ordersDelivered", delivered);
        result.put("ordersCancelled", cancelled);
        result.put("activeOrders", active);
        result.put("revenueToday", round2(revenueToday));
        result.put("monthlyRevenue", round2(monthlyRevenue));
        result.put("paymentFailures", paymentFailures);
        result.put("statusBreakdown", breakdown);
        result.put("currency", "NGN");
        return result;
    }

    private static boolean isRevenue(Order o) {
        return o.getStatus() != OrderStatus.CANCELLED
                && o.getStatus() != OrderStatus.REFUNDED
                && o.getStatus() != OrderStatus.PENDING_PAYMENT;
    }

    private double round2(double n) {
        return Math.round(n * 100.0) / 100.0;
    }
}

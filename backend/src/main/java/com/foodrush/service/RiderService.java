package com.foodrush.service;

import com.foodrush.common.ApiException;
import com.foodrush.common.RiderStatus;
import com.foodrush.dto.Dtos;
import com.foodrush.entity.DeliveryRider;
import com.foodrush.entity.Review;
import com.foodrush.entity.User;
import com.foodrush.repository.DeliveryRiderRepository;
import com.foodrush.repository.ReviewRepository;
import com.foodrush.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class RiderService {

    private final DeliveryRiderRepository riderRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;

    public Map<String, Object> getProfile(User actor) {
        DeliveryRider p = riderRepository.findByUserId(actor.getId())
                .orElseThrow(() -> ApiException.notFound("Rider profile not found", "NOT_FOUND"));
        List<Review> reviews = reviewRepository.findByRiderIdOrderByCreatedAtDesc(actor.getId());
        double avg = reviews.isEmpty()
                ? 0 : reviews.stream().mapToInt(Review::getRating).average().orElse(0);

        return Map.of(
                "profile", p,
                "user", Map.of("id", actor.getId(), "name", actor.getName(),
                        "email", actor.getEmail(), "phone", actor.getPhone()),
                "rating", round2(avg),
                "ratingCount", reviews.size());
    }

    @Transactional
    public DeliveryRider updateProfile(User actor, Dtos.RiderUpdateRequest req) {
        DeliveryRider p = riderRepository.findByUserId(actor.getId())
                .orElseThrow(() -> ApiException.notFound("Rider profile not found", "NOT_FOUND"));
        if (req.vehicle() != null) p.setVehicle(req.vehicle());
        if (req.isOnline() != null) {
            p.setOnline(req.isOnline());
            p.setStatus(req.isOnline() ? RiderStatus.AVAILABLE : RiderStatus.OFFLINE);
        }
        return riderRepository.save(p);
    }

    public List<Map<String, Object>> list() {
        List<Map<String, Object>> result = new ArrayList<>();
        for (DeliveryRider r : riderRepository.findAll()) {
            User u = userRepository.findById(r.getUserId()).orElse(null);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", r.getId());
            m.put("userId", r.getUserId());
            m.put("isOnline", r.isOnline());
            m.put("status", r.getStatus());
            m.put("vehicle", r.getVehicle());
            m.put("totalDeliveries", r.getTotalDeliveries());
            m.put("totalEarnings", r.getTotalEarnings());
            m.put("isApproved", r.isApproved());
            m.put("name", u == null ? null : u.getName());
            m.put("email", u == null ? null : u.getEmail());
            m.put("phone", u == null ? null : u.getPhone());
            result.add(m);
        }
        return result;
    }

    private double round2(double n) {
        return Math.round(n * 100.0) / 100.0;
    }
}

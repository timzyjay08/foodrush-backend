package com.foodrush.service;

import com.foodrush.entity.Notification;
import com.foodrush.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public void notify(Long userId, String title, String body, String type) {
        try {
            notificationRepository.save(Notification.builder()
                    .userId(userId)
                    .title(title)
                    .body(body)
                    .type(type)
                    .build());
        } catch (Exception e) {
            // Notification failures must never break the main flow.
            System.err.println("[notify] " + e.getMessage());
        }
    }
}

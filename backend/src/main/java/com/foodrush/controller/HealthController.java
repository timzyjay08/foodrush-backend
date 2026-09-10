package com.foodrush.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public Map<String, Object> liveness() {
        return Map.of("status", "ok", "service", "foodrush-backend");
    }

    @GetMapping("/ready")
    public ResponseEntity<Map<String, Object>> readiness() {
        return ResponseEntity.ok(Map.of("status", "ready", "service", "foodrush-backend"));
    }
}
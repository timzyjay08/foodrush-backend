package com.foodrush.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodrush.common.ApiException;
import com.foodrush.common.OrderStatus;
import com.foodrush.common.PaymentStatus;
import com.foodrush.common.Role;
import com.foodrush.entity.Order;
import com.foodrush.entity.Payment;
import com.foodrush.entity.User;
import com.foodrush.repository.OrderRepository;
import com.foodrush.repository.PaymentRepository;
import com.foodrush.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.paystack.secret-key}")
    private String secretKey;

    @Value("${app.paystack.base-url}")
    private String baseUrl;

    @Value("${app.paystack.simulation-enabled:false}")
    private boolean simulationEnabled;

    private boolean simulated() {
        return simulationEnabled && (secretKey == null || secretKey.isBlank());
    }

    private void requireProviderConfigured() {
        if (!simulated() && (secretKey == null || secretKey.isBlank())) {
            throw ApiException.serviceUnavailable("Payment provider is not configured", "PAYMENT_PROVIDER_UNAVAILABLE");
        }
    }

    @Transactional
    public Map<String, Object> initialize(User actor, Long orderId) {
        requireProviderConfigured();
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> ApiException.notFound("Order not found", "NOT_FOUND"));
        if (!order.getUserId().equals(actor.getId()) && actor.getRole() != Role.ADMIN) {
            throw ApiException.forbidden("You cannot pay for this order", "FORBIDDEN");
        }
        if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw ApiException.conflict("Order cannot be paid while \"" + order.getStatus() + "\"", "INVALID_STATE");
        }

        Payment payment = paymentRepository.findByOrderIdAndStatus(orderId, PaymentStatus.PENDING)
                .orElseGet(() -> paymentRepository.save(Payment.builder()
                        .orderId(orderId)
                        .reference(makeReference())
                        .amount(order.getTotal())
                        .status(PaymentStatus.PENDING)
                        .build()));

        String email = userRepository.findById(order.getUserId()).map(User::getEmail).orElse("");

        String authorizationUrl;
        if (simulated()) {
            authorizationUrl = "/api/payments/verify?reference=" + payment.getReference();
        } else {
            Map<String, Object> payload = Map.of(
                    "email", email,
                    "amount", Math.round(order.getTotal() * 100),
                    "reference", payment.getReference(),
                    "currency", "NGN");
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(secretKey);
            headers.setContentType(MediaType.APPLICATION_JSON);
            try {
                ResponseEntity<Map<String, Object>> res = restTemplate.exchange(
                        baseUrl + "/transaction/initialize", HttpMethod.POST, new HttpEntity<>(payload, headers),
                        new ParameterizedTypeReference<Map<String, Object>>() {});
                Map<?, ?> body = res.getBody();
                if (body == null || !Boolean.TRUE.equals(body.get("status"))) {
                    throw ApiException.badRequest("Payment provider error", "PROVIDER_ERROR");
                }
                authorizationUrl = (String) ((Map<?, ?>) body.get("data")).get("authorization_url");
            } catch (ApiException e) {
                throw e;
            } catch (Exception e) {
                throw ApiException.badRequest("Payment provider error: " + e.getMessage(), "PROVIDER_ERROR");
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("payment", payment);
        result.put("order", order);
        result.put("amount", order.getTotal());
        result.put("currency", "NGN");
        result.put("authorizationUrl", authorizationUrl);
        result.put("simulated", simulated());
        return result;
    }

    @Transactional
    public Map<String, Object> verify(User actor, String reference) {
        requireProviderConfigured();
        Payment payment = paymentRepository.findByReference(reference)
                .orElseThrow(() -> ApiException.notFound("Payment not found", "NOT_FOUND"));
        Order order = orderRepository.findById(payment.getOrderId())
                .orElseThrow(() -> ApiException.notFound("Order not found", "NOT_FOUND"));

        if (!order.getUserId().equals(actor.getId()) && actor.getRole() != Role.ADMIN) {
            throw ApiException.forbidden("You cannot verify this payment", "FORBIDDEN");
        }
        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            return Map.of("payment", payment, "order", order, "alreadyPaid", true);
        }

        boolean verified;
        if (simulated()) {
            verified = true;
        } else {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(secretKey);
            try {
                ResponseEntity<Map<String, Object>> res = restTemplate.exchange(
                        baseUrl + "/transaction/verify/" + reference, HttpMethod.GET, new HttpEntity<>(headers),
                        new ParameterizedTypeReference<Map<String, Object>>() {});
                Map<?, ?> body = res.getBody();
                Map<?, ?> data = body == null ? null : (Map<?, ?>) body.get("data");
                verified = data != null && "success".equals(data.get("status"));
            } catch (Exception e) {
                verified = false;
            }
        }

        if (!verified) {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            throw ApiException.badRequest("Payment verification failed", "PAYMENT_FAILED");
        }

        payment.setStatus(PaymentStatus.SUCCESS);
        paymentRepository.save(payment);
        Order updated = markPaid(order);
        return Map.of("payment", payment, "order", updated, "paid", true);
    }

    @Transactional
    public Map<String, Object> webhook(String signature, String rawBody) {
        requireProviderConfigured();
        // Verify the Paystack signature when a key is configured.
        if (!simulated() && (signature == null || !signature.equals(hmacSha512(secretKey, rawBody)))) {
            throw ApiException.unauthorized("Invalid signature", "INVALID_SIGNATURE");
        }

        try {
            Map<String, Object> body = objectMapper.readValue(rawBody, new TypeReference<>() {});
            Object dataObj = body.get("data");
            if (dataObj instanceof Map<?, ?> data) {
                String reference = data.get("reference") == null ? null : data.get("reference").toString();
                String status = data.get("status") == null ? null : data.get("status").toString();
                if (reference != null) {
                    paymentRepository.findByReference(reference).ifPresent(payment -> {
                        if ("success".equals(status) && payment.getStatus() != PaymentStatus.SUCCESS) {
                            payment.setStatus(PaymentStatus.SUCCESS);
                            paymentRepository.save(payment);
                            orderRepository.findById(payment.getOrderId()).ifPresent(this::markPaid);
                        } else if ("failed".equals(status) && payment.getStatus() != PaymentStatus.FAILED) {
                            payment.setStatus(PaymentStatus.FAILED);
                            paymentRepository.save(payment);
                        }
                    });
                }
            }
        } catch (Exception ignored) {
            // Malformed webhook body — acknowledge but do not crash.
        }
        return Map.of("received", true);
    }

    private Order markPaid(Order order) {
        order.setStatus(OrderStatus.PAID);
        orderRepository.save(order);
        notificationService.notify(order.getUserId(), "Payment confirmed",
                "Order #" + order.getId() + " has been paid.", "payment");
        return order;
    }

    private String makeReference() {
        byte[] bytes = new byte[4];
        new SecureRandom().nextBytes(bytes);
        StringBuilder sb = new StringBuilder("FR-").append(System.currentTimeMillis()).append("-");
        for (byte b : bytes) sb.append(String.format("%02X", b));
        return sb.toString();
    }

    private String hmacSha512(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] out = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : out) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }
}

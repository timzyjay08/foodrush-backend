package com.foodrush.common;

import java.util.Map;

/**
 * Consistent API envelope used by every endpoint.
 * Success:  { success: true, data: ... }
 * Error:    { success: false, message: "...", code: "...", details: {...} }
 */
public record ApiResponse<T>(
        boolean success,
        T data,
        String message,
        String code,
        Map<String, String> details
) {
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null, null, null);
    }

    public static <T> ApiResponse<T> error(String message, String code) {
        return new ApiResponse<>(false, null, message, code, null);
    }

    public static <T> ApiResponse<T> validationError(String message, String code, Map<String, String> details) {
        return new ApiResponse<>(false, null, message, code, details);
    }
}

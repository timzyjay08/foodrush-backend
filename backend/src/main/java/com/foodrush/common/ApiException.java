package com.foodrush.common;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    public ApiException(HttpStatus status, String message, String code) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public static ApiException badRequest(String message, String code) {
        return new ApiException(HttpStatus.BAD_REQUEST, message, code);
    }

    public static ApiException unauthorized(String message, String code) {
        return new ApiException(HttpStatus.UNAUTHORIZED, message, code);
    }

    public static ApiException forbidden(String message, String code) {
        return new ApiException(HttpStatus.FORBIDDEN, message, code);
    }

    public static ApiException notFound(String message, String code) {
        return new ApiException(HttpStatus.NOT_FOUND, message, code);
    }

    public static ApiException conflict(String message, String code) {
        return new ApiException(HttpStatus.CONFLICT, message, code);
    }

    public static ApiException serviceUnavailable(String message, String code) {
        return new ApiException(HttpStatus.SERVICE_UNAVAILABLE, message, code);
    }
}

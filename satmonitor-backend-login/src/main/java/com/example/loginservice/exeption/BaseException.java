package com.example.loginservice.exeption;

import lombok.Getter;

import java.util.HashMap;
import java.util.Map;

@Getter
public abstract class BaseException extends RuntimeException {
    private final String errorCode;
    private final Map<String, Object> details;

    public BaseException(String errorCode, String message) {
        this(errorCode, message, null);
    }

    public BaseException(String errorCode, String message, Map<String, Object> details) {
        super(message);
        this.errorCode = errorCode;
        this.details = details != null ? details : new HashMap<>();
    }
}

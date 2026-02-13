package com.example.loginservice.exeption;

import java.util.Map;

public class DuplicateResourceException  extends BaseException {
    public DuplicateResourceException(String errorCode, String message) {
        super(errorCode, message);
    }

    public DuplicateResourceException(String errorCode, String message, Map<String, Object> details) {
        super(errorCode, message, details);
    }
}
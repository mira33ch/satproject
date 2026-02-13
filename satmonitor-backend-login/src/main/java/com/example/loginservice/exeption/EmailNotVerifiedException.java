package com.example.loginservice.exeption;

import java.util.Map;

public class EmailNotVerifiedException extends BaseException {
    public EmailNotVerifiedException(String errorCode, String message) {
        super(errorCode, message);
    }

    public EmailNotVerifiedException(String errorCode, String message, Map<String, Object> details) {
        super(errorCode, message, details);
    }
}
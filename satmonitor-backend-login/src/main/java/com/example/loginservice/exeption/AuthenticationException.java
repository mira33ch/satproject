package com.example.loginservice.exeption;

import java.util.Map;

public class AuthenticationException extends BaseException  {
    public AuthenticationException(String errorCode, String message) {
        super(errorCode, message);
    }

    public AuthenticationException(String errorCode, String message, Map<String, Object> details) {
        super(errorCode, message, details);
    }
}

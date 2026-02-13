package com.example.loginservice.exeption;

public class ResourceNotFoundException  extends BaseException {
    public ResourceNotFoundException(String errorCode, String message) {
        super(errorCode, message);
    }
}

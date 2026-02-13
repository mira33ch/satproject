package com.example.loginservice.dto;

import lombok.*;


@Data
@AllArgsConstructor
public class LoginResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType;
}
package com.example.loginservice.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UnitDTO {
    private Long id;
    private String name;
    private String phone;
    private String country;
    private String address;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

package com.example.loginservice.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserDTO {
    private Long id;
    private String username;
    private String email;
    private String phone;
    private RoleDTO role;
    private UnitDTO unit;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}

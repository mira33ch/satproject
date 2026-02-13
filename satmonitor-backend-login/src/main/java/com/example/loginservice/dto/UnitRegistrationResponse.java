package com.example.loginservice.dto;

import lombok.Data;

@Data
public class UnitRegistrationResponse {
    private UnitDTO unit;
    private UserDTO adminUser;
    private String locale;
}

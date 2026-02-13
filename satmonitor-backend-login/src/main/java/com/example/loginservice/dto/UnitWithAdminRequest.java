package com.example.loginservice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UnitWithAdminRequest {
    @Valid
    @NotNull(message = "Unit data is required")
    private UnitDTO unit;

    @Valid
    @NotNull(message = "Admin user data is required")
    private RegisterRequest adminUser;
}

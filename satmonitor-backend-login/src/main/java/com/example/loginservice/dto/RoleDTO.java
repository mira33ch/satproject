package com.example.loginservice.dto;

import lombok.Data;

@Data
public class RoleDTO {
    private Long id;
    private String label;
    private String reference;
    private String slug;
    private Boolean isUnitAdmin;
}

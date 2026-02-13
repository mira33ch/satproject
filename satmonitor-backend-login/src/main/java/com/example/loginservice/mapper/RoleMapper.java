package com.example.loginservice.mapper;

import com.example.loginservice.dto.RoleDTO;
import com.example.loginservice.entity.Role;
import org.springframework.stereotype.Component;

@Component
public class RoleMapper {
    public RoleDTO toDto(Role role) {
        if (role == null) {
            return null;
        }

        RoleDTO dto = new RoleDTO();
        dto.setId(role.getId());
        dto.setLabel(role.getLabel());
        dto.setReference(role.getReference());
        dto.setSlug(role.getSlug());
        dto.setIsUnitAdmin(role.isUnitAdmin());
        // On ne mappe pas la liste d'utilisateurs

        return dto;
    }

    public Role toEntity(RoleDTO dto) {
        if (dto == null) {
            return null;
        }

        Role role = new Role();
        role.setId(dto.getId());
        role.setLabel(dto.getLabel());
        role.setReference(dto.getReference());
        role.setSlug(dto.getSlug());
        role.setUnitAdmin(dto.getIsUnitAdmin());

        return role;
    }
}

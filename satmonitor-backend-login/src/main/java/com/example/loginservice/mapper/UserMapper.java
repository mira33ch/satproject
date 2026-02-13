package com.example.loginservice.mapper;

import com.example.loginservice.dto.RoleDTO;
import com.example.loginservice.dto.UserDTO;
import com.example.loginservice.entity.User;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@AllArgsConstructor
public class UserMapper {

    private final RoleMapper roleMapper;
    private final UnitMapper unitMapper;

    public UserDTO toDto(User user) {
        if (user == null) {
            return null;
        }

        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setCreatedAt(user.getCreatedAt());

        // Mapper le rôle
        if (user.getRole() != null) {
            dto.setRole(roleMapper.toDto(user.getRole()));
        }

        // Mapper l'unité
        if (user.getUnit() != null) {
            dto.setUnit(unitMapper.toDto(user.getUnit()));
        }

        return dto;
    }

    public User toEntity(UserDTO dto) {
        if (dto == null) {
            return null;
        }

        User user = new User();
        user.setId(dto.getId());
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());

        return user;
    }
}

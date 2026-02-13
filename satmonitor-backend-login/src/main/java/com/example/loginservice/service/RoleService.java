package com.example.loginservice.service;

import com.example.loginservice.entity.Role;
import com.example.loginservice.repository.RoleRepository;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class RoleService {
    private final RoleRepository roleRepository;

    public Role getRoleByReference( String reference) {
        return roleRepository.findByReference(reference).orElse(null);
    }
}

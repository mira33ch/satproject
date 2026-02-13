package com.example.loginservice.mapper;

import com.example.loginservice.dto.UnitDTO;
import com.example.loginservice.entity.Unit;
import org.springframework.stereotype.Component;

@Component
public class UnitMapper {

    public UnitDTO toDto(Unit unit) {
        if (unit == null) {
            return null;
        }

        UnitDTO dto = new UnitDTO();
        dto.setId(unit.getId());
        dto.setName(unit.getName());
        dto.setCountry(unit.getCountry());
        dto.setAddress(unit.getAddress());
        dto.setPhone(unit.getPhone());
        dto.setCreatedAt(unit.getCreatedAt());
        dto.setUpdatedAt(unit.getUpdatedAt());


        return dto;
    }

    public Unit toEntity(UnitDTO dto) {
        if (dto == null) {
            return null;
        }

        Unit unit = new Unit();
        unit.setId(dto.getId()); // Pour les mises à jour
        unit.setName(dto.getName());
        unit.setCountry(dto.getCountry());
        unit.setAddress(dto.getAddress());
        unit.setPhone(dto.getPhone());


        return unit;
    }

}

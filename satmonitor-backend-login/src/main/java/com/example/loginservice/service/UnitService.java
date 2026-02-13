package com.example.loginservice.service;

import com.example.loginservice.dto.*;

import com.example.loginservice.entity.Unit;

import com.example.loginservice.exeption.DuplicateResourceException;
import com.example.loginservice.mapper.UnitMapper;
import com.example.loginservice.repository.UnitRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;


@Service
@AllArgsConstructor
public class UnitService {

    private final UnitRepository unitRepository;
    private final UnitMapper unitMapper;

    // Constantes pour les codes d'erreur
    private static final String ERROR_UNIT_NAME_EXISTS = "REGISTER.NAME_EXISTS";
    private static final String ERROR_UNIT_PHONE_EXISTS = "REGISTER.PHONE_EXISTS";


    @Transactional
    public UnitDTO createUnit(UnitDTO unitDto) {
        // Validation avec exceptions structurées
        if (unitRepository.existsByName(unitDto.getName())) {
            Map<String, Object> details = Map.of(
                    "field", "name",
                    "value", unitDto.getName()
            );
            throw new DuplicateResourceException(
                    ERROR_UNIT_NAME_EXISTS,
                    "Unit name already exists",
                    details
            );
        }

        if (unitDto.getPhone() != null && !unitDto.getPhone().isEmpty()) {
            if (unitRepository.existsByPhone(unitDto.getPhone())) {
                Map<String, Object> details = Map.of(
                        "field", "phone",
                        "value", unitDto.getPhone()
                );
                throw new DuplicateResourceException(
                        ERROR_UNIT_PHONE_EXISTS,
                        "Phone number already in use",
                        details
                );
            }
        }

        // Conversion et sauvegarde
        Unit unit = unitMapper.toEntity(unitDto);
        unit.setId(null); // S'assurer que c'est une création

        Unit savedUnit = unitRepository.save(unit);
        return unitMapper.toDto(savedUnit);
    }


    @Transactional
    public Unit saveUnit(Unit unit) {
        return unitRepository.save(unit);
    }

    public UnitDTO getUnitById(Long id) {
        Unit unit = unitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Unit not found with id: " + id));
        return unitMapper.toDto(unit);
    }



    // Méthode utilitaire pour récupérer l'entité
    public Unit findEntityById(Long id) {
        return unitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Unit not found with id: " + id));
    }


}

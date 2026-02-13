package com.example.loginservice.repository;

import com.example.loginservice.entity.Unit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UnitRepository extends JpaRepository<Unit, Long> {
    Optional<Unit> findByName(String name);
    Optional<Unit> findByPhone(String phone);
    boolean existsByName(String name);
    boolean existsByPhone(String phone);
}

package com.example.loginservice.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/test")
public class testController {


    @GetMapping
    @PreAuthorize("hasRole('UNIT_ADMIN')")
    public String testuser() {
        return "springboot keycklock user";
    }

}

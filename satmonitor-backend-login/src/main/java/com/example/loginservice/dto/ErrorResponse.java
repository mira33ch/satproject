package com.example.loginservice.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {
    private String errorCode;        // Ex: "AUTH.EMAIL_NOT_VERIFIED"
    private String message;          // Message technique en anglais (pour le logging)
    private Map<String, Object> details; // Données supplémentaires
    private LocalDateTime timestamp;
    private String path;             // URL de la requête (optionnel)

    public ErrorResponse(String errorCode, String message) {
        this(errorCode, message, null, LocalDateTime.now(), null);
    }

    public ErrorResponse(String errorCode, String message, Map<String, Object> details) {
        this(errorCode, message, details, LocalDateTime.now(), null);
    }
}

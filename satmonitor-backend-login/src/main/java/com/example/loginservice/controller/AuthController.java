package com.example.loginservice.controller;
import com.example.loginservice.dto.*;
import com.example.loginservice.exeption.*;
import com.example.loginservice.service.AuthService;
import com.example.loginservice.service.KeycloakService;
import com.example.loginservice.service.UnitService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;
    private final KeycloakService keycloakService;
    private final UnitService unitService;

    @Value("${app.cookie.secure:true}")
    private boolean cookieSecure;

    @Value("${app.cookie.same-site:strict}")
    private String cookieSameSite;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest request) {
        try {
            log.info("Registration attempt for user: {}", request.getEmail());
            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(authService.register(request,"fr"));
        } catch (RuntimeException e) {
            log.warn("Registration failed for user: {} - {}", request.getEmail(), e.getMessage());
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Registration failed", "message", e.getMessage())
            );
        }
    }

    @PostMapping("/register-with-admin")
    public ResponseEntity<?> registerUnitWithAdmin(
            @Valid @RequestBody UnitWithAdminRequest request,
            @RequestHeader(value = "Accept-Language", defaultValue = "fr") String acceptLanguage) {

        try {
            // Extraire la langue du header (ex: "fr-FR,fr;q=0.9" -> "fr")
            String locale = extractLocaleFromHeader(acceptLanguage);

            // Passer la locale au service
            UnitRegistrationResponse response = authService.registerUnitWithAdmin(request, locale);
            response.setLocale(locale);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (DuplicateResourceException e) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "errorCode", e.getErrorCode(),
                            "message", e.getMessage(),
                            "details", e.getDetails()
                    ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Registration failed", "message", e.getMessage())
            );
        }
    }

    private String extractLocaleFromHeader(String acceptLanguage) {
        if (acceptLanguage == null || acceptLanguage.isEmpty()) {
            return "fr"; // Français par défaut
        }

        // Exemples de header:
        // "fr-FR,fr;q=0.9,en;q=0.8" -> retourne "fr"
        // "en-US,en;q=0.9" -> retourne "en"

        String[] locales = acceptLanguage.split(",");
        if (locales.length > 0) {
            String primaryLocale = locales[0].trim();
            // Extraire la partie langue (fr, en, etc.)
            if (primaryLocale.contains("-")) {
                return primaryLocale.split("-")[0].toLowerCase();
            }
            return primaryLocale.toLowerCase();
        }

        return "fr"; // Français par défaut
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request,
                                   HttpServletResponse response,
                                   HttpServletRequest servletRequest) {
        try {
            log.info("Login attempt for user: {} from IP: {}",
                    request.getEmail(),
                    servletRequest.getRemoteAddr());

            LoginResponse tokens = authService.login(request);

            // Set refresh token cookie with modern approach
            setRefreshTokenCookie(response, tokens.getRefreshToken(), 7 * 24 * 60 * 60);

            log.info("Login successful for user: {}", request.getEmail());

            // Frontend receives only access token
            return ResponseEntity.ok(Map.of(
                    "accessToken", tokens.getAccessToken(),
                    "tokenType", "Bearer",
                    "expiresIn", 300 // 5 minutes
            ));
        }
            catch (EmailNotVerifiedException e) {
                // GESTION SPÉCIFIQUE pour l'email non vérifié
                log.warn("Login failed (email not verified) for user: {} - {}", request.getEmail(), e.getMessage());
                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN) // 403 au lieu de 401
                        .body(Map.of(
                                "errorCode", e.getErrorCode(),
                                "message", e.getMessage(),
                                "details", e.getDetails()
                        ));
            } catch (AuthenticationException e) {
            // GESTION des erreurs d'authentification (mauvais mot de passe, compte non actif, etc.)
            log.warn("Authentication failed for user: {} - {}", request.getEmail(), e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "errorCode", e.getErrorCode(),
                            "message", e.getMessage(),
                            "details", e.getDetails() != null ? e.getDetails() : Map.of()
                    ));
        } catch (ResourceNotFoundException e) {
            // GESTION utilisateur non trouvé
            log.warn("User not found for login: {} - {}", request.getEmail(), e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "errorCode", e.getErrorCode(),
                            "message", e.getMessage(),
                            "details", e.getDetails() != null ? e.getDetails() : Map.of()
                    ));
        } catch (Exception e) {
            // GESTION des autres erreurs
            log.error("Unexpected error during login for user: {}", request.getEmail(), e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "errorCode", "AUTH.UNEXPECTED_ERROR",
                            "message", "An unexpected error occurred",
                            "details", Map.of("error", e.getMessage())
                    ));
        }
    }


    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(
            @CookieValue(value = "refreshToken", required = false) String refreshToken,
            HttpServletResponse response) {

        if (refreshToken == null) {
            log.warn("Refresh attempt without refresh token");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }

        try {
            log.debug("Refresh token attempt");

            // Rotate refresh token (issue new, revoke old)
            Map<String, String> newTokens = authService.rotateTokens(refreshToken);

            // Set new refresh token cookie
            setRefreshTokenCookie(response, newTokens.get("refreshToken"), 7 * 24 * 60 * 60);

            return ResponseEntity.ok(Map.of(
                    "accessToken", newTokens.get("accessToken"),
                    "expiresIn", 300 // 5 minutes
            ));

        } catch (TokenExpiredException e) {
            log.warn("Refresh token expired: {}", e.getMessage());

            // Clear expired token
            clearRefreshTokenCookie(response);

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "error", "Session expired",
                            "message", "Please login again"
                    ));
        } catch (Exception e) {
            log.error("Refresh token error: {}", e.getMessage(), e);

            // Clear invalid token
            clearRefreshTokenCookie(response);

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "error", "Invalid refresh token",
                            "message", "Please login again"
                    ));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @CookieValue(value = "refreshToken", required = false) String refreshToken,
            HttpServletResponse response) {

        try {
            if (refreshToken != null) {
                log.debug("Logout attempt with refresh token");
                keycloakService.logout(refreshToken);
            }
        } catch (Exception e) {
            log.warn("Logout cleanup failed: {}", e.getMessage());
            // Continue to clear cookie even if logout fails
        }

        // Clear cookie
        clearRefreshTokenCookie(response);

        log.info("Logout successful");
        return ResponseEntity.ok(Map.of(
                "message", "Logged out successfully"
        ));
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "auth-service",
                "timestamp", Instant.now().toString(),
                "version", "1.0.0"
        ));
    }

    // Helper method to set refresh token cookie
    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken, int maxAge) {
        // Pour le développement avec HTTP
        String cookieValue = String.format(
                "refreshToken=%s; HttpOnly; Secure=%s; SameSite=%s; Path=/; Max-Age=%d; Domain=localhost",
                refreshToken,
                cookieSecure,
                "None".equals(cookieSameSite) ? "None" : cookieSameSite,
                maxAge
        );
        response.addHeader("Set-Cookie", cookieValue);

        // Ajoute aussi le header pour les pré-requêtes CORS
        response.addHeader("Access-Control-Allow-Credentials", "true");
    }

    // Helper method to clear refresh token cookie
    private void clearRefreshTokenCookie(HttpServletResponse response) {
        String cookieValue = String.format(
                "refreshToken=; HttpOnly; Secure=%s; SameSite=%s; Path=/; Max-Age=0; Domain=localhost",
                cookieSecure,
                "None".equals(cookieSameSite) ? "None" : cookieSameSite
        );
        response.addHeader("Set-Cookie", cookieValue);
        response.addHeader("Access-Control-Allow-Credentials", "true");
    }

    // Exception handlers
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Invalid request: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(
                Map.of("error", "Invalid request", "message", ex.getMessage())
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGenericException(Exception ex) {
        log.error("Internal server error: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                        "error", "Internal server error",
                        "message", "An unexpected error occurred"
                ));
    }


}

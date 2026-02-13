package com.example.loginservice.service;

import com.example.loginservice.dto.*;
import com.example.loginservice.entity.Role;
import com.example.loginservice.entity.Unit;
import com.example.loginservice.entity.User;
import com.example.loginservice.exeption.*;
import com.example.loginservice.mapper.UserMapper;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@AllArgsConstructor
public class AuthService {
    private final UserService userService;
    private final KeycloakService keycloakService;
    private final RoleService roleService;
    private final UserMapper userMapper;
    private final UnitService unitService;

    // Constantes pour les codes d'erreur
    private static final String ERROR_USER_NOT_FOUND = "AUTH.USER_NOT_FOUND";
    private static final String ERROR_INVALID_CREDENTIALS = "AUTH.INVALID_CREDENTIALS";
    private static final String ERROR_ACCOUNT_NOT_ACTIVE = "AUTH.ACCOUNT_NOT_ACTIVE";

    /**
     * Inscription complète :
     * - Keycloak
     * - Base locale
     */
    public UserDTO register(RegisterRequest request , String locale) {
        // Validation
        if (userService.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already taken");
        }

        if (userService.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        // Validation optionnelle pour le téléphone
        if (request.getPhone() != null && !request.getPhone().isEmpty()) {
            if (userService.existsByPhone(request.getPhone())) {
                throw new RuntimeException("Phone number already in use");
            }
        }

        // 1️⃣ Vérifier et récupérer le rôle
        Role role = roleService.getRoleByReference(request.getRoleReference());


        // 2️⃣ Création dans Keycloak
        keycloakService.createUserInKeycloak(
                request.getUsername(),
                request.getEmail(),
                request.getPassword(),
                role.getReference(),
                locale
        );

        // 3️⃣ Sauvegarde locale avec rôle
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPassword(request.getPassword()); // Tu peux encoder si besoin
        user.setRole(role); // Assigner le rôle


        User savedUser =  userService.registerUser(user);


        return userMapper.toDto(savedUser);
    }

    // Méthode pour mettre à jour le rôle (dans Keycloak + local)
    @Transactional
    public User updateUserRole(Long userId, String roleReference) {
        User user = userService.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Role newRole = roleService.getRoleByReference(roleReference);

        // 1️⃣ Mettre à jour dans Keycloak
        keycloakService.updateUserRole(user.getUsername(), roleReference);

        // 2️⃣ Mettre à jour localement
        user.setRole(newRole);
        return userService.registerUser(user);
    }

    private UserDTO createAdminUser(RegisterRequest userRequest, Unit unit, String locale) {

        // Définir les codes d'erreur comme constantes
        final String ERROR_USERNAME_EXISTS = "REGISTER.USERNAME_EXISTS";
        final String ERROR_EMAIL_EXISTS = "REGISTER.EMAIL_EXISTS";
        final String ERROR_PHONE_EXISTS = "REGISTER.PHONE_EXISTS";

        // Validation avec exceptions métier
        if (userService.existsByUsername(userRequest.getUsername())) {
            Map<String, Object> details = Map.of(
                    "field", "username",
                    "value", userRequest.getUsername()
            );
            throw new DuplicateResourceException(
                    ERROR_USERNAME_EXISTS,
                    "Username already taken",
                    details
            );
        }


        if (userService.existsByEmail(userRequest.getEmail())) {
            Map<String, Object> details = Map.of(
                    "field", "email",
                    "value", userRequest.getEmail()
            );
            throw new DuplicateResourceException(
                    ERROR_EMAIL_EXISTS,
                    "Email already in use",
                    details
            );
        }

        if (userRequest.getPhone() != null && !userRequest.getPhone().isEmpty()) {
            if (userService.existsByPhone(userRequest.getPhone())) {
                Map<String, Object> details = Map.of(
                        "field", "phone",
                        "value", userRequest.getPhone()
                );
                throw new DuplicateResourceException(
                        ERROR_PHONE_EXISTS,
                        "Phone number already in use",
                        details
                );
            }
        }

        // Récupérer le rôle UNIT_ADMIN
        Role unitAdminRole = roleService.getRoleByReference("UNIT_ADMIN");

        // Créer dans Keycloak
        String keycloakId = keycloakService.createUserInKeycloak(
                userRequest.getUsername(),
                userRequest.getEmail(),
                userRequest.getPassword(),
                unitAdminRole.getReference(),
                locale
        );

        // Créer l'utilisateur localement
        User adminUser = new User();
        adminUser.setUsername(userRequest.getUsername());
        adminUser.setEmail(userRequest.getEmail());
        adminUser.setPhone(userRequest.getPhone());
        adminUser.setPassword(userRequest.getPassword());
        adminUser.setRole(unitAdminRole);
        adminUser.setUnit(unit);
        adminUser.setActive(false); // <-- COMPTE INACTIF
        adminUser.setKeycloakId(keycloakId);

        User savedAdminUser = userService.registerUser(adminUser);

        // Ajouter à l'unité
        unit.addUser(savedAdminUser);
        unitService.saveUnit(unit);

        return userMapper.toDto(savedAdminUser);
    }


    @Transactional
    public UnitRegistrationResponse registerUnitWithAdmin(UnitWithAdminRequest request ,String locale) {
        // 1️⃣  Créer l'unité
        UnitDTO createdUnitDto = unitService.createUnit(request.getUnit());
        Unit unit = unitService.findEntityById(createdUnitDto.getId());

        //  2️⃣ S'assurer que le rôle est UNIT_ADMIN (forcer si nécessaire)
        String roleReference = request.getAdminUser().getRoleReference();
        if (roleReference == null || !roleReference.equals("UNIT_ADMIN")) {
            request.getAdminUser().setRoleReference("UNIT_ADMIN");
        }

        //  3️⃣ Créer l'admin avec les validations existantes
        UserDTO adminUserDto = createAdminUser(request.getAdminUser(), unit,locale);


        // ✅ 4️⃣ ENVOYER L'EMAIL DE VÉRIFICATION
        User adminUserEntity = userService.findById(adminUserDto.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "USER.NOT_FOUND",
                        "Admin user not found after creation"
                ));

        if (adminUserEntity.getKeycloakId() != null) {
            keycloakService.sendVerificationEmail(adminUserEntity.getKeycloakId());
        } else {
        throw new RuntimeException(
                "REGISTER.KEYCLOAK_ID_MISSING: Impossible d'envoyer l'email de vérification: keycloakId manquant"
        );
    }

        //  4️⃣ Préparer la réponse
        UnitRegistrationResponse response = new UnitRegistrationResponse();
        response.setUnit(createdUnitDto);
        response.setAdminUser(adminUserDto);


        return response;
    }



    /**
     * Login via Keycloak
     */

    public LoginResponse login(LoginRequest request) {

        try {
            // 1. Trouver l'utilisateur local
            User localUser = userService.findByEmail(request.getEmail())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            ERROR_USER_NOT_FOUND,
                            "User not found with email: " + request.getEmail()
                    ));

            // 2. Authentification via Keycloak
            Map<String, Object> tokens;
            try {
                tokens = keycloakService.loginUserInKeycloak(
                        request.getEmail(),
                        request.getPassword()
                );
            } catch (RuntimeException e) {
                throw new AuthenticationException(
                        ERROR_INVALID_CREDENTIALS,
                        "Invalid email or password",
                        Map.of("email", request.getEmail())
                );
            }

            // 3. Vérifier email Keycloak
            boolean isEmailVerified = keycloakService.isEmailVerified(localUser.getKeycloakId());

            if (!isEmailVerified) {
                throw new EmailNotVerifiedException(
                        "AUTH.EMAIL_NOT_VERIFIED",
                        "Please verify your email address before logging in. Check your inbox for the verification link.",
                        Map.of(
                                "email", request.getEmail(),
                                "userId", localUser.getId(),
                                "keycloakId", localUser.getKeycloakId()
                        )
                );
            }

            // 4. Activer compte si nécessaire
            if (!localUser.getActive()) {
                localUser.setActive(true);
                userService.save(localUser);
            }

            String accessToken = (String) tokens.get("access_token");
            String refreshToken = (String) tokens.get("refresh_token");

            return new LoginResponse(accessToken, refreshToken, "Bearer");

        } catch (ResourceNotFoundException | EmailNotVerifiedException | AuthenticationException e) {
            throw e;
        } catch (Exception e) {
            throw new AuthenticationException(
                    "AUTH.LOGIN_FAILED",
                    "Login failed. Please try again later.",
                    Map.of(
                            "email", request.getEmail(),
                            "exception", e.getClass().getSimpleName()
                    )
            );
        }
    }




    public Map<String, String> rotateTokens(String refreshToken) {

        try {
            // Refresh pour obtenir un nouvel access token
            String newAccessToken = keycloakService.refreshAccessToken(refreshToken);
            return Map.of(
                    "accessToken", newAccessToken,
                    "refreshToken", refreshToken // ou newRefreshToken si rotation complète
            );
        } catch (Exception e) {
            throw new TokenExpiredException("Refresh token is invalid or expired", e);
        }

    }

}

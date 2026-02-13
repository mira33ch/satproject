package com.example.loginservice.service;
import com.example.loginservice.entity.User;
import com.example.loginservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
public class KeycloakService {

    // Paramètres Keycloak
    @Value("${keycloak.server-url}")
    private String serverUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.admin.client-id}")
    private String adminClientId;

    @Value("${keycloak.client.id}")
    private String clientId;

    @Value("${keycloak.admin.username}")
    private String adminUsername;

    @Value("${keycloak.admin.password}")
    private String adminPassword;

    @Value("${keycloak.client-secret}")
    private String clientSecret;

    private final RestTemplate restTemplate = new RestTemplate();
    private final UserRepository userRepository;

    // Cache pour l'UUID du client
    private String cachedClientUuid = null;

    /**
     * Récupère l'UUID du client Keycloak à partir de son Client ID
     */

    private String getClientUuid() {
        if (cachedClientUuid != null) {
            return cachedClientUuid;
        }

        String adminToken = getAdminAccessToken();
        String url = serverUrl + "/admin/realms/" + realm + "/clients?clientId=" + clientId;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<List> response = restTemplate.exchange(
                    url, HttpMethod.GET, request, List.class);

            if (response.getBody() != null && !response.getBody().isEmpty()) {
                Map<String, Object> client = (Map<String, Object>) response.getBody().get(0);
                cachedClientUuid = (String) client.get("id");
                return cachedClientUuid;
            }

            throw new RuntimeException("Client non trouvé: " + clientId);
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la récupération de l'UUID du client: " + e.getMessage(), e);
        }
    }


    /**
     * Crée un utilisateur dans Keycloak
     */
    public String createUserInKeycloak(String username, String email, String password , String roleReference,String locale) {
        // 1. Récupérer le token admin
        String adminToken = getAdminAccessToken();

        // 2. Créer l'utilisateur
        String userId = createUser(username, email, password, adminToken,locale);

        // 3. Assigner le rôle à l'utilisateur
        assignRoleToUser(userId, roleReference, adminToken);
        return userId;
    }
    /**
     * Obtient un token d'administration pour Keycloak
     */
    private String getAdminAccessToken() {
        String tokenUrl = serverUrl + "/realms/master/protocol/openid-connect/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "password");
        body.add("client_id", adminClientId);
        body.add("username", adminUsername);
        body.add("password", adminPassword);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, request, Map.class);
            return (String) response.getBody().get("access_token");
        } catch (Exception e) {
            throw new RuntimeException("Failed to get admin token: " + e.getMessage(), e);
        }
    }
    /**
     * Crée un utilisateur dans Keycloak
     */
    private String createUser(String username, String email, String password, String adminToken , String locale) {
        String createUserUrl = serverUrl + "/admin/realms/" + realm + "/users";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(adminToken);

        Map<String, Object> userMap = new HashMap<>();
        userMap.put("username", username);
        userMap.put("email", email);
        userMap.put("enabled", true);
        userMap.put("emailVerified", false);


        // Ajouter la locale si spécifiée
        if (locale != null && !locale.trim().isEmpty()) {
            Map<String, List<String>> attributes = new HashMap<>();
            attributes.put("locale", List.of(locale));
            userMap.put("attributes", attributes);
        }

        // Configuration des credentials
        Map<String, Object> credentials = new HashMap<>();
        credentials.put("type", "password");
        credentials.put("value", password);
        credentials.put("temporary", false);

        userMap.put("credentials", List.of(credentials));

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(userMap, headers);

        try {
            ResponseEntity<Void> response = restTemplate.postForEntity(createUserUrl, request, Void.class);

            // Récupérer l'ID de l'utilisateur depuis les headers de réponse
            if (response.getStatusCode() == HttpStatus.CREATED && response.getHeaders().getLocation() != null) {
                String location = response.getHeaders().getLocation().toString();
                return location.substring(location.lastIndexOf("/") + 1);
            } else {
                // Fallback: rechercher l'utilisateur par username
                return findUserIdByUsername(username, adminToken);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to create user in Keycloak: " + e.getMessage(), e);
        }
    }
    /**
     * Trouve l'ID d'un utilisateur par son username
     */
    private String findUserIdByUsername(String username, String adminToken) {
        String searchUrl = serverUrl + "/admin/realms/" + realm + "/users?username=" + username;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<List> response = restTemplate.exchange(
                    searchUrl, HttpMethod.GET, request, List.class);

            if (response.getBody() != null && !response.getBody().isEmpty()) {
                Map<String, Object> user = (Map<String, Object>) response.getBody().get(0);
                return (String) user.get("id");
            }
            throw new RuntimeException("User not found after creation: " + username);
        } catch (Exception e) {
            throw new RuntimeException("Failed to find user ID: " + e.getMessage(), e);
        }
    }
    /**
     * Assigne un rôle à un utilisateur
     */
    private void assignRoleToUser(String userId, String roleReference, String adminToken) {
        try {

            String clientUuid = getClientUuid();

            // 1. Récupérer le rôle client
            String roleUrl = serverUrl + "/admin/realms/" + realm + "/clients/" + clientUuid  + "/roles/" + roleReference;

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(adminToken);

            HttpEntity<Void> roleRequest = new HttpEntity<>(headers);
            ResponseEntity<Map> roleResponse = restTemplate.exchange(
                    roleUrl, HttpMethod.GET, roleRequest, Map.class);

            Map<String, Object> role = roleResponse.getBody();
            if (role == null) {
                System.err.println("Warning: Role not found in Keycloak: " + roleReference);
                return; // Ne pas bloquer si le rôle n'existe pas
            }

            // 2. Assigner le rôle à l'utilisateur
            String assignRoleUrl = serverUrl + "/admin/realms/" + realm + "/users/" + userId + "/role-mappings/clients/" + clientUuid ;

            HttpEntity<List<Map<String, Object>>> assignRequest = new HttpEntity<>(List.of(role), headers);
            restTemplate.postForEntity(assignRoleUrl, assignRequest, Void.class);

        } catch (Exception e) {
            // Log l'erreur mais ne pas bloquer l'inscription
            System.err.println("Warning: Could not assign role " + roleReference + " to user: " + e.getMessage());
            // Tu peux choisir de throw l'exception si tu veux bloquer
            // throw new RuntimeException("Failed to assign role: " + e.getMessage(), e);
        }
    }

    /**
     * Met à jour le rôle d'un utilisateur dans Keycloak
     */
    public void updateUserRole(String username, String newRoleReference) {
        String adminToken = getAdminAccessToken();

        try {
            // 1. Trouver l'ID de l'utilisateur
            String userId = findUserIdByUsername(username, adminToken);

            // 2. Récupérer tous les rôles actuels de l'utilisateur
            String currentRolesUrl = serverUrl + "/admin/realms/" + realm + "/users/" + userId + "/role-mappings/clients/" + clientId;

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(adminToken);

            HttpEntity<Void> getRequest = new HttpEntity<>(headers);
            ResponseEntity<List> currentRolesResponse = restTemplate.exchange(
                    currentRolesUrl, HttpMethod.GET, getRequest, List.class);

            List<Map<String, Object>> currentRoles = currentRolesResponse.getBody();

            // 3. Supprimer tous les anciens rôles
            if (currentRoles != null && !currentRoles.isEmpty()) {
                HttpEntity<List<Map<String, Object>>> deleteRequest = new HttpEntity<>(currentRoles, headers);
                restTemplate.exchange(currentRolesUrl, HttpMethod.DELETE, deleteRequest, Void.class);
            }

            // 4. Ajouter le nouveau rôle
            assignRoleToUser(userId, newRoleReference, adminToken);

        } catch (Exception e) {
            throw new RuntimeException("Failed to update user role in Keycloak: " + e.getMessage(), e);
        }
    }
    /**
     * Vérifie si un rôle existe dans Keycloak
     */
    public boolean roleExists(String roleReference) {
        String adminToken = getAdminAccessToken();
        String roleUrl = serverUrl + "/admin/realms/" + realm + "/clients/" + clientId + "/roles/" + roleReference;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    roleUrl, HttpMethod.GET, request, Map.class);
            return response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Récupère tous les rôles disponibles dans Keycloak
     */
    public List<String> getAllAvailableRoles() {
        String adminToken = getAdminAccessToken();
        String rolesUrl = serverUrl + "/admin/realms/" + realm + "/clients/" + clientId + "/roles";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<List> response = restTemplate.exchange(
                    rolesUrl, HttpMethod.GET, request, List.class);

            List<String> roles = new ArrayList<>();
            if (response.getBody() != null) {
                for (Object roleObj : response.getBody()) {
                    Map<String, Object> role = (Map<String, Object>) roleObj;
                    roles.add((String) role.get("name"));
                }
            }
            return roles;
        } catch (Exception e) {
            throw new RuntimeException("Failed to get roles from Keycloak: " + e.getMessage(), e);
        }
    }


    public Map<String, Object> loginUserInKeycloak(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) throw new RuntimeException("User not found");

        String username = userOpt.get().getUsername();

        String tokenUrl = serverUrl + "/realms/" + realm + "/protocol/openid-connect/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        String body = "grant_type=password" +
                "&client_id=" + clientId +
                "&client_secret=" + clientSecret +
                "&username=" + username +
                "&password=" + password;

        HttpEntity<String> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, request, Map.class);

        return response.getBody(); // contient access_token + refresh_token
    }


    public String refreshAccessToken(String refreshToken) {
        String tokenUrl = serverUrl + "/realms/" + realm + "/protocol/openid-connect/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        String body = "grant_type=refresh_token" +
                "&client_id=" + clientId +
                "&client_secret=" + clientSecret +
                "&refresh_token=" + refreshToken;

        HttpEntity<String> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, request, Map.class);

        return (String) response.getBody().get("access_token");
    }

    public void logout(String refreshToken) {
        String url = serverUrl + "/realms/" + realm + "/protocol/openid-connect/logout";

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        // Utiliser MultiValueMap pour form data
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("refresh_token", refreshToken);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        restTemplate.postForEntity(url, request, String.class);
    }

    /**
     * Envoie un email de vérification à l'utilisateur Keycloak spécifié.
     * @param keycloakUserId L'ID Keycloak de l'utilisateur (celui retourné par createUserInKeycloak)
     */
    public void sendVerificationEmail(String keycloakUserId) {
        String adminToken = getAdminAccessToken();

        // URL de l'API Admin Keycloak pour déclencher l'envoi d'emails d'actions
        String url = serverUrl + "/admin/realms/" + realm + "/users/" + keycloakUserId + "/execute-actions-email";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        // L'action "VERIFY_EMAIL" est prédéfinie par Keycloak
        // Elle déclenche l'envoi de l'email de vérification d'adresse
        List<String> requiredActions = new ArrayList<>();
        requiredActions.add("VERIFY_EMAIL");

        HttpEntity<List<String>> request = new HttpEntity<>(requiredActions, headers);

        try {
            // Utilisation de put() car l'API attend une requête PUT
            restTemplate.put(url, request);
            System.out.println("✅ Email de vérification envoyé pour l'utilisateur Keycloak: " + keycloakUserId);
        } catch (Exception e) {
            throw new RuntimeException("Échec de l'envoi de l'email de vérification: " + e.getMessage(), e);
        }
    }


    /**
     * Vérifie si l'email d'un utilisateur est vérifié dans Keycloak.
     * @param keycloakUserId L'ID Keycloak de l'utilisateur (stocké dans user.keycloakId)
     * @return true si l'email est vérifié, false sinon (ou si l'ID est null/erreur)
     */
    public boolean isEmailVerified(String keycloakUserId) {
        // Protection contre les IDs nuls ou vides
        if (keycloakUserId == null || keycloakUserId.trim().isEmpty()) {
            System.err.println("⚠️ Keycloak ID est null ou vide pour la vérification d'email.");
            return false;
        }

        String adminToken = getAdminAccessToken();
        // URL pour récupérer les infos d'un utilisateur spécifique via l'API Admin
        String url = serverUrl + "/admin/realms/" + realm + "/users/" + keycloakUserId;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);
        headers.set("Accept", "application/json");

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.GET, request, Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> userInfo = response.getBody();
                // L'attribut 'emailVerified' est un Boolean retourné par Keycloak
                Boolean emailVerified = (Boolean) userInfo.get("emailVerified");
                return Boolean.TRUE.equals(emailVerified); // Retourne true seulement si c'est explicitement true
            } else {
                System.err.println("⚠️ Réponse inattendue de Keycloak pour l'utilisateur ID: " + keycloakUserId);
                return false;
            }
        } catch (HttpClientErrorException.NotFound e) {
            // L'utilisateur n'existe pas dans Keycloak (très improbable si le login a réussi)
            System.err.println("❌ Utilisateur Keycloak non trouvé avec l'ID: " + keycloakUserId);
            return false;
        } catch (Exception e) {
            // Log l'erreur mais ne bloque pas forcément. On retourne false par sécurité.
            System.err.println("⚠️ Erreur lors de la vérification d'email pour " + keycloakUserId + ": " + e.getMessage());
            // e.printStackTrace(); // À décommenter pour le débogage
            return false;
        }
    }



}

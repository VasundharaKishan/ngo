package com.myfoundation.school.auth;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {
    
    private final AuthService authService;
    @Value("${app.allow-admin-bootstrap:false}")
    private boolean allowAdminBootstrap;
    @Value("${app.jwt.cookie-enabled:false}")
    private boolean cookieEnabled;
    @Value("${app.jwt.cookie-name:admin_jwt}")
    private String cookieName;
    @Value("${app.jwt.cookie-domain:}")
    private String cookieDomain;
    @Value("${app.jwt.expiration-minutes:60}")
    private long jwtExpiryMinutes;
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            log.info("Login attempt for user: {}", request.getUsername());
            LoginResponse response = authService.login(request);
            ResponseEntity.BodyBuilder builder = ResponseEntity.ok();

            if (cookieEnabled) {
                ResponseCookie cookie = ResponseCookie.from(cookieName, response.getToken())
                        .httpOnly(true)
                        .secure(true)
                        .path("/")
                        .sameSite("Lax")
                        .maxAge(jwtExpiryMinutes * 60)
                        .domain(cookieDomain.isBlank() ? null : cookieDomain)
                        .build();
                builder.header("Set-Cookie", cookie.toString());
            }

            return builder.body(response);
        } catch (RuntimeException e) {
            log.error("Login failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        try {
            LoginResponse response = authService.verifyOtp(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("OTP verification failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/initialize")
    public ResponseEntity<Void> initializeDefaultAdmin() {
        if (!allowAdminBootstrap) {
            log.info("Default admin initialization blocked - enable with app.allow-admin-bootstrap=true");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        log.info("Initializing default admin user");
        authService.initializeDefaultAdmin();
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/users")
    public ResponseEntity<List<AdminUser>> getAllUsers() {
        log.info("Fetching all users");
        List<AdminUser> users = authService.getAllUsers();
        // Remove password from response
        users.forEach(user -> user.setPassword(null));
        return ResponseEntity.ok(users);
    }
    
    @PostMapping("/users")
    public ResponseEntity<?> createUser(@Valid @RequestBody CreateUserRequest request) {
        try {
            log.info("Creating new user: {}", request.getUsername());
            AdminUser user = authService.createUser(request);
            user.setPassword(null); // Don't return password
            return ResponseEntity.status(HttpStatus.CREATED).body(user);
        } catch (RuntimeException e) {
            log.error("User creation failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable String id, @Valid @RequestBody CreateUserRequest request) {
        try {
            log.info("Updating user: {}", id);
            AdminUser user = authService.updateUser(id, request);
            user.setPassword(null); // Don't return password
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            log.error("User update failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<?> updateUserStatus(@PathVariable String id, @RequestBody Map<String, Boolean> payload) {
        try {
            Boolean active = payload.get("active");
            if (active == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "active flag is required"));
            }
            AdminUser user = authService.updateUserStatus(id, active);
            user.setPassword(null);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            log.error("User status update failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable String id, Authentication authentication) {
        String currentUsername = authentication != null ? authentication.getName() : "unknown";
        log.info("User {} requested delete for user id: {}", currentUsername, id);
        authService.deleteUser(id, currentUsername);
        return ResponseEntity.noContent().build();
    }
}

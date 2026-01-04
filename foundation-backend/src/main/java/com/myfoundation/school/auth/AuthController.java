package com.myfoundation.school.auth;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "Admin authentication and user management endpoints")
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
    @Value("${app.jwt.cookie-secure:false}")
    private boolean cookieSecure;
    @Value("${app.jwt.expiration-minutes:60}")
    private long jwtExpiryMinutes;
    
    @Operation(
        summary = "Admin login",
        description = "Authenticates an admin user with username and password. Returns JWT token for API access. " +
                      "May require OTP verification if enabled."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Login successful, JWT token returned",
            content = @Content(schema = @Schema(implementation = LoginResponse.class))
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Invalid credentials"
        )
    })
    @PostMapping(value = "/login", consumes = "application/json", produces = "application/json")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            log.info("Login attempt for user: {}", request.getUsername());
            LoginResponse response = authService.login(request);
            log.info("Login response received, token present: {}", response.getToken() != null);
            ResponseEntity.BodyBuilder builder = ResponseEntity.ok();

            if (cookieEnabled) {
                log.info("Cookie enabled, building cookie...");
                ResponseCookie cookie = ResponseCookie.from(cookieName, response.getToken())
                        .httpOnly(true)
                        .secure(cookieSecure)
                        .path("/")
                        .sameSite("Lax")
                        .maxAge(jwtExpiryMinutes * 60)
                        .domain(cookieDomain.isBlank() ? null : cookieDomain)
                        .build();
                builder.header("Set-Cookie", cookie.toString());
            }

            log.info("Returning login response for user: {}", request.getUsername());
            return builder.body(response);
        } catch (RuntimeException e) {
            log.error("Login failed: {} - Exception type: {}", e.getMessage(), e.getClass().getName(), e);
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
    
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        log.info("Logout requested");
        ResponseEntity.BodyBuilder builder = ResponseEntity.ok();
        
        if (cookieEnabled) {
            // Clear the JWT cookie
            ResponseCookie cookie = ResponseCookie.from(cookieName, "")
                    .httpOnly(true)
                    .secure(cookieSecure)
                    .path("/")
                    .sameSite("Lax")
                    .maxAge(0)  // Expire immediately
                    .domain(cookieDomain.isBlank() ? null : cookieDomain)
                    .build();
            builder.header("Set-Cookie", cookie.toString());
        }
        
        return builder.body(Map.of("message", "Logged out successfully"));
    }
    
    @Operation(
        summary = "Initialize CSRF token",
        description = "GET endpoint that triggers CSRF token generation. The CSRF token is automatically set in XSRF-TOKEN cookie by Spring Security. Requires authentication.",
        security = @SecurityRequirement(name = "Bearer Authentication")
    )
    @ApiResponse(
        responseCode = "200",
        description = "CSRF token initialized successfully"
    )
    @GetMapping("/csrf")
    public ResponseEntity<?> getCsrfToken(HttpServletRequest request, HttpServletResponse response) {
        log.debug("CSRF token endpoint accessed - token will be set in cookie by Spring Security");
        // Access the CSRF token from the request to trigger cookie generation
        CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        if (csrfToken != null) {
            // Token is now loaded and will be set as cookie by CookieCsrfTokenRepository
            response.setHeader(csrfToken.getHeaderName(), csrfToken.getToken());
        }
        return ResponseEntity.ok(Map.of("message", "CSRF token initialized"));
    }
}

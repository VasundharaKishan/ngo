package com.myfoundation.school.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

/**
 * Spring Security Configuration for NGO Donation Platform
 * 
 * Public Endpoints (no authentication required):
 * - /api/campaigns/** - Browse campaigns and donate
 * - /api/categories/** - Browse categories
 * - /api/cms/** - Public content (hero, testimonials, stats, etc.)
 * - /api/config/public - Public site configuration
 * - /api/donations/stripe/** - Stripe payment and webhooks
 * 
 * Protected Endpoints (require authentication):
 * - /api/admin/** - Admin dashboard (when JWT is implemented)
 * - /api/auth/logout - User logout
 */
@Slf4j
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    
    @Value("${app.frontend.url}")
    private String frontendUrl;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        log.info("Configuring Security Filter Chain with FRONTEND_URL: {}", frontendUrl);
        
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> {
                log.info("Configuring authorization rules...");
                auth
                    // Public endpoints - ORDER MATTERS! More specific rules first
                    .requestMatchers("/api/campaigns/**").permitAll()
                    .requestMatchers("/api/categories/**").permitAll()
                    .requestMatchers("/api/cms/**").permitAll()
                    .requestMatchers("/api/config/public/**").permitAll()
                    .requestMatchers("/api/donations/stripe/**").permitAll()
                    
                    // Auth endpoints
                    .requestMatchers("/api/auth/login").permitAll()
                    .requestMatchers("/api/auth/security-questions").permitAll()
                    .requestMatchers("/api/auth/validate-token/**").permitAll()
                    .requestMatchers("/api/auth/setup-password/**").permitAll()
                    .requestMatchers("/api/auth/initialize").permitAll()
                    .requestMatchers("/api/auth/otp/**").permitAll()

                    // Admin + user management
                    .requestMatchers("/api/admin/users/**").hasRole("ADMIN")
                    .requestMatchers("/api/admin/config/**").hasRole("ADMIN")
                    .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "OPERATOR")
                    .requestMatchers("/api/auth/users/**").hasRole("ADMIN")
                    .requestMatchers("/api/auth/admin/**").hasRole("ADMIN")
                    
                    // Health check
                    .requestMatchers("/actuator/health").permitAll()
                    
                    // Swagger/API docs
                    .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                    
                    // All other requests require authentication
                    .anyRequest().authenticated();
            })
            .exceptionHandling(exceptions -> exceptions
                .accessDeniedHandler(accessDeniedHandler())
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .headers(headers -> {
                headers.httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .preload(true)
                    .maxAgeInSeconds(31536000)
                );
                headers.frameOptions(frame -> frame.deny());
                headers.xssProtection(xss -> xss.disable());
                headers.contentTypeOptions(contentType -> {});
                headers.referrerPolicy(referrer -> referrer
                    .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER));
                String cspPolicy =
                        "default-src 'self'; " +
                        "img-src 'self' data: https:; " +
                        "script-src 'self'; " +
                        "style-src 'self' 'unsafe-inline'; " +
                        "connect-src 'self' https://api.stripe.com; " +
                        "frame-ancestors 'none'; " +
                        "font-src 'self' data:; " +
                        "object-src 'none'; " +
                        "base-uri 'self'; " +
                        "form-action 'self'";
                headers.contentSecurityPolicy(csp -> csp.policyDirectives(cspPolicy));
                headers.permissionsPolicy(policy -> policy
                    .policy("geolocation=(), microphone=(), camera=(), fullscreen=(self)"));
            })
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return new AccessDeniedHandler() {
            @Override
            public void handle(HttpServletRequest request, HttpServletResponse response,
                             AccessDeniedException accessDeniedException) throws IOException {
                log.error("Access Denied for request: {} {} from origin: {} - Reason: {}",
                    request.getMethod(),
                    request.getRequestURI(),
                    request.getHeader("Origin"),
                    accessDeniedException.getMessage());
                
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write(String.format(
                    "{\"error\":\"Access Denied\",\"path\":\"%s\",\"message\":\"%s\"}",
                    request.getRequestURI(),
                    accessDeniedException.getMessage()
                ));
            }
        };
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        log.info("Configuring CORS with allowed origin: {}", frontendUrl);
        
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Allow specific origins (localhost for dev + Vercel for production)
        List<String> allowedOrigins = Arrays.asList(
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:3000",
            "https://frontend-three-psi-17.vercel.app",  // Vercel URL 1
            "https://www.yugalsavitriseva.org/",
            "https://foundation-frontend-three.vercel.app"  // Vercel URL 2 (correct one)
        );

        if (frontendUrl != null && !frontendUrl.isBlank()) {
            allowedOrigins = new java.util.ArrayList<>(allowedOrigins);
            allowedOrigins.add(frontendUrl);
        }
        configuration.setAllowedOrigins(allowedOrigins);
        log.info("CORS allowed origins: {}", allowedOrigins);
        
        // Allow all common HTTP methods
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
        ));
        
        // Allow common headers + Stripe webhook signature
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "Accept",
            "Origin",
            "X-Requested-With",
            "Stripe-Signature"
        ));
        
        // Expose headers that frontend might need to read
        configuration.setExposedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type"
        ));
        
        // JWT is sent via Authorization header, no cookies needed
        configuration.setAllowCredentials(false);
        
        // Cache preflight requests for 1 hour
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

package com.myfoundation.school.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
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
 * - /api/settings/public/** - Public site settings
 * - /api/public/** - Public home sections and hero slides
 * - /api/donations/stripe/** - Stripe payment and webhooks
 * 
 * Protected Endpoints (require authentication):
 * - /api/admin/** - Admin dashboard (when JWT is implemented)
 * - /api/auth/logout - User logout
 */
@Slf4j
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Value("${app.frontend.url}")
    private String frontendUrl;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    
    @Autowired(required = false)
    private CsrfDebugFilter csrfDebugFilter;
    
    // Constructor for dependency injection
    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        log.info("Configuring Security Filter Chain with FRONTEND_URL: {}", frontendUrl);
        
        // Configure CSRF token repository with proper settings
        org.springframework.security.web.csrf.CookieCsrfTokenRepository csrfTokenRepository = 
            org.springframework.security.web.csrf.CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfTokenRepository.setCookiePath("/");
        csrfTokenRepository.setCookieName("XSRF-TOKEN");
        csrfTokenRepository.setHeaderName("X-XSRF-TOKEN");
        
        // Use XorCsrfTokenRequestAttributeHandler for better compatibility with SPAs and tests
        org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler requestHandler = 
            new org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler();
        requestHandler.setCsrfRequestAttributeName("_csrf");
        
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf
                .csrfTokenRepository(csrfTokenRepository)
                .csrfTokenRequestHandler(requestHandler)
                .ignoringRequestMatchers(
                    "/api/auth/login",
                    "/api/auth/otp/**",
                    "/api/auth/security-questions",
                    "/api/auth/validate-token/**",
                    "/api/auth/setup-password/**",
                    "/api/auth/initialize",
                    "/api/donations/stripe/create",  // Public donation endpoint
                    "/api/donations/stripe/webhook"  // Stripe webhooks can't send CSRF tokens
                )
            )
            .authorizeHttpRequests(auth -> {
                log.info("Configuring authorization rules...");
                auth
                    // Public endpoints - ORDER MATTERS! More specific rules first
                    .requestMatchers("/api/campaigns/**").permitAll()
                    .requestMatchers("/api/categories/**").permitAll()
                    .requestMatchers("/api/cms/**").permitAll()
                    .requestMatchers("/api/config/public/**").permitAll()
                    .requestMatchers("/api/settings/public/**").permitAll()
                    .requestMatchers("/api/public/**").permitAll()
                    .requestMatchers("/api/donations/stripe/**").permitAll()
                    
                    // Auth endpoints
                    .requestMatchers("/api/auth/login").permitAll()
                    .requestMatchers("/api/auth/logout").permitAll()
                    .requestMatchers("/api/auth/security-questions").permitAll()
                    .requestMatchers("/api/auth/validate-token/**").permitAll()
                    .requestMatchers("/api/auth/setup-password/**").permitAll()
                    .requestMatchers("/api/auth/initialize").permitAll()
                    .requestMatchers("/api/auth/otp/**").permitAll()
                    .requestMatchers("/api/auth/csrf").authenticated() // Requires authentication, triggers CSRF token

                    // Admin + user management
                    .requestMatchers("/api/admin/users/**").hasRole("ADMIN")
                    .requestMatchers("/api/admin/config/**").hasRole("ADMIN")
                    .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "OPERATOR")
                    .requestMatchers("/api/auth/users/**").hasRole("ADMIN")
                    .requestMatchers("/api/auth/admin/**").hasRole("ADMIN")
                    
                    // Health check
                    .requestMatchers("/actuator/health").permitAll()
                    
                    // Swagger/API docs
                    .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                    
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
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(new CsrfCookieFilter(), org.springframework.security.web.csrf.CsrfFilter.class);
        
        // Only add CSRF debug filter if it's available (dev/local profiles)
        if (csrfDebugFilter != null) {
            http.addFilterAfter(csrfDebugFilter, org.springframework.security.web.csrf.CsrfFilter.class);
        }
        
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
        
        // Allow common headers + Stripe webhook signature + CSRF
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "Accept",
            "Origin",
            "X-Requested-With",
            "Stripe-Signature",
            "X-XSRF-TOKEN"
        ));
        
        // Expose headers that frontend might need to read + CSRF token
        configuration.setExposedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "X-XSRF-TOKEN"
        ));
        
        // Enable credentials for cookie-based JWT authentication
        configuration.setAllowCredentials(true);
        
        // Cache preflight requests for 1 hour
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

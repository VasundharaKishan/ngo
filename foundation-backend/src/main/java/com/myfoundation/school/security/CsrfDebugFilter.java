package com.myfoundation.school.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * Debug filter to log CSRF-related headers for admin endpoints.
 * Only enabled in dev/local profiles.
 */
@Slf4j
@Component
@Profile({"dev", "local", "default"})
public class CsrfDebugFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String requestUri = request.getRequestURI();
        
        // Only log for admin endpoints
        if (requestUri.startsWith("/api/admin/")) {
            log.info("=== CSRF Debug for {} {} ===", request.getMethod(), requestUri);
            
            // Log headers
            String headerUppercase = request.getHeader("X-XSRF-TOKEN");
            String headerLowercase = request.getHeader("x-xsrf-token");
            String headerNoX = request.getHeader("XSRF-TOKEN");
            log.info("  X-XSRF-TOKEN (uppercase): {}", headerUppercase);
            log.info("  x-xsrf-token (lowercase): {}", headerLowercase);
            log.info("  XSRF-TOKEN (no X-): {}", headerNoX);
            log.info("  Cookie header: {}", request.getHeader("Cookie"));
            
            // Also log cookies individually for clarity
            String csrfCookieValue = null;
            Cookie[] cookies = request.getCookies();
            if (cookies != null) {
                String cookieList = Arrays.stream(cookies)
                        .map(c -> c.getName() + "=" + (c.getName().contains("TOKEN") ? c.getValue() : "***"))
                        .collect(Collectors.joining(", "));
                log.info("  Parsed cookies: {}", cookieList);
                
                // Extract XSRF-TOKEN cookie value
                for (Cookie cookie : cookies) {
                    if ("XSRF-TOKEN".equals(cookie.getName())) {
                        csrfCookieValue = cookie.getValue();
                        break;
                    }
                }
            } else {
                log.info("  Parsed cookies: none");
            }
            
            // Log CsrfToken request attribute
            CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
            if (csrfToken != null) {
                log.info("  --- CsrfToken Request Attribute ---");
                log.info("    Token value: {}", csrfToken.getToken());
                log.info("    Header name: {}", csrfToken.getHeaderName());
                log.info("    Parameter name: {}", csrfToken.getParameterName());
                
                // Compare with cookie and header
                log.info("  --- Comparison ---");
                log.info("    CsrfToken.token == XSRF-TOKEN cookie? {}", 
                    csrfToken.getToken().equals(csrfCookieValue));
                log.info("    CsrfToken.token == X-XSRF-TOKEN header? {}", 
                    csrfToken.getToken().equals(headerUppercase));
                if (csrfCookieValue != null && !csrfToken.getToken().equals(csrfCookieValue)) {
                    log.warn("    MISMATCH: CsrfToken attribute ({}) != XSRF-TOKEN cookie ({})", 
                        csrfToken.getToken().substring(0, Math.min(10, csrfToken.getToken().length())) + "...",
                        csrfCookieValue.substring(0, Math.min(10, csrfCookieValue.length())) + "...");
                }
                if (headerUppercase != null && !csrfToken.getToken().equals(headerUppercase)) {
                    log.warn("    MISMATCH: CsrfToken attribute ({}) != X-XSRF-TOKEN header ({})", 
                        csrfToken.getToken().substring(0, Math.min(10, csrfToken.getToken().length())) + "...",
                        headerUppercase.substring(0, Math.min(10, headerUppercase.length())) + "...");
                }
            } else {
                log.info("  CsrfToken request attribute: NULL");
            }
            
            log.info("=== End CSRF Debug ===");
        }
        
        filterChain.doFilter(request, response);
    }
}

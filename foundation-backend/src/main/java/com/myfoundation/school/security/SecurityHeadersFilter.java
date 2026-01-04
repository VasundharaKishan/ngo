package com.myfoundation.school.security;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Security headers filter to protect against common web vulnerabilities.
 * 
 * Implements OWASP recommended security headers:
 * - Strict-Transport-Security (HSTS) - Forces HTTPS connections
 * - Content-Security-Policy (CSP) - Prevents XSS attacks
 * - X-Frame-Options - Prevents clickjacking
 * - X-Content-Type-Options - Prevents MIME sniffing
 * - Referrer-Policy - Controls referrer information leakage
 * - Permissions-Policy - Controls browser features
 * 
 * @see <a href="https://owasp.org/www-project-secure-headers/">OWASP Secure Headers Project</a>
 */
@Component
@Order(1)
public class SecurityHeadersFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        // HTTP Strict Transport Security (HSTS)
        // Forces browsers to use HTTPS for all connections to this domain
        // max-age=31536000 (1 year), includeSubDomains applies to all subdomains
        httpResponse.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
        
        // Content Security Policy (CSP)
        // Defines trusted sources for content, prevents XSS attacks
        // default-src 'self': Only load resources from same origin by default
        // script-src 'self' 'unsafe-inline': Allow scripts from same origin and inline scripts (needed for React)
        // style-src 'self' 'unsafe-inline': Allow styles from same origin and inline styles
        // img-src 'self' data: https:: Allow images from same origin, data URIs, and HTTPS
        // font-src 'self' data:: Allow fonts from same origin and data URIs
        // connect-src 'self': Allow AJAX/fetch requests to same origin only
        // frame-ancestors 'none': Prevent embedding in frames (redundant with X-Frame-Options but more modern)
        httpResponse.setHeader("Content-Security-Policy", 
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https:; " +
            "font-src 'self' data:; " +
            "connect-src 'self'; " +
            "frame-ancestors 'none'; " +
            "base-uri 'self'; " +
            "form-action 'self'");
        
        // X-Frame-Options
        // Prevents clickjacking by disallowing the page to be embedded in frames
        // DENY: Never allow framing
        httpResponse.setHeader("X-Frame-Options", "DENY");
        
        // X-Content-Type-Options
        // Prevents MIME sniffing attacks
        // nosniff: Browser must respect Content-Type header
        httpResponse.setHeader("X-Content-Type-Options", "nosniff");
        
        // Referrer-Policy
        // Controls how much referrer information is included with requests
        // strict-origin-when-cross-origin: Send full URL for same-origin, only origin for cross-origin
        httpResponse.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        
        // Permissions-Policy (formerly Feature-Policy)
        // Controls which browser features and APIs can be used
        // Disables potentially dangerous features like geolocation, camera, microphone
        httpResponse.setHeader("Permissions-Policy", 
            "geolocation=(), " +
            "microphone=(), " +
            "camera=(), " +
            "payment=(), " +
            "usb=(), " +
            "magnetometer=(), " +
            "gyroscope=(), " +
            "accelerometer=()");
        
        // X-XSS-Protection (Legacy, but still useful for older browsers)
        // Enables XSS filtering in older browsers
        // 1; mode=block: Enable XSS filter and block page if attack detected
        httpResponse.setHeader("X-XSS-Protection", "1; mode=block");
        
        chain.doFilter(request, response);
    }

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        // Initialization logic if needed
    }

    @Override
    public void destroy() {
        // Cleanup logic if needed
    }
}

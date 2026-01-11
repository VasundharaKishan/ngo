package com.myfoundation.school.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter to ensure CSRF token is loaded and available on every request.
 * This is necessary for SPA applications where the token needs to be
 * available in cookies for JavaScript to read and send back in headers.
 */
public class CsrfCookieFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        // Access the deferred CSRF token to trigger it to be loaded and set in the response
        CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        if (csrfToken != null) {
            // Force the token to be generated
            String tokenValue = csrfToken.getToken();
            
            // Explicitly set the cookie to ensure it's in the response
            // This is necessary for test environments and SPA clients
            Cookie cookie = new Cookie("XSRF-TOKEN", tokenValue);
            cookie.setPath("/");
            cookie.setHttpOnly(false);
            cookie.setSecure(false); // Set to true in production with HTTPS
            cookie.setAttribute("SameSite", "Lax"); // Allow cross-origin but with some restrictions
            response.addCookie(cookie);
        }
        filterChain.doFilter(request, response);
    }
}

package com.myfoundation.school.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestHandler;
import org.springframework.security.web.csrf.DefaultCsrfToken;
import org.springframework.util.StringUtils;

import java.util.function.Supplier;

/**
 * Debug CSRF token request handler that logs what it receives.
 */
public class DebugCsrfTokenRequestHandler implements CsrfTokenRequestHandler {
    
    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, 
                      Supplier<CsrfToken> csrfTokenSupplier) {
        // This is called by the CSRF filter to prepare the token for the request
        CsrfToken csrfToken = csrfTokenSupplier.get();
        request.setAttribute(CsrfToken.class.getName(), csrfToken);
        request.setAttribute(csrfToken.getParameterName(), csrfToken);
        
        System.out.println("[DebugCsrfTokenRequestHandler] Token set in request");
        System.out.println("[DebugCsrfTokenRequestHandler] Token: " + csrfToken.getToken());
        System.out.println("[DebugCsrfTokenRequestHandler] Header name: " + csrfToken.getHeaderName());
        System.out.println("[DebugCsrfTokenRequestHandler] Parameter name: " + csrfToken.getParameterName());
    }
    
    @Override
    public String resolveCsrfTokenValue(HttpServletRequest request, CsrfToken csrfToken) {
        // This is called by the CSRF filter to get the actual token value from the request
        String headerName = csrfToken.getHeaderName();
        String paramName = csrfToken.getParameterName();
        
        // Check header first
        String tokenValue = request.getHeader(headerName);
        System.out.println("[DebugCsrfTokenRequestHandler] Resolving token...");
        System.out.println("[DebugCsrfTokenRequestHandler] Looking for header: " + headerName);
        System.out.println("[DebugCsrfTokenRequestHandler] Header value: " + tokenValue);
        
        // Also check all headers
        System.out.println("[DebugCsrfTokenRequestHandler] All headers:");
        request.getHeaderNames().asIterator().forEachRemaining(name -> {
            System.out.println("  " + name + ": " + request.getHeader(name));
        });
        
        if (!StringUtils.hasText(tokenValue)) {
            // Fall back to parameter
            tokenValue = request.getParameter(paramName);
            System.out.println("[DebugCsrfTokenRequestHandler] Parameter value: " + tokenValue);
        }
        
        System.out.println("[DebugCsrfTokenRequestHandler] Final resolved token: " + tokenValue);
        return tokenValue;
    }
}

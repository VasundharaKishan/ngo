package com.myfoundation.school.logging;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.util.UUID;

/**
 * Filter for logging HTTP requests and responses.
 * Adds trace ID to MDC for request tracking across logs.
 */
@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestResponseLoggingFilter implements Filter {
    
    private static final String TRACE_ID = "traceId";
    private static final String TRACE_ID_HEADER = "X-Trace-Id";
    private static final int MAX_PAYLOAD_LENGTH = 1000;
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        if (request instanceof HttpServletRequest && response instanceof HttpServletResponse) {
            HttpServletRequest httpRequest = (HttpServletRequest) request;
            HttpServletResponse httpResponse = (HttpServletResponse) response;
            
            // Generate or retrieve trace ID
            String traceId = httpRequest.getHeader(TRACE_ID_HEADER);
            if (traceId == null || traceId.isEmpty()) {
                traceId = UUID.randomUUID().toString();
            }
            
            // Add trace ID to MDC for logging
            MDC.put(TRACE_ID, traceId);
            
            // Add trace ID to response header
            httpResponse.setHeader(TRACE_ID_HEADER, traceId);
            
            // Wrap request and response for logging
            ContentCachingRequestWrapper requestWrapper = new ContentCachingRequestWrapper(httpRequest);
            ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(httpResponse);
            
            long startTime = System.currentTimeMillis();
            
            try {
                // Log request
                logRequest(requestWrapper);
                
                // Process request
                chain.doFilter(requestWrapper, responseWrapper);
                
                // Log response
                long duration = System.currentTimeMillis() - startTime;
                logResponse(responseWrapper, duration);
                
                // Copy response body to actual response
                responseWrapper.copyBodyToResponse();
                
            } finally {
                // Clean up MDC
                MDC.remove(TRACE_ID);
            }
        } else {
            chain.doFilter(request, response);
        }
    }
    
    private void logRequest(ContentCachingRequestWrapper request) {
        String uri = request.getRequestURI();
        String method = request.getMethod();
        String queryString = request.getQueryString();
        
        // Don't log static resources or health checks
        if (shouldSkipLogging(uri)) {
            return;
        }
        
        StringBuilder logMessage = new StringBuilder();
        logMessage.append("Incoming request: ")
                .append(method).append(" ")
                .append(uri);
        
        if (queryString != null && !queryString.isEmpty()) {
            logMessage.append("?").append(queryString);
        }
        
        // Log request body for POST/PUT/PATCH (excluding sensitive endpoints)
        if (shouldLogBody(uri, method)) {
            String payload = getRequestPayload(request);
            if (payload != null && !payload.isEmpty()) {
                logMessage.append(" | Body: ").append(payload);
            }
        }
        
        log.info(logMessage.toString());
    }
    
    private void logResponse(ContentCachingResponseWrapper response, long duration) {
        int status = response.getStatus();
        
        String uri = MDC.get("requestUri");
        if (uri != null && shouldSkipLogging(uri)) {
            return;
        }
        
        StringBuilder logMessage = new StringBuilder();
        logMessage.append("Outgoing response: ")
                .append("status=").append(status)
                .append(" | duration=").append(duration).append("ms");
        
        // Log response body for errors
        if (status >= 400) {
            String payload = getResponsePayload(response);
            if (payload != null && !payload.isEmpty()) {
                logMessage.append(" | Body: ").append(payload);
            }
        }
        
        if (status >= 500) {
            log.error(logMessage.toString());
        } else if (status >= 400) {
            log.warn(logMessage.toString());
        } else {
            log.info(logMessage.toString());
        }
    }
    
    private boolean shouldSkipLogging(String uri) {
        return uri.contains("/actuator") ||
               uri.contains("/health") ||
               uri.contains("/favicon.ico") ||
               uri.endsWith(".js") ||
               uri.endsWith(".css") ||
               uri.endsWith(".png") ||
               uri.endsWith(".jpg") ||
               uri.endsWith(".svg");
    }
    
    private boolean shouldLogBody(String uri, String method) {
        // Don't log sensitive endpoints
        if (uri.contains("/auth/login") || uri.contains("/password")) {
            return false;
        }
        
        // Log body for state-changing methods
        return "POST".equals(method) || "PUT".equals(method) || "PATCH".equals(method);
    }
    
    private String getRequestPayload(ContentCachingRequestWrapper request) {
        byte[] buf = request.getContentAsByteArray();
        if (buf.length > 0) {
            try {
                String payload = new String(buf, 0, Math.min(buf.length, MAX_PAYLOAD_LENGTH),
                        request.getCharacterEncoding());
                return buf.length > MAX_PAYLOAD_LENGTH ? payload + "..." : payload;
            } catch (UnsupportedEncodingException e) {
                return "[Unknown encoding]";
            }
        }
        return null;
    }
    
    private String getResponsePayload(ContentCachingResponseWrapper response) {
        byte[] buf = response.getContentAsByteArray();
        if (buf.length > 0) {
            try {
                String payload = new String(buf, 0, Math.min(buf.length, MAX_PAYLOAD_LENGTH),
                        response.getCharacterEncoding());
                return buf.length > MAX_PAYLOAD_LENGTH ? payload + "..." : payload;
            } catch (UnsupportedEncodingException e) {
                return "[Unknown encoding]";
            }
        }
        return null;
    }
}

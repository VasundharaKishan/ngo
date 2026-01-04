package com.myfoundation.school.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Rate limiting filter to prevent abuse of API endpoints.
 * Implements a token bucket algorithm with IP-based tracking.
 */
@Component
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    @Value("${app.rate-limit.enabled:true}")
    private boolean rateLimitEnabled;

    @Value("${app.rate-limit.requests-per-minute:60}")
    private int requestsPerMinute;

    @Value("${app.rate-limit.burst-size:10}")
    private int burstSize;

    // Store request counts per IP address
    private final Map<String, AtomicInteger> requestCounts = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

    public RateLimitFilter() {
        // Reset counters every minute
        scheduler.scheduleAtFixedRate(() -> {
            requestCounts.clear();
            log.debug("Rate limit counters reset");
        }, 1, 1, TimeUnit.MINUTES);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (!rateLimitEnabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIP = getClientIP(request);
        String endpoint = request.getRequestURI();

        // Apply stricter limits to sensitive endpoints
        int limit = isSensitiveEndpoint(endpoint) ? requestsPerMinute / 2 : requestsPerMinute;

        AtomicInteger counter = requestCounts.computeIfAbsent(clientIP, k -> new AtomicInteger(0));
        int currentCount = counter.incrementAndGet();

        if (currentCount > limit) {
            log.warn("Rate limit exceeded for IP: {} on endpoint: {} (count: {})", clientIP, endpoint, currentCount);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Rate limit exceeded. Please try again later.\"}");
            return;
        }

        // Add rate limit headers
        response.addHeader("X-RateLimit-Limit", String.valueOf(limit));
        response.addHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, limit - currentCount)));
        response.addHeader("X-RateLimit-Reset", String.valueOf(getNextResetTime()));

        filterChain.doFilter(request, response);
    }

    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIP = request.getHeader("X-Real-IP");
        if (xRealIP != null && !xRealIP.isEmpty()) {
            return xRealIP;
        }

        return request.getRemoteAddr();
    }

    private boolean isSensitiveEndpoint(String endpoint) {
        return endpoint.contains("/auth/") ||
               endpoint.contains("/admin/") ||
               endpoint.contains("/donations/create") ||
               endpoint.contains("/otp/");
    }

    private long getNextResetTime() {
        long currentTime = System.currentTimeMillis();
        long oneMinute = 60 * 1000;
        return ((currentTime / oneMinute) + 1) * oneMinute;
    }

    @Override
    public void destroy() {
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            scheduler.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}

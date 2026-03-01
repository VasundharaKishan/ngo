package com.myfoundation.school.security;

import jakarta.annotation.PostConstruct;
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
 * Fixed-window rate limiting filter with IP-based tracking.
 *
 * Configuration properties (all under app.rate-limit.*):
 *   enabled             – enable/disable this filter (default: true)
 *   requests-per-second – max requests per IP per window (default: 100)
 *   window-seconds      – window duration in seconds (default: 1)
 *   burst-size          – kept for reference; not enforced by this filter
 *
 * Sensitive endpoints (auth, admin, donations, otp) are limited to 50 % of the
 * configured cap to provide an extra layer of protection with no additional config.
 */
@Component
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    @Value("${app.rate-limit.enabled:true}")
    private boolean rateLimitEnabled;

    /** Maximum requests per IP within one window. */
    @Value("${app.rate-limit.requests-per-second:100}")
    private int requestsPerSecond;

    /** Window length in seconds; counters are reset at this interval. */
    @Value("${app.rate-limit.window-seconds:1}")
    private long windowSeconds;

    @Value("${app.rate-limit.burst-size:10}")
    private int burstSize;

    // Store request counts per IP address
    private final Map<String, AtomicInteger> requestCounts = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

    @PostConstruct
    private void initScheduler() {
        // Reset counters every windowSeconds seconds
        scheduler.scheduleAtFixedRate(() -> {
            requestCounts.clear();
            log.debug("Rate limit counters reset (window={}s)", windowSeconds);
        }, windowSeconds, windowSeconds, TimeUnit.SECONDS);
        log.info("RateLimitFilter initialised — limit: {}/{}s, sensitive endpoints: {}/{}s",
                requestsPerSecond, windowSeconds, requestsPerSecond / 2, windowSeconds);
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

        // Sensitive endpoints get 50 % of the general cap for extra protection
        int limit = isSensitiveEndpoint(endpoint) ? requestsPerSecond / 2 : requestsPerSecond;

        AtomicInteger counter = requestCounts.computeIfAbsent(clientIP, k -> new AtomicInteger(0));
        int currentCount = counter.incrementAndGet();

        if (currentCount > limit) {
            log.warn("Rate limit exceeded for IP: {} on endpoint: {} (count: {}/{}s)",
                    clientIP, endpoint, currentCount, windowSeconds);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Rate limit exceeded. Please try again later.\"}");
            return;
        }

        // Informational rate-limit headers
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
        long windowMs = windowSeconds * 1000L;
        return ((currentTime / windowMs) + 1) * windowMs;
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

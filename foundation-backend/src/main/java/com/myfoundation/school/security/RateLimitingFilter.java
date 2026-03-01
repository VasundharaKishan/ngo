package com.myfoundation.school.security;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Rate limiting filter to prevent abuse and brute force attacks.
 *
 * Uses token bucket algorithm to limit requests per IP address.
 * Window duration and per-group caps are fully configurable via application properties:
 * - app.rate-limit.window-seconds     – window length in seconds (default: 1)
 * - app.rate-limit.general            – max requests per window for public endpoints (default: 100)
 * - app.rate-limit.admin              – max requests per window for admin endpoints  (default: 100)
 * - app.rate-limit.login              – max requests per window for auth endpoints   (default: 5)
 * - app.rate-limit.auth-login-window-seconds – override window for login (default: 60, for brute-force protection)
 *
 * When the rate limit is exceeded, returns 429 Too Many Requests with a Retry-After header.
 *
 * @see <a href="https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks">OWASP Brute Force Prevention</a>
 */
@Slf4j
@Component
@Order(2)
public class RateLimitingFilter implements Filter {

    // Storage for rate limit buckets (IP:endpointGroup -> Bucket)
    private final Map<String, TokenBucket> buckets = new ConcurrentHashMap<>();

    // Cleanup old buckets periodically to prevent memory leak
    private static final long CLEANUP_INTERVAL_MS = TimeUnit.MINUTES.toMillis(10);
    private long lastCleanup = System.currentTimeMillis();

    /** General window duration in seconds (applies to admin + general groups). */
    @Value("${app.rate-limit.window-seconds:1}")
    private int windowSeconds;

    /** Separate window for login/OTP (longer = stronger brute-force protection). */
    @Value("${app.rate-limit.auth-login-window-seconds:60}")
    private int authLoginWindowSeconds;

    // Per-group caps — requests allowed within their respective window
    @Value("${app.rate-limit.login:5}")
    private int loginLimit;

    @Value("${app.rate-limit.admin:100}")
    private int adminLimit;

    @Value("${app.rate-limit.general:100}")
    private int generalLimit;
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        // Get client IP address
        String clientIp = getClientIP(httpRequest);
        String requestURI = httpRequest.getRequestURI();
        
        // Determine rate limit and window based on endpoint
        int limit = determineRateLimit(requestURI);
        long windowMs = determineWindowMs(requestURI);

        // Create bucket key (IP + endpoint pattern for better isolation)
        String bucketKey = clientIp + ":" + getEndpointPattern(requestURI);

        // Get or create token bucket for this client+group
        TokenBucket bucket = buckets.computeIfAbsent(bucketKey, k -> new TokenBucket(limit, windowMs));

        // Try to consume a token
        if (bucket.tryConsume()) {
            // Request allowed, proceed
            chain.doFilter(request, response);
        } else {
            // Rate limit exceeded
            long retryAfterSeconds = bucket.getTimeUntilRefill();

            log.warn("Rate limit exceeded for IP: {} on endpoint: {} (limit: {}/{}s)",
                clientIp, requestURI, limit, windowMs / 1000);
            
            httpResponse.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            httpResponse.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
            httpResponse.setContentType("application/json");
            httpResponse.getWriter().write(String.format(
                "{\"error\":\"Too Many Requests\"," +
                "\"message\":\"Rate limit exceeded. Please try again in %d seconds.\"," +
                "\"retryAfter\":%d}",
                retryAfterSeconds, retryAfterSeconds
            ));
        }
        
        // Periodic cleanup of old buckets
        cleanupOldBuckets();
    }
    
    /**
     * Get client IP address, considering proxy headers
     */
    private String getClientIP(HttpServletRequest request) {
        // Check for forwarded IP (from proxy/load balancer)
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isEmpty()) {
            // X-Forwarded-For can contain multiple IPs, use the first one
            return forwardedFor.split(",")[0].trim();
        }
        
        // Check X-Real-IP header
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isEmpty()) {
            return realIp;
        }
        
        // Fall back to remote address
        return request.getRemoteAddr();
    }
    
    /**
     * Determine the request cap for the given URI.
     */
    private int determineRateLimit(String uri) {
        if (uri.startsWith("/api/auth/login") || uri.startsWith("/api/auth/otp")) {
            return loginLimit;   // Strict: brute-force protection
        } else if (uri.startsWith("/api/admin")) {
            return adminLimit;   // Admin group
        } else {
            return generalLimit; // Public endpoints
        }
    }

    /**
     * Determine the window duration in milliseconds for the given URI.
     * Auth/OTP endpoints use a longer window for stronger brute-force protection.
     */
    private long determineWindowMs(String uri) {
        if (uri.startsWith("/api/auth/login") || uri.startsWith("/api/auth/otp")) {
            return TimeUnit.SECONDS.toMillis(authLoginWindowSeconds);
        }
        return TimeUnit.SECONDS.toMillis(windowSeconds);
    }
    
    /**
     * Get endpoint pattern for bucket isolation
     * Groups similar endpoints together for better rate limiting
     */
    private String getEndpointPattern(String uri) {
        if (uri.startsWith("/api/auth/login")) return "auth:login";
        if (uri.startsWith("/api/auth/otp")) return "auth:otp";
        if (uri.startsWith("/api/admin")) return "admin";
        if (uri.startsWith("/api/campaigns")) return "campaigns";
        if (uri.startsWith("/api/donations")) return "donations";
        return "general";
    }
    
    /**
     * Cleanup old buckets that haven't been used recently
     * Prevents memory leak from accumulating buckets
     */
    private void cleanupOldBuckets() {
        long now = System.currentTimeMillis();
        if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
            int sizeBefore = buckets.size();
            buckets.entrySet().removeIf(entry -> 
                now - entry.getValue().getLastAccessTime() > CLEANUP_INTERVAL_MS
            );
            int sizeAfter = buckets.size();
            if (sizeBefore != sizeAfter) {
                log.info("Cleaned up {} old rate limit buckets ({} -> {})", 
                    sizeBefore - sizeAfter, sizeBefore, sizeAfter);
            }
            lastCleanup = now;
        }
    }
    
    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        log.info("Rate limiting filter initialized - Login: {}/{}s, Admin: {}/{}s, General: {}/{}s",
            loginLimit, authLoginWindowSeconds, adminLimit, windowSeconds, generalLimit, windowSeconds);
    }
    
    @Override
    public void destroy() {
        buckets.clear();
    }
    
    /**
     * Token bucket implementation for rate limiting.
     *
     * Algorithm:
     * - Bucket starts full (capacity = tokensPerWindow)
     * - One token is added every (windowMs / tokensPerWindow) milliseconds
     * - Each request consumes 1 token; rejected when empty
     * - Window duration is configurable (default: 1 second → 100 tokens/s)
     */
    private static class TokenBucket {
        private final int capacity;
        private final long refillIntervalMs;
        private int tokens;
        private long lastRefillTime;
        private long lastAccessTime;

        /**
         * @param tokensPerWindow maximum requests allowed within windowMs
         * @param windowMs        window duration in milliseconds
         */
        public TokenBucket(int tokensPerWindow, long windowMs) {
            this.capacity = tokensPerWindow;
            this.tokens = tokensPerWindow;
            // How many ms between each token refill
            this.refillIntervalMs = Math.max(1, windowMs / tokensPerWindow);
            this.lastRefillTime = System.currentTimeMillis();
            this.lastAccessTime = System.currentTimeMillis();
        }
        
        /**
         * Try to consume one token
         * Returns true if successful, false if rate limit exceeded
         */
        public synchronized boolean tryConsume() {
            refill();
            lastAccessTime = System.currentTimeMillis();
            
            if (tokens > 0) {
                tokens--;
                return true;
            }
            return false;
        }
        
        /**
         * Refill tokens based on elapsed time
         */
        private void refill() {
            long now = System.currentTimeMillis();
            long timeSinceLastRefill = now - lastRefillTime;
            
            // Calculate how many tokens to add
            int tokensToAdd = (int) (timeSinceLastRefill / refillIntervalMs);
            
            if (tokensToAdd > 0) {
                tokens = Math.min(capacity, tokens + tokensToAdd);
                lastRefillTime = now;
            }
        }
        
        /**
         * Get time until next token is available (in seconds)
         */
        public synchronized long getTimeUntilRefill() {
            if (tokens > 0) {
                return 0;
            }
            long timeSinceLastRefill = System.currentTimeMillis() - lastRefillTime;
            long timeUntilNextToken = refillIntervalMs - timeSinceLastRefill;
            return Math.max(1, TimeUnit.MILLISECONDS.toSeconds(timeUntilNextToken));
        }
        
        /**
         * Get last access time for cleanup purposes
         */
        public long getLastAccessTime() {
            return lastAccessTime;
        }
    }
}

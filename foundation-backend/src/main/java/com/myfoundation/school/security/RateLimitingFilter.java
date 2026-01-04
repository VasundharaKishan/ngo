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
 * Uses token bucket algorithm to limit requests per IP address:
 * - General API: 100 requests per minute
 * - Login endpoint: 5 requests per minute (prevents brute force)
 * - Admin endpoints: 60 requests per minute
 * 
 * When rate limit is exceeded, returns 429 Too Many Requests with Retry-After header.
 * 
 * @see <a href="https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks">OWASP Brute Force Prevention</a>
 */
@Slf4j
@Component
@Order(2)
public class RateLimitingFilter implements Filter {

    // Storage for rate limit buckets (IP -> Bucket)
    private final Map<String, TokenBucket> buckets = new ConcurrentHashMap<>();
    
    // Cleanup old buckets periodically to prevent memory leak
    private static final long CLEANUP_INTERVAL_MS = TimeUnit.MINUTES.toMillis(10);
    private long lastCleanup = System.currentTimeMillis();
    
    // Rate limits by endpoint pattern (configurable via properties)
    @Value("${app.rate-limit.login:5}")
    private int loginLimit;
    
    @Value("${app.rate-limit.admin:500}")
    private int adminLimit;
    
    @Value("${app.rate-limit.general:500}")
    private int generalLimit;
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        // Get client IP address
        String clientIp = getClientIP(httpRequest);
        String requestURI = httpRequest.getRequestURI();
        
        // Determine rate limit based on endpoint
        int limit = determineRateLimit(requestURI);
        
        // Create bucket key (IP + endpoint pattern for better isolation)
        String bucketKey = clientIp + ":" + getEndpointPattern(requestURI);
        
        // Get or create token bucket for this client
        TokenBucket bucket = buckets.computeIfAbsent(bucketKey, k -> new TokenBucket(limit));
        
        // Try to consume a token
        if (bucket.tryConsume()) {
            // Request allowed, proceed
            chain.doFilter(request, response);
        } else {
            // Rate limit exceeded
            long retryAfterSeconds = bucket.getTimeUntilRefill();
            
            log.warn("Rate limit exceeded for IP: {} on endpoint: {} (limit: {}/min)", 
                clientIp, requestURI, limit);
            
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
     * Determine rate limit based on endpoint pattern
     */
    private int determineRateLimit(String uri) {
        if (uri.startsWith("/api/auth/login") || uri.startsWith("/api/auth/otp")) {
            return loginLimit;  // Strict limit for auth endpoints
        } else if (uri.startsWith("/api/admin")) {
            return adminLimit;  // Moderate limit for admin endpoints
        } else {
            return generalLimit;  // Generous limit for public endpoints
        }
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
        log.info("Rate limiting filter initialized - Login: {}/min, Admin: {}/min, General: {}/min",
            loginLimit, adminLimit, generalLimit);
    }
    
    @Override
    public void destroy() {
        buckets.clear();
    }
    
    /**
     * Token bucket implementation for rate limiting
     * 
     * Algorithm:
     * - Bucket has a maximum capacity (rate limit)
     * - Tokens are added at a constant rate (1 per second)
     * - Each request consumes 1 token
     * - If no tokens available, request is rejected
     */
    private static class TokenBucket {
        private final int capacity;
        private final long refillIntervalMs;
        private int tokens;
        private long lastRefillTime;
        private long lastAccessTime;
        
        public TokenBucket(int tokensPerMinute) {
            this.capacity = tokensPerMinute;
            this.tokens = tokensPerMinute;
            this.refillIntervalMs = TimeUnit.MINUTES.toMillis(1) / tokensPerMinute;
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

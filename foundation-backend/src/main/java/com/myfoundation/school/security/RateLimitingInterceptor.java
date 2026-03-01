package com.myfoundation.school.security;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.HashMap;
import java.util.Map;

/**
 * Sliding-window rate limiter applied per endpoint prefix.
 *
 * All limits and the window duration are configurable via application properties:
 *   app.rate-limit.window-seconds           – window for most endpoints (default: 1)
 *   app.rate-limit.auth-login-window-seconds – login/OTP window (default: 60, brute-force protection)
 *   app.rate-limit.endpoint-auth-login      – max login requests per auth window (default: 7)
 *   app.rate-limit.endpoint-donation-create – max donation-create requests per window (default: 20)
 *   app.rate-limit.endpoint-webhook         – max webhook requests per window (default: 120)
 *   app.rate-limit.endpoint-campaigns       – max campaign requests per window (default: 100)
 *   app.rate-limit.endpoint-categories      – max category requests per window (default: 50)
 *   app.rate-limit.endpoint-cms             – max CMS requests per window (default: 50)
 *   app.rate-limit.endpoint-config          – max config/settings requests per window (default: 50)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitingInterceptor implements HandlerInterceptor {

    private final RateLimiterService rateLimiterService;

    // ── Window configuration ────────────────────────────────────────────────

    /** General window in seconds (used for all non-auth endpoints). */
    @Value("${app.rate-limit.window-seconds:1}")
    private long windowSeconds;

    /** Separate, longer window for login/OTP to resist brute-force. */
    @Value("${app.rate-limit.auth-login-window-seconds:60}")
    private long authLoginWindowSeconds;

    // ── Per-endpoint caps (requests per their respective window) ─────────────

    @Value("${app.rate-limit.endpoint-auth-login:7}")
    private int authLoginMax;

    @Value("${app.rate-limit.endpoint-donation-create:20}")
    private int donationCreateMax;

    @Value("${app.rate-limit.endpoint-webhook:120}")
    private int webhookMax;

    @Value("${app.rate-limit.endpoint-campaigns:100}")
    private int campaignsMax;

    @Value("${app.rate-limit.endpoint-categories:50}")
    private int categoriesMax;

    @Value("${app.rate-limit.endpoint-cms:50}")
    private int cmsMax;

    @Value("${app.rate-limit.endpoint-config:50}")
    private int configMax;

    // Built after all @Value fields are injected
    private Map<String, LimitConfig> limits;

    @PostConstruct
    void initLimits() {
        Map<String, LimitConfig> m = new HashMap<>();
        m.put("/api/auth/login",               new LimitConfig(authLoginMax,    authLoginWindowSeconds));
        m.put("/api/auth/otp",                 new LimitConfig(authLoginMax,    authLoginWindowSeconds));
        m.put("/api/donations/stripe/create",  new LimitConfig(donationCreateMax, windowSeconds));
        m.put("/api/donations/stripe/webhook", new LimitConfig(webhookMax,      windowSeconds));
        m.put("/api/campaigns",                new LimitConfig(campaignsMax,    windowSeconds));
        m.put("/api/categories",               new LimitConfig(categoriesMax,   windowSeconds));
        m.put("/api/cms",                      new LimitConfig(cmsMax,          windowSeconds));
        m.put("/api/config/public",            new LimitConfig(configMax,       windowSeconds));
        m.put("/api/settings/public",          new LimitConfig(configMax,       windowSeconds));
        m.put("/api/public",                   new LimitConfig(configMax,       windowSeconds));
        limits = Map.copyOf(m);

        log.info("RateLimitingInterceptor initialised — window={}s, authWindow={}s, " +
                 "login={}/authWindow, campaigns={}/window, general={}/window",
                windowSeconds, authLoginWindowSeconds, authLoginMax, campaignsMax, configMax);
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String path = request.getRequestURI();
        LimitConfig config = limits.entrySet().stream()
                .filter(e -> path.startsWith(e.getKey()))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse(null);

        if (config == null) {
            return true;
        }

        String client = clientKey(request);
        boolean allowed = rateLimiterService.isAllowed(client + ":" + config.hashCode(), config.maxRequests, config.windowSeconds);
        if (!allowed) {
            log.warn("Rate limit exceeded for {} on path {} (limit={} per {}s)", client, path, config.maxRequests, config.windowSeconds);
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(config.windowSeconds));
            return false;
        }
        return true;
    }

    private String clientKey(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isBlank()) {
            return ip.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private record LimitConfig(int maxRequests, long windowSeconds) {}
}

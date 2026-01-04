package com.myfoundation.school.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitingInterceptor implements HandlerInterceptor {

    private final RateLimiterService rateLimiterService;

    // pathPrefix -> (maxRequests, windowSeconds)
    private final Map<String, LimitConfig> limits = Map.of(
            // login brute-force: ~7 requests/min/IP
            "/api/auth/login", new LimitConfig(7, 60),
            // donation creation: moderate burst allowed
            "/api/donations/stripe/create", new LimitConfig(20, 60),
            // webhook: higher tolerance but still bounded
            "/api/donations/stripe/webhook", new LimitConfig(120, 60),
            // public campaigns: prevent scraping/DDoS
            "/api/campaigns", new LimitConfig(100, 60),
            // public categories: prevent scraping
            "/api/categories", new LimitConfig(50, 60),
            // public CMS content
            "/api/cms", new LimitConfig(50, 60),
            // public config
            "/api/config/public", new LimitConfig(50, 60),
            "/api/settings/public", new LimitConfig(50, 60),
            "/api/public", new LimitConfig(50, 60)
    );

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

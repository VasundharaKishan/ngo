package com.myfoundation.school.security;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Very small in-memory sliding window rate limiter keyed by client identifier.
 * Suitable for low-volume endpoints (login, webhook) to reduce brute-force/abuse.
 */
@Service
public class RateLimiterService {

    private static final class Window {
        final Deque<Long> hits = new ArrayDeque<>();
    }

    private final Map<String, Window> buckets = new ConcurrentHashMap<>();

    public boolean isAllowed(String key, int maxRequests, long windowSeconds) {
        long now = Instant.now().getEpochSecond();
        Window window = buckets.computeIfAbsent(key, k -> new Window());
        synchronized (window) {
            while (!window.hits.isEmpty() && window.hits.peekFirst() <= now - windowSeconds) {
                window.hits.removeFirst();
            }
            if (window.hits.size() >= maxRequests) {
                return false;
            }
            window.hits.addLast(now);
            return true;
        }
    }
}

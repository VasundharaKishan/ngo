package com.myfoundation.school.security;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimiterService {

    private static final long MAX_WINDOW_SECONDS = 3600;

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

    @Scheduled(fixedRate = 600_000)
    void evictStaleEntries() {
        long cutoff = Instant.now().getEpochSecond() - MAX_WINDOW_SECONDS;
        buckets.entrySet().removeIf(entry -> {
            Window w = entry.getValue();
            synchronized (w) {
                while (!w.hits.isEmpty() && w.hits.peekFirst() <= cutoff) {
                    w.hits.removeFirst();
                }
                return w.hits.isEmpty();
            }
        });
    }
}

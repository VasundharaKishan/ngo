package com.myfoundation.school.webhook;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple in-memory replay guard keyed by Stripe event id.
 */
@Component
public class WebhookReplayGuard {

    private static final long TTL_SECONDS = 24 * 60 * 60;

    private final Map<String, Long> seen = new ConcurrentHashMap<>();

    public boolean isReplay(String eventId) {
        if (eventId == null || eventId.isBlank()) {
            return false;
        }
        long now = Instant.now().getEpochSecond();
        cleanup(now);
        Long existing = seen.putIfAbsent(eventId, now);
        return existing != null;
    }

    private void cleanup(long nowSeconds) {
        seen.entrySet().removeIf(e -> e.getValue() < nowSeconds - TTL_SECONDS);
    }
}

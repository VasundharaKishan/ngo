package com.myfoundation.school.security;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class RateLimiterServiceTest {

    private final RateLimiterService limiter = new RateLimiterService();

    @Test
    void allowsWithinLimit() {
        String key = "test-allow";
        for (int i = 0; i < 5; i++) {
            assertTrue(limiter.isAllowed(key, 5, 60));
        }
    }

    @Test
    void blocksWhenExceedingLimit() {
        String key = "test-block";
        for (int i = 0; i < 7; i++) {
            limiter.isAllowed(key, 5, 60);
        }
        assertFalse(limiter.isAllowed(key, 5, 60));
    }
}

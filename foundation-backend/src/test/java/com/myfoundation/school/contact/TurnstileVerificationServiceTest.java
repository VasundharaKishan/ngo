package com.myfoundation.school.contact;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for {@link TurnstileVerificationService}.
 *
 * <p>Network-hitting tests (real Cloudflare calls) are skipped — they belong in
 * integration/smoke tests. This suite focuses on constructor behaviour and the
 * disabled-mode fast-path.</p>
 */
class TurnstileVerificationServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    // ===================== disabled mode =====================

    @Test
    void disabledWhenSecretKeyIsEmpty() {
        TurnstileVerificationService svc = new TurnstileVerificationService("", objectMapper);
        assertFalse(svc.isEnabled());
    }

    @Test
    void disabledWhenSecretKeyIsNull() {
        // Spring @Value with default "" can still produce null in edge cases
        TurnstileVerificationService svc = new TurnstileVerificationService(null, objectMapper);
        assertFalse(svc.isEnabled());
    }

    @Test
    void disabledWhenSecretKeyIsBlank() {
        TurnstileVerificationService svc = new TurnstileVerificationService("   ", objectMapper);
        assertFalse(svc.isEnabled());
    }

    @Test
    void disabledMode_verifyAlwaysReturnsTrue() {
        TurnstileVerificationService svc = new TurnstileVerificationService("", objectMapper);
        assertTrue(svc.verify("any-token", "1.2.3.4"));
    }

    @Test
    void disabledMode_verifyReturnsTrueEvenWithNullToken() {
        TurnstileVerificationService svc = new TurnstileVerificationService("", objectMapper);
        assertTrue(svc.verify(null, "1.2.3.4"));
    }

    // ===================== enabled mode (no network) =====================

    @Test
    void enabledWhenSecretKeyIsSet() {
        TurnstileVerificationService svc = new TurnstileVerificationService("my-secret", objectMapper);
        assertTrue(svc.isEnabled());
    }

    @Test
    void enabledMode_nullTokenReturnsFalse() {
        TurnstileVerificationService svc = new TurnstileVerificationService("my-secret", objectMapper);
        assertFalse(svc.verify(null, "1.2.3.4"));
    }

    @Test
    void enabledMode_emptyTokenReturnsFalse() {
        TurnstileVerificationService svc = new TurnstileVerificationService("my-secret", objectMapper);
        assertFalse(svc.verify("", "1.2.3.4"));
    }

    @Test
    void enabledMode_blankTokenReturnsFalse() {
        TurnstileVerificationService svc = new TurnstileVerificationService("my-secret", objectMapper);
        assertFalse(svc.verify("   ", "1.2.3.4"));
    }

    @Test
    void enabledMode_invalidSecretKey_networkCallFails_returnsFalse() {
        // Uses a bogus secret key — Cloudflare will reject it but the service
        // should catch the error and return false, not throw.
        TurnstileVerificationService svc = new TurnstileVerificationService(
                "not-a-real-secret", objectMapper);
        // The actual HTTP call will either fail or return success=false
        boolean result = svc.verify("some-token", "1.2.3.4");
        assertFalse(result);
    }

    // ===================== Cloudflare test keys =====================

    @Test
    void cloudflareAlwaysPassesKey_isEnabled() {
        // Cloudflare's official test secret: always-passes
        TurnstileVerificationService svc = new TurnstileVerificationService(
                "1x0000000000000000000000000000000AA", objectMapper);
        assertTrue(svc.isEnabled());
    }
}

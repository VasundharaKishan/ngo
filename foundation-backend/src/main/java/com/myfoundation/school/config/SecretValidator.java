package com.myfoundation.school.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Set;

/**
 * Validates that production-critical secrets are not using placeholder defaults.
 * In non-dev profiles, the application will fail to start if insecure defaults are detected.
 */
@Slf4j
@Component
public class SecretValidator {

    private static final Set<String> DEV_PROFILES = Set.of("dev", "local", "test");

    private static final String DEFAULT_JWT_SECRET = "change-this-secret-to-a-long-random-value-please";
    private static final String DEFAULT_STRIPE_KEY = "sk_test_your_key_here";
    private static final String DEFAULT_WEBHOOK_SECRET = "whsec_your_webhook_secret_here";

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${stripe.secret-key}")
    private String stripeSecretKey;

    @Value("${stripe.webhook-secret}")
    private String stripeWebhookSecret;

    private final Environment environment;

    public SecretValidator(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    public void validateSecrets() {
        if (isDevProfile()) {
            log.info("Running in dev/test profile — skipping secret validation");
            return;
        }

        StringBuilder errors = new StringBuilder();

        if (DEFAULT_JWT_SECRET.equals(jwtSecret)) {
            errors.append("  - app.jwt.secret is using the placeholder default. Set JWT_SECRET env variable.\n");
        }

        if (DEFAULT_STRIPE_KEY.equals(stripeSecretKey)) {
            errors.append("  - stripe.secret-key is using the placeholder default. Set STRIPE_SECRET_KEY env variable.\n");
        }

        if (DEFAULT_WEBHOOK_SECRET.equals(stripeWebhookSecret)) {
            errors.append("  - stripe.webhook-secret is using the placeholder default. Set STRIPE_WEBHOOK_SECRET env variable.\n");
        }

        if (!errors.isEmpty()) {
            String message = "SECURITY: Insecure default secrets detected in production!\n" + errors +
                    "Application startup aborted. Set proper secrets via environment variables.";
            log.error(message);
            throw new IllegalStateException(message);
        }

        log.info("Secret validation passed — all production secrets are properly configured");
    }

    private boolean isDevProfile() {
        String[] activeProfiles = environment.getActiveProfiles();
        if (activeProfiles.length == 0) {
            // No explicit profile = likely local development
            return true;
        }
        return Arrays.stream(activeProfiles)
                .anyMatch(profile -> DEV_PROFILES.contains(profile.toLowerCase()));
    }
}

package com.myfoundation.school.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Fail-fast validator that runs only under the "prod" Spring profile.
 *
 * Purpose: catch dangerous default values BEFORE the app starts serving traffic.
 * If any check fails, we throw an IllegalStateException which prevents the
 * ApplicationContext from starting — loud, obvious, unmissable in logs.
 *
 * Added as part of the fix/prod-blockers branch (B2 + B4).
 */
@Component
@Profile("prod")
@Slf4j
public class ProductionSafetyValidator {

    private static final String JWT_PLACEHOLDER_DEFAULT =
            "change-this-secret-to-a-long-random-value-please";
    private static final int MIN_JWT_SECRET_LENGTH = 32;

    @Value("${app.jwt.secret:}")
    private String jwtSecret;

    @Value("${app.allow-admin-bootstrap:false}")
    private boolean allowAdminBootstrap;

    @Value("${ADMIN_BOOTSTRAP_PASSWORD:}")
    private String adminBootstrapPassword;

    @Value("${spring.datasource.url:}")
    private String datasourceUrl;

    @Value("${stripe.secret-key:}")
    private String stripeSecretKey;

    @Value("${stripe.webhook-secret:}")
    private String stripeWebhookSecret;

    @PostConstruct
    public void validateProductionConfig() {
        log.info("Running production safety validation...");

        // B4: JWT secret must be set to a non-default, sufficiently long value
        if (jwtSecret == null || jwtSecret.isBlank()) {
            fail("JWT_SECRET (app.jwt.secret) is not set. Refusing to start prod.");
        }
        if (JWT_PLACEHOLDER_DEFAULT.equals(jwtSecret)) {
            fail("JWT_SECRET is still the placeholder default. Generate a secure random value of at least "
                    + MIN_JWT_SECRET_LENGTH + " chars.");
        }
        if (jwtSecret.length() < MIN_JWT_SECRET_LENGTH) {
            fail("JWT_SECRET is too short (" + jwtSecret.length() + " chars). Require at least "
                    + MIN_JWT_SECRET_LENGTH + ".");
        }

        // B2: if admin bootstrap is enabled in prod, require an explicit strong password
        if (allowAdminBootstrap) {
            if (adminBootstrapPassword == null || adminBootstrapPassword.isBlank()) {
                fail("ALLOW_ADMIN_BOOTSTRAP=true but ADMIN_BOOTSTRAP_PASSWORD is not set. "
                        + "Either disable bootstrap (set ALLOW_ADMIN_BOOTSTRAP=false) or provide a strong password.");
            }
            if (adminBootstrapPassword.length() < 12) {
                fail("ADMIN_BOOTSTRAP_PASSWORD is too short (" + adminBootstrapPassword.length()
                        + " chars). Require at least 12.");
            }
            log.warn("Admin bootstrap is ENABLED in prod. After first login, set ALLOW_ADMIN_BOOTSTRAP=false "
                    + "and rotate the password immediately.");
        }

        // Basic sanity: DB URL must be Postgres (not accidental H2)
        if (datasourceUrl == null || datasourceUrl.isBlank()) {
            fail("DATABASE_URL (spring.datasource.url) is not set.");
        }
        if (!datasourceUrl.startsWith("jdbc:postgresql:")) {
            fail("DATABASE_URL must be a PostgreSQL JDBC URL in prod. Got: " + summarize(datasourceUrl));
        }

        // Stripe keys must be live, not test, and not placeholders (warn, don't fail — sandbox prod is a valid use case)
        if (stripeSecretKey == null || stripeSecretKey.isBlank()
                || stripeSecretKey.contains("your_key_here")) {
            fail("STRIPE_SECRET_KEY is missing or is a placeholder.");
        }
        if (stripeWebhookSecret == null || stripeWebhookSecret.isBlank()
                || stripeWebhookSecret.contains("your_webhook_secret_here")) {
            fail("STRIPE_WEBHOOK_SECRET is missing or is a placeholder.");
        }
        if (stripeSecretKey.startsWith("sk_test_")) {
            log.warn("STRIPE_SECRET_KEY is a TEST key — confirm this is intentional for this environment.");
        }

        log.info("Production safety validation passed ✓");
    }

    private void fail(String reason) {
        String msg = "FATAL: production safety check failed — " + reason;
        log.error(msg);
        throw new IllegalStateException(msg);
    }

    /** Trim and mask a config value so we can log it without leaking. */
    private String summarize(String v) {
        if (v == null) return "<null>";
        if (v.length() <= 12) return v.substring(0, Math.min(4, v.length())) + "…";
        return v.substring(0, 8) + "…(" + v.length() + " chars)";
    }
}

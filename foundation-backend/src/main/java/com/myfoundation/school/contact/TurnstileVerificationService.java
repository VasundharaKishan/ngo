package com.myfoundation.school.contact;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;

/**
 * Verifies Cloudflare Turnstile tokens server-side.
 *
 * <p>Uses {@link java.net.http.HttpClient} directly — no Spring RestClient or
 * WebClient dependency needed for this single outbound call. Timeout is aggressive
 * (5 s) so the contact-form UX doesn't stall on Cloudflare latency.</p>
 *
 * <p>When the secret key is the special test value {@code "1x0000000000000000000000000000000AA"},
 * all tokens pass — Cloudflare's official "always passes" testing secret.
 * See https://developers.cloudflare.com/turnstile/troubleshooting/testing/</p>
 */
@Service
@Slf4j
public class TurnstileVerificationService {

    private static final String SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    private static final Duration TIMEOUT = Duration.ofSeconds(5);

    private final String secretKey;
    private final boolean enabled;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public TurnstileVerificationService(
            @Value("${app.captcha.turnstile.secret-key:}") String secretKey,
            ObjectMapper objectMapper
    ) {
        this.secretKey = secretKey;
        this.enabled = secretKey != null && !secretKey.isBlank();
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(TIMEOUT)
                .build();

        if (!enabled) {
            log.warn("Turnstile CAPTCHA is DISABLED — app.captcha.turnstile.secret-key is not configured. "
                    + "Contact form submissions will NOT require CAPTCHA verification.");
        } else {
            log.info("Turnstile CAPTCHA enabled");
        }
    }

    /**
     * Returns {@code true} when the token is valid, or when Turnstile is disabled
     * (secret key not configured). Returns {@code false} on verification failure
     * or network error.
     */
    public boolean verify(String token, String remoteIp) {
        if (!enabled) {
            return true;
        }
        if (token == null || token.isBlank()) {
            log.warn("Turnstile verification skipped — empty token");
            return false;
        }

        try {
            String formBody = "secret=" + secretKey
                    + "&response=" + token
                    + (remoteIp != null ? "&remoteip=" + remoteIp : "");

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(SITEVERIFY_URL))
                    .timeout(TIMEOUT)
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(formBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Turnstile siteverify returned HTTP {}", response.statusCode());
                return false;
            }

            TurnstileResponse result = objectMapper.readValue(response.body(), TurnstileResponse.class);
            if (!result.success()) {
                log.warn("Turnstile verification failed: errors={}", result.errorCodes());
            }
            return result.success();

        } catch (Exception e) {
            log.error("Turnstile verification error", e);
            return false;
        }
    }

    public boolean isEnabled() {
        return enabled;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record TurnstileResponse(
            boolean success,
            @JsonProperty("error-codes") List<String> errorCodes
    ) {}
}

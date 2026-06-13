package com.myfoundation.school.contact;

import com.myfoundation.school.contact.dto.ContactSubmissionRequest;
import com.myfoundation.school.security.ClientIpExtractor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Public contact-form endpoints.
 *
 * <p>{@code POST /api/public/contact} accepts a contact-form submission with a
 * Turnstile CAPTCHA token. The token is verified server-side before the submission
 * is persisted. Per-IP flood protection is enforced at the service layer (5/hr).</p>
 *
 * <p>{@code GET /api/public/contact/captcha-config} returns the Turnstile site key
 * so the frontend doesn't need to hardcode it. This is a public value (not a secret).</p>
 */
@RestController
@RequestMapping("/api/public/contact")
@RequiredArgsConstructor
@Slf4j
public class PublicContactController {

    private final ContactSubmissionService service;
    private final TurnstileVerificationService turnstileService;
    private final ClientIpExtractor clientIpExtractor;

    @org.springframework.beans.factory.annotation.Value("${app.captcha.turnstile.site-key:}")
    private String siteKey;

    @PostMapping
    public ResponseEntity<?> submit(
            @Valid @RequestBody ContactSubmissionRequest request,
            HttpServletRequest httpRequest) {
        try {
            String clientIp = extractClientIp(httpRequest);
            service.submit(request, clientIp);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Thank you for contacting us. We'll reply within a week."
            ));
        } catch (IllegalStateException e) {
            log.warn("Contact submission rejected: {}", e.getMessage());
            return ResponseEntity.status(429).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /** Returns CAPTCHA widget config for the frontend. Public, no secret. */
    @GetMapping("/captcha-config")
    public ResponseEntity<Map<String, Object>> captchaConfig() {
        return ResponseEntity.ok(Map.of(
                "enabled", turnstileService.isEnabled(),
                "siteKey", siteKey != null ? siteKey : ""
        ));
    }

    private String extractClientIp(HttpServletRequest request) {
        return clientIpExtractor.extract(request);
    }
}

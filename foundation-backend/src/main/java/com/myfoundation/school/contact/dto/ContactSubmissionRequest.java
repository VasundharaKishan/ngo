package com.myfoundation.school.contact.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Public contact-form payload. The {@code turnstileToken} is the
 * {@code cf-turnstile-response} value produced by the Turnstile widget.
 * It is verified server-side before the submission is persisted.
 */
public record ContactSubmissionRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 200)
        String name,

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        @Size(max = 320)
        String email,

        @NotBlank(message = "Subject is required")
        @Size(max = 200)
        String subject,

        @NotBlank(message = "Message is required")
        @Size(min = 20, max = 8000, message = "Message must be between 20 and 8000 characters")
        String message,

        // No @NotBlank here — when CAPTCHA is disabled the frontend sends an empty
        // string and TurnstileVerificationService.verify() returns true without
        // inspecting the token. When CAPTCHA is enabled, an empty/null token causes
        // verify() to return false and the service throws IllegalStateException.
        String turnstileToken
) {}

package com.myfoundation.school.heropanel.dto;

import com.myfoundation.school.heropanel.BackgroundFocus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Admin update payload for the hero panel. Nullable fields may be sent as {@code null}
 * or empty string — the service normalises blank strings to {@code null}.
 */
public record HeroPanelUpdateRequest(
        @Size(max = 120)
        String eyebrow,

        @NotBlank(message = "headline is required")
        @Size(max = 240)
        String headline,

        @Size(max = 500)
        String subtitle,

        @Size(max = 64)
        String primaryCtaLabel,

        @Size(max = 500)
        String primaryCtaHref,

        @Size(max = 1000)
        String backgroundImageUrl,

        @NotNull(message = "backgroundFocus is required")
        BackgroundFocus backgroundFocus,

        boolean enabled
) {}

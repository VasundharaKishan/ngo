package com.myfoundation.school.heropanel.dto;

import com.myfoundation.school.heropanel.BackgroundFocus;
import com.myfoundation.school.heropanel.HeroPanel;

import java.time.Instant;

/**
 * Admin-facing projection. Identical to public except includes audit fields.
 */
public record HeroPanelResponse(
        String eyebrow,
        String headline,
        String subtitle,
        String primaryCtaLabel,
        String primaryCtaHref,
        String backgroundImageUrl,
        BackgroundFocus backgroundFocus,
        boolean enabled,
        Instant updatedAt,
        String updatedBy
) {
    public static HeroPanelResponse from(HeroPanel h) {
        return new HeroPanelResponse(
                h.getEyebrow(),
                h.getHeadline(),
                h.getSubtitle(),
                h.getPrimaryCtaLabel(),
                h.getPrimaryCtaHref(),
                h.getBackgroundImageUrl(),
                h.getBackgroundFocus(),
                h.isEnabled(),
                h.getUpdatedAt(),
                h.getUpdatedBy()
        );
    }
}

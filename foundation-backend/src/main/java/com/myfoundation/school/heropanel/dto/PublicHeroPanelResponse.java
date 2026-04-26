package com.myfoundation.school.heropanel.dto;

import com.myfoundation.school.heropanel.BackgroundFocus;
import com.myfoundation.school.heropanel.HeroPanel;

/**
 * Public projection. Drops audit fields. When the panel is disabled, the public controller
 * returns {@code null} (frontend falls back to a static default) rather than this DTO.
 */
public record PublicHeroPanelResponse(
        String eyebrow,
        String headline,
        String subtitle,
        String primaryCtaLabel,
        String primaryCtaHref,
        String backgroundImageUrl,
        BackgroundFocus backgroundFocus
) {
    public static PublicHeroPanelResponse from(HeroPanel h) {
        return new PublicHeroPanelResponse(
                h.getEyebrow(),
                h.getHeadline(),
                h.getSubtitle(),
                h.getPrimaryCtaLabel(),
                h.getPrimaryCtaHref(),
                h.getBackgroundImageUrl(),
                h.getBackgroundFocus()
        );
    }
}

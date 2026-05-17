package com.myfoundation.school.trustbadge.dto;

import com.myfoundation.school.trustbadge.TrustBadge;

import java.time.Instant;

/** Full projection for admin consumers. */
public record TrustBadgeResponse(
        Long id,
        String slotKey,
        String iconEmoji,
        String title,
        String description,
        boolean enabled,
        boolean showInStrip,
        boolean showInGrid,
        boolean registrationGated,
        int sortOrder,
        Instant updatedAt,
        String updatedBy
) {
    public static TrustBadgeResponse from(TrustBadge b) {
        return new TrustBadgeResponse(
                b.getId(),
                b.getSlotKey(),
                b.getIconEmoji(),
                b.getTitle(),
                b.getDescription(),
                b.isEnabled(),
                b.isShowInStrip(),
                b.isShowInGrid(),
                b.isRegistrationGated(),
                b.getSortOrder(),
                b.getUpdatedAt(),
                b.getUpdatedBy()
        );
    }
}

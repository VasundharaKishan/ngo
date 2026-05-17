package com.myfoundation.school.trustbadge.dto;

import com.myfoundation.school.trustbadge.TrustBadge;

/**
 * Public projection — drops audit fields. The server has already filtered out disabled
 * and registration-gated rows before returning, so frontend can render this list as-is.
 */
public record PublicTrustBadgeResponse(
        String slotKey,
        String iconEmoji,
        String title,
        String description,
        boolean showInStrip,
        boolean showInGrid,
        int sortOrder
) {
    public static PublicTrustBadgeResponse from(TrustBadge b) {
        return new PublicTrustBadgeResponse(
                b.getSlotKey(),
                b.getIconEmoji(),
                b.getTitle(),
                b.getDescription(),
                b.isShowInStrip(),
                b.isShowInGrid(),
                b.getSortOrder()
        );
    }
}

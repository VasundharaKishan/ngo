package com.myfoundation.school.announcementbar.dto;

import com.myfoundation.school.announcementbar.AnnouncementBar;
import com.myfoundation.school.announcementbar.AnnouncementStyle;

import java.time.Instant;

/**
 * Admin-facing representation of the announcement bar. Includes audit fields and a
 * {@code publiclyVisible} flag so the admin UI can show whether the current record
 * is live for visitors without re-computing the window client-side.
 */
public record AnnouncementBarResponse(
        boolean enabled,
        String iconEmoji,
        String message,
        String linkUrl,
        String linkLabel,
        AnnouncementStyle style,
        boolean dismissible,
        Instant startsAt,
        Instant endsAt,
        Instant updatedAt,
        String updatedBy,
        boolean publiclyVisible
) {
    public static AnnouncementBarResponse from(AnnouncementBar bar, Instant now) {
        return new AnnouncementBarResponse(
                bar.isEnabled(),
                bar.getIconEmoji(),
                bar.getMessage(),
                bar.getLinkUrl(),
                bar.getLinkLabel(),
                bar.getStyle(),
                bar.isDismissible(),
                bar.getStartsAt(),
                bar.getEndsAt(),
                bar.getUpdatedAt(),
                bar.getUpdatedBy(),
                bar.isWithinWindow(now)
        );
    }
}

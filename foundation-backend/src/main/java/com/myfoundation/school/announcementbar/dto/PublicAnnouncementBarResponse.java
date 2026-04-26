package com.myfoundation.school.announcementbar.dto;

import com.myfoundation.school.announcementbar.AnnouncementBar;
import com.myfoundation.school.announcementbar.AnnouncementStyle;

import java.time.Instant;

/**
 * Public-facing representation — no audit fields, no window boundaries (if the server
 * chose to send this at all the bar is already live). {@code updatedAt} is kept so the
 * frontend can key per-visitor localStorage dismissal on the bar's publish timestamp:
 * a fresh announcement (new updated_at) re-appears for users who dismissed an earlier one.
 */
public record PublicAnnouncementBarResponse(
        String iconEmoji,
        String message,
        String linkUrl,
        String linkLabel,
        AnnouncementStyle style,
        boolean dismissible,
        Instant updatedAt
) {
    public static PublicAnnouncementBarResponse from(AnnouncementBar bar) {
        return new PublicAnnouncementBarResponse(
                bar.getIconEmoji(),
                bar.getMessage(),
                bar.getLinkUrl(),
                bar.getLinkLabel(),
                bar.getStyle(),
                bar.isDismissible(),
                bar.getUpdatedAt()
        );
    }
}

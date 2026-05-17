package com.myfoundation.school.announcementbar.dto;

import com.myfoundation.school.announcementbar.AnnouncementStyle;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

/**
 * Admin payload for updating the announcement bar singleton.
 *
 * <p>Nullable string fields may be sent as {@code null} or empty — the service normalises
 * blank strings to {@code null} so the database stays clean. Time-window fields are both
 * optional; a null boundary means "open-ended on that side".</p>
 */
public record AnnouncementBarUpdateRequest(
        boolean enabled,

        @Size(max = 16)
        String iconEmoji,

        @NotBlank(message = "message is required")
        @Size(max = 500)
        String message,

        @Size(max = 500)
        String linkUrl,

        @Size(max = 64)
        String linkLabel,

        @NotNull(message = "style is required")
        AnnouncementStyle style,

        boolean dismissible,

        Instant startsAt,

        Instant endsAt
) {}

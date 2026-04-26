package com.myfoundation.school.trustbadge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * Admin upsert payload. {@code slotKey} is only set on create (ignored on update —
 * the URL path-variable owns identity). Validation mirrors the DB constraints in
 * {@code V25__create_trust_badges_table.sql}.
 */
public record TrustBadgeUpsertRequest(
        @Pattern(regexp = "^[a-z0-9_]{1,64}$",
                message = "slotKey must be lowercase a-z, 0-9, and underscores, 1-64 chars")
        String slotKey,

        @NotBlank @Size(max = 16)
        String iconEmoji,

        @NotBlank @Size(max = 120)
        String title,

        @NotBlank @Size(max = 500)
        String description,

        boolean enabled,
        boolean showInStrip,
        boolean showInGrid,
        boolean registrationGated,

        @PositiveOrZero
        int sortOrder
) {}

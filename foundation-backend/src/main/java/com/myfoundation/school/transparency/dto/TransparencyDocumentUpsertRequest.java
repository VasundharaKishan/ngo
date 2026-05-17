package com.myfoundation.school.transparency.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Admin payload for creating or updating a {@link com.myfoundation.school.transparency.TransparencyDocument}.
 *
 * <p>{@code linkUrl} must start with http(s) — we never accept relative paths or other
 * schemes, since the link is rendered as an external anchor on the public Transparency
 * page and an unexpected scheme could leak users into unsafe contexts.</p>
 *
 * <p>Optional fields (description, category, periodLabel, issuedDate) may be sent as
 * {@code null} or empty strings — the service normalises blank strings to {@code null}.</p>
 */
public record TransparencyDocumentUpsertRequest(
        @NotBlank(message = "title is required")
        @Size(max = 200)
        String title,

        @Size(max = 4000, message = "description is unusually long — keep it under 4000 characters")
        String description,

        @Size(max = 80)
        String category,

        @NotBlank(message = "linkUrl is required")
        @Size(max = 2000)
        @Pattern(regexp = "^https?://.+", message = "linkUrl must start with http:// or https://")
        String linkUrl,

        LocalDate issuedDate,

        @Size(max = 80)
        String periodLabel,

        boolean enabled,

        @PositiveOrZero
        int sortOrder
) {}

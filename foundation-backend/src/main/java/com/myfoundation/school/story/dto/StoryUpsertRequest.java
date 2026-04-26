package com.myfoundation.school.story.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * Admin payload for creating or updating a {@link com.myfoundation.school.story.Story}.
 *
 * <p>{@code quote} is unbounded at the validation layer (column is TEXT) but the admin UI
 * surfaces a soft length warning to keep stories readable. Optional fields may be sent
 * as {@code null} or empty — the service normalises blank strings to {@code null}.</p>
 */
public record StoryUpsertRequest(
        @NotBlank(message = "title is required")
        @Size(max = 160)
        String title,

        @NotBlank(message = "quote is required")
        @Size(max = 4000, message = "quote is unusually long — keep stories under 4000 characters")
        String quote,

        @NotBlank(message = "attribution is required")
        @Size(max = 160)
        String attribution,

        @Size(max = 1000)
        String imageUrl,

        @Size(max = 80)
        String programTag,

        @Size(max = 120)
        String location,

        boolean enabled,

        @PositiveOrZero
        int sortOrder
) {}

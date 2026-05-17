package com.myfoundation.school.faq.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * Admin payload for creating or updating a {@link com.myfoundation.school.faq.Faq}.
 *
 * <p>{@code answer} is unbounded by the database (TEXT) but the validation cap of 8000
 * chars matches what the admin UI permits and protects against accidentally pasted
 * essays. Optional fields may be sent as {@code null} or empty — the service normalises
 * blank strings to {@code null}.</p>
 */
public record FaqUpsertRequest(
        @NotBlank(message = "question is required")
        @Size(max = 500)
        String question,

        @NotBlank(message = "answer is required")
        @Size(max = 8000, message = "answer is unusually long — keep FAQs under 8000 characters")
        String answer,

        @Size(max = 80)
        String category,

        boolean enabled,

        @PositiveOrZero
        int sortOrder
) {}

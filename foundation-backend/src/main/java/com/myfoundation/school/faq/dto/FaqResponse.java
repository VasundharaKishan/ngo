package com.myfoundation.school.faq.dto;

import com.myfoundation.school.faq.Faq;

import java.time.Instant;

/** Admin-facing response — full FAQ plus audit fields. */
public record FaqResponse(
        Long id,
        String question,
        String answer,
        String category,
        boolean enabled,
        int sortOrder,
        Instant updatedAt,
        String updatedBy
) {
    public static FaqResponse from(Faq f) {
        return new FaqResponse(
                f.getId(),
                f.getQuestion(),
                f.getAnswer(),
                f.getCategory(),
                f.isEnabled(),
                f.getSortOrder(),
                f.getUpdatedAt(),
                f.getUpdatedBy()
        );
    }
}

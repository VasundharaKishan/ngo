package com.myfoundation.school.faq.dto;

import com.myfoundation.school.faq.Faq;

/** Public-facing response — drops audit fields and sort_order. */
public record PublicFaqResponse(
        Long id,
        String question,
        String answer,
        String category
) {
    public static PublicFaqResponse from(Faq f) {
        return new PublicFaqResponse(
                f.getId(),
                f.getQuestion(),
                f.getAnswer(),
                f.getCategory()
        );
    }
}

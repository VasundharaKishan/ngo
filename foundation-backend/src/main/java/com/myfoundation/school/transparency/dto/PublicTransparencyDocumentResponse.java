package com.myfoundation.school.transparency.dto;

import com.myfoundation.school.transparency.TransparencyDocument;

import java.time.LocalDate;

/** Public-facing response — drops audit fields and sort_order. */
public record PublicTransparencyDocumentResponse(
        Long id,
        String title,
        String description,
        String category,
        String linkUrl,
        LocalDate issuedDate,
        String periodLabel
) {
    public static PublicTransparencyDocumentResponse from(TransparencyDocument d) {
        return new PublicTransparencyDocumentResponse(
                d.getId(),
                d.getTitle(),
                d.getDescription(),
                d.getCategory(),
                d.getLinkUrl(),
                d.getIssuedDate(),
                d.getPeriodLabel()
        );
    }
}

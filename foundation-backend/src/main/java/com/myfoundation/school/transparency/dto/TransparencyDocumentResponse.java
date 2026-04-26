package com.myfoundation.school.transparency.dto;

import com.myfoundation.school.transparency.TransparencyDocument;

import java.time.Instant;
import java.time.LocalDate;

/** Admin-facing response — full document plus audit fields. */
public record TransparencyDocumentResponse(
        Long id,
        String title,
        String description,
        String category,
        String linkUrl,
        LocalDate issuedDate,
        String periodLabel,
        boolean enabled,
        int sortOrder,
        Instant updatedAt,
        String updatedBy
) {
    public static TransparencyDocumentResponse from(TransparencyDocument d) {
        return new TransparencyDocumentResponse(
                d.getId(),
                d.getTitle(),
                d.getDescription(),
                d.getCategory(),
                d.getLinkUrl(),
                d.getIssuedDate(),
                d.getPeriodLabel(),
                d.isEnabled(),
                d.getSortOrder(),
                d.getUpdatedAt(),
                d.getUpdatedBy()
        );
    }
}

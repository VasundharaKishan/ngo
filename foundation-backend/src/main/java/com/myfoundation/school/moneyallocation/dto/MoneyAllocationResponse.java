package com.myfoundation.school.moneyallocation.dto;

import com.myfoundation.school.moneyallocation.MoneyAllocation;

import java.time.Instant;

/** Admin projection — includes audit fields and the registration gate info is surfaced separately. */
public record MoneyAllocationResponse(
        Long id,
        String iconEmoji,
        String label,
        Integer percentage,
        String description,
        String colorHex,
        boolean enabled,
        int sortOrder,
        Instant updatedAt,
        String updatedBy
) {
    public static MoneyAllocationResponse from(MoneyAllocation m) {
        return new MoneyAllocationResponse(
                m.getId(),
                m.getIconEmoji(),
                m.getLabel(),
                m.getPercentage(),
                m.getDescription(),
                m.getColorHex(),
                m.isEnabled(),
                m.getSortOrder(),
                m.getUpdatedAt(),
                m.getUpdatedBy()
        );
    }
}

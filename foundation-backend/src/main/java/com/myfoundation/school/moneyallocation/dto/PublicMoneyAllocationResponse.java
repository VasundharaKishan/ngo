package com.myfoundation.school.moneyallocation.dto;

import com.myfoundation.school.moneyallocation.MoneyAllocation;

/** Public projection — no audit fields. */
public record PublicMoneyAllocationResponse(
        Long id,
        String iconEmoji,
        String label,
        Integer percentage,
        String description,
        String colorHex
) {
    public static PublicMoneyAllocationResponse from(MoneyAllocation m) {
        return new PublicMoneyAllocationResponse(
                m.getId(),
                m.getIconEmoji(),
                m.getLabel(),
                m.getPercentage(),
                m.getDescription(),
                m.getColorHex()
        );
    }
}

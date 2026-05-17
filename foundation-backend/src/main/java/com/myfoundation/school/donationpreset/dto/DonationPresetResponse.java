package com.myfoundation.school.donationpreset.dto;

import com.myfoundation.school.donationpreset.DonationPreset;

import java.time.Instant;

/** Admin projection — includes audit fields. */
public record DonationPresetResponse(
        Long id,
        Integer amountMinorUnits,
        String label,
        boolean enabled,
        boolean isDefault,
        int sortOrder,
        Instant updatedAt,
        String updatedBy
) {
    public static DonationPresetResponse from(DonationPreset p) {
        return new DonationPresetResponse(
                p.getId(),
                p.getAmountMinorUnits(),
                p.getLabel(),
                p.isEnabled(),
                p.isDefault(),
                p.getSortOrder(),
                p.getUpdatedAt(),
                p.getUpdatedBy()
        );
    }
}

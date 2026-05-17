package com.myfoundation.school.donationpreset.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * Reorder payload: ordered list of preset IDs. The service assigns contiguous 10-step
 * {@code sort_order} values (10, 20, 30, …) based on position.
 */
public record DonationPresetReorderRequest(
        @NotEmpty
        List<Long> orderedIds
) {}

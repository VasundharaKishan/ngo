package com.myfoundation.school.donationpreset.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * Admin upsert payload for a donation preset. Amounts are in the currency's minor unit
 * (paise for INR) — matches Stripe and the frontend display math.
 *
 * <p>Note: {@code isDefault} is intentionally NOT settable from this payload. Promoting
 * a preset to "default" goes through the dedicated {@code POST /{id}/default} endpoint
 * so the single-default invariant is always enforced atomically.</p>
 */
public record DonationPresetUpsertRequest(
        @NotNull
        @Positive
        @Max(10_000_000) // ₹1,00,000 cap — arbitrary sanity limit, easy to relax later.
        Integer amountMinorUnits,

        @Size(max = 40)
        String label,

        boolean enabled,

        @PositiveOrZero
        int sortOrder
) {}

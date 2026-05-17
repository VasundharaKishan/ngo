package com.myfoundation.school.moneyallocation.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * Admin upsert payload for a money allocation row. Validation mirrors the DB
 * constraints in {@code V27__create_money_allocations_table.sql}.
 */
public record MoneyAllocationUpsertRequest(
        @NotBlank @Size(max = 16)
        String iconEmoji,

        @NotBlank @Size(max = 120)
        String label,

        @NotNull @Min(0) @Max(100)
        Integer percentage,

        @Size(max = 500)
        String description,

        // Accept 3- or 6-hex CSS color with optional alpha. Kept loose on purpose —
        // the admin field offers a color picker, so bad inputs are unlikely.
        @NotBlank
        @Pattern(regexp = "^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$",
                message = "colorHex must be a CSS hex color like #1e90ff")
        @Size(max = 9)
        String colorHex,

        boolean enabled,

        @PositiveOrZero
        int sortOrder
) {}

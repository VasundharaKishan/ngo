package com.myfoundation.school.moneyallocation.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * Reorder payload: ordered list of IDs. The service assigns contiguous 10-step
 * {@code sort_order} values (10, 20, 30, …) based on position.
 */
public record MoneyAllocationReorderRequest(
        @NotEmpty
        List<Long> orderedIds
) {}

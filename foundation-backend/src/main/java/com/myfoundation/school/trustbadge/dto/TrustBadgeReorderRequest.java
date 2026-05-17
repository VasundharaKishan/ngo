package com.myfoundation.school.trustbadge.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * Reorder payload: the ordered list of IDs in their new desired order. The service
 * will assign contiguous {@code sort_order} values (10, 20, 30, …) based on position.
 */
public record TrustBadgeReorderRequest(
        @NotEmpty
        List<Long> orderedIds
) {}

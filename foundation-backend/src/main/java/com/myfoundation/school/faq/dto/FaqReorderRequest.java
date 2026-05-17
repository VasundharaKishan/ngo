package com.myfoundation.school.faq.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * IDs in the order they should appear after the reorder. Service rewrites every row's
 * {@code sort_order} on a 10-step grid (mirrors {@code StoryService.reorder}).
 */
public record FaqReorderRequest(
        @NotEmpty(message = "orderedIds must not be empty")
        List<Long> orderedIds
) {}

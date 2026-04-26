package com.myfoundation.school.story.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * IDs in the order they should appear after the reorder. Service rewrites every row's
 * {@code sort_order} on a 10-step grid so future drag-and-drop can be done client-side
 * with halve-the-gap insertion if needed.
 */
public record StoryReorderRequest(
        @NotEmpty(message = "orderedIds must not be empty")
        List<Long> orderedIds
) {}

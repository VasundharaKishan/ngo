package com.myfoundation.school.story.dto;

import com.myfoundation.school.story.Story;

import java.time.Instant;

/** Admin-facing response — full story plus audit fields. */
public record StoryResponse(
        Long id,
        String title,
        String quote,
        String attribution,
        String imageUrl,
        String programTag,
        String location,
        boolean enabled,
        int sortOrder,
        Instant updatedAt,
        String updatedBy
) {
    public static StoryResponse from(Story s) {
        return new StoryResponse(
                s.getId(),
                s.getTitle(),
                s.getQuote(),
                s.getAttribution(),
                s.getImageUrl(),
                s.getProgramTag(),
                s.getLocation(),
                s.isEnabled(),
                s.getSortOrder(),
                s.getUpdatedAt(),
                s.getUpdatedBy()
        );
    }
}

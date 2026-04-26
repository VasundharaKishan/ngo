package com.myfoundation.school.story.dto;

import com.myfoundation.school.story.Story;

/** Public-facing response — drops audit fields, sort order, and id (clients render in array order). */
public record PublicStoryResponse(
        Long id,
        String title,
        String quote,
        String attribution,
        String imageUrl,
        String programTag,
        String location
) {
    public static PublicStoryResponse from(Story s) {
        return new PublicStoryResponse(
                s.getId(),
                s.getTitle(),
                s.getQuote(),
                s.getAttribution(),
                s.getImageUrl(),
                s.getProgramTag(),
                s.getLocation()
        );
    }
}

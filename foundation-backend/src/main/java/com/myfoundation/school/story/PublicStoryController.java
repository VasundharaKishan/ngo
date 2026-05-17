package com.myfoundation.school.story;

import com.myfoundation.school.story.dto.PublicStoryResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.List;

/**
 * Public stories endpoint.
 *
 * <p>Returns {@code 204 No Content} (short-cached) when the foundation is not in
 * APPROVED registration status, so the frontend renders nothing rather than an empty
 * list. When approved, returns enabled stories with a 5-minute cache — story copy
 * changes rarely once published and visitors benefit from the snappier load.</p>
 */
@RestController
@RequestMapping("/api/public/stories")
@RequiredArgsConstructor
@Slf4j
public class PublicStoryController {

    private final StoryService service;

    @GetMapping
    public ResponseEntity<List<PublicStoryResponse>> list() {
        if (!service.isDisclosed()) {
            return ResponseEntity.noContent()
                    .cacheControl(CacheControl.maxAge(Duration.ofSeconds(60)).cachePublic())
                    .build();
        }
        List<PublicStoryResponse> body = service.listForPublic().stream()
                .map(PublicStoryResponse::from)
                .toList();
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic())
                .body(body);
    }
}

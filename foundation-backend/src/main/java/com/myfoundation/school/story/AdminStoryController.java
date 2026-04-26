package com.myfoundation.school.story;

import com.myfoundation.school.story.dto.StoryReorderRequest;
import com.myfoundation.school.story.dto.StoryResponse;
import com.myfoundation.school.story.dto.StoryUpsertRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Admin CRUD for stories. Admin reads are intentionally NOT registration-gated so
 * operators can stage stories before the foundation is approved.
 */
@RestController
@RequestMapping("/api/admin/stories")
@PreAuthorize("hasAuthority('ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class AdminStoryController {

    private final StoryService service;

    @GetMapping
    public ResponseEntity<AdminListResponse> list() {
        List<StoryResponse> rows = service.listAll().stream()
                .map(StoryResponse::from)
                .toList();
        return ResponseEntity.ok(new AdminListResponse(rows, service.isDisclosed()));
    }

    @PostMapping
    public ResponseEntity<StoryResponse> create(@Valid @RequestBody StoryUpsertRequest request) {
        log.info("Admin creating story: title={}", request.title());
        return ResponseEntity.ok(StoryResponse.from(service.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StoryResponse> update(@PathVariable Long id,
                                                @Valid @RequestBody StoryUpsertRequest request) {
        log.info("Admin updating story: id={}", id);
        return ResponseEntity.ok(StoryResponse.from(service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        log.info("Admin deleting story: id={}", id);
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reorder")
    public ResponseEntity<List<StoryResponse>> reorder(@Valid @RequestBody StoryReorderRequest request) {
        log.info("Admin reordering stories: ids={}", request.orderedIds());
        List<StoryResponse> body = service.reorder(request).stream()
                .map(StoryResponse::from)
                .toList();
        return ResponseEntity.ok(body);
    }

    /**
     * Admin list envelope — bundles rows with the {@code publiclyVisible} signal so the
     * UI can show an accurate "live now / hidden until approval" banner without a second
     * request to the registration-info endpoint.
     */
    public record AdminListResponse(
            List<StoryResponse> rows,
            boolean publiclyVisible
    ) {}
}

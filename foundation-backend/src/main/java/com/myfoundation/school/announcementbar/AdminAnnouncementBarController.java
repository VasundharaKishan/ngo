package com.myfoundation.school.announcementbar;

import com.myfoundation.school.announcementbar.dto.AnnouncementBarResponse;
import com.myfoundation.school.announcementbar.dto.AnnouncementBarUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

/**
 * Admin endpoints for the announcement bar singleton. Path is {@code /announcement-bar}
 * (singular) to match {@code hero-panel}. Admin reads are intentionally <em>not</em> gated
 * by the time window — operators need to see and edit the record whether or not it's
 * currently live to visitors.
 */
@RestController
@RequestMapping("/api/admin/announcement-bar")
@PreAuthorize("hasAuthority('ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class AdminAnnouncementBarController {

    private final AnnouncementBarService service;

    @GetMapping
    public ResponseEntity<AnnouncementBarResponse> get() {
        log.debug("Admin fetching announcement bar");
        return ResponseEntity.ok(AnnouncementBarResponse.from(service.getCurrent(), Instant.now()));
    }

    @PutMapping
    public ResponseEntity<AnnouncementBarResponse> update(
            @Valid @RequestBody AnnouncementBarUpdateRequest request) {
        log.info("Admin updating announcement bar");
        return ResponseEntity.ok(
                AnnouncementBarResponse.from(service.update(request), Instant.now()));
    }
}

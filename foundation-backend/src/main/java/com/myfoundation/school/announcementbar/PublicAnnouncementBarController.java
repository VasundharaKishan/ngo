package com.myfoundation.school.announcementbar;

import com.myfoundation.school.announcementbar.dto.PublicAnnouncementBarResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

/**
 * Public announcement-bar endpoint. Returns {@code 204 No Content} when the bar is
 * disabled or currently outside its {@code starts_at}/{@code ends_at} window so the
 * frontend renders nothing and never flashes a message the admin hasn't launched yet.
 *
 * <p>Cache-Control is intentionally short (30s) because {@code ends_at} matters —
 * a long edge cache could keep a stale announcement visible past its deadline.
 * Admin updates still propagate quickly without operators having to bust caches.</p>
 */
@RestController
@RequestMapping("/api/public/announcement-bar")
@RequiredArgsConstructor
@Slf4j
public class PublicAnnouncementBarController {

    private static final Duration PUBLIC_CACHE = Duration.ofSeconds(30);

    private final AnnouncementBarService service;

    @GetMapping
    public ResponseEntity<PublicAnnouncementBarResponse> get() {
        return service.getCurrentForPublic()
                .map(bar -> ResponseEntity.ok()
                        .cacheControl(CacheControl.maxAge(PUBLIC_CACHE).cachePublic())
                        .body(PublicAnnouncementBarResponse.from(bar)))
                .orElseGet(() -> ResponseEntity.noContent()
                        .cacheControl(CacheControl.maxAge(PUBLIC_CACHE).cachePublic())
                        .<PublicAnnouncementBarResponse>build());
    }
}

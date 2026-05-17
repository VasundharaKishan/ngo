package com.myfoundation.school.heropanel;

import com.myfoundation.school.heropanel.dto.PublicHeroPanelResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

/**
 * Public hero-panel endpoint. Returns 204 No Content when the panel is disabled so the
 * frontend can render a static fallback without treating it as an error.
 *
 * <p>60s {@code Cache-Control: public, max-age=60} — hero edits should propagate reasonably
 * quickly after publish.</p>
 */
@RestController
@RequestMapping("/api/public/hero-panel")
@RequiredArgsConstructor
@Slf4j
public class PublicHeroPanelController {

    private final HeroPanelService service;

    @GetMapping
    public ResponseEntity<PublicHeroPanelResponse> get() {
        return service.getCurrentForPublic()
                .map(panel -> ResponseEntity.ok()
                        .cacheControl(CacheControl.maxAge(Duration.ofSeconds(60)).cachePublic())
                        .body(PublicHeroPanelResponse.from(panel)))
                .orElseGet(() -> ResponseEntity.noContent()
                        .cacheControl(CacheControl.maxAge(Duration.ofSeconds(60)).cachePublic())
                        .<PublicHeroPanelResponse>build());
    }
}

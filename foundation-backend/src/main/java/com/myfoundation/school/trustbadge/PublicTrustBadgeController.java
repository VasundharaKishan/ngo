package com.myfoundation.school.trustbadge;

import com.myfoundation.school.trustbadge.dto.PublicTrustBadgeResponse;
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
 * Public trust-badge endpoint. Returns only enabled badges; registration-gated rows are
 * filtered out server-side unless the RegistrationInfo singleton is in APPROVED status.
 *
 * <p>60s {@code Cache-Control: public, max-age=60} — admin edits should propagate within
 * roughly a minute.</p>
 */
@RestController
@RequestMapping("/api/public/trust-badges")
@RequiredArgsConstructor
@Slf4j
public class PublicTrustBadgeController {

    private final TrustBadgeService service;

    @GetMapping
    public ResponseEntity<List<PublicTrustBadgeResponse>> list() {
        List<PublicTrustBadgeResponse> body = service.listForPublic().stream()
                .map(PublicTrustBadgeResponse::from)
                .toList();
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofSeconds(60)).cachePublic())
                .body(body);
    }
}

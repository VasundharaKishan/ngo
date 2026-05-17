package com.myfoundation.school.heropanel;

import com.myfoundation.school.heropanel.dto.HeroPanelResponse;
import com.myfoundation.school.heropanel.dto.HeroPanelUpdateRequest;
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

/**
 * Admin endpoints for the hero panel singleton. Path is {@code /hero-panel} (singular)
 * to mirror the singleton nature and avoid clashes with the existing {@code hero-slides}
 * carousel endpoints.
 */
@RestController
@RequestMapping("/api/admin/hero-panel")
@PreAuthorize("hasAuthority('ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class AdminHeroPanelController {

    private final HeroPanelService service;

    @GetMapping
    public ResponseEntity<HeroPanelResponse> get() {
        log.debug("Admin fetching hero panel");
        return ResponseEntity.ok(HeroPanelResponse.from(service.getCurrent()));
    }

    @PutMapping
    public ResponseEntity<HeroPanelResponse> update(@Valid @RequestBody HeroPanelUpdateRequest request) {
        log.info("Admin updating hero panel");
        return ResponseEntity.ok(HeroPanelResponse.from(service.update(request)));
    }
}

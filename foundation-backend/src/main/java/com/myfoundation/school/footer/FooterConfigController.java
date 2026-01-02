package com.myfoundation.school.footer;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for managing footer configuration.
 * Provides both public and admin endpoints for footer settings.
 */
@RestController
@RequiredArgsConstructor
@Slf4j
public class FooterConfigController {

    private final FooterSettingsService footerSettingsService;

    /**
     * Public endpoint to get footer configuration.
     * Used by frontend Layout component to display footer content.
     */
    @GetMapping("/api/config/public/footer")
    public ResponseEntity<FooterConfigResponse> getPublicFooterConfig() {
        log.debug("GET /api/config/public/footer - Fetching public footer configuration");
        FooterConfigResponse response = footerSettingsService.getFooterConfig();
        return ResponseEntity.ok(response);
    }

    /**
     * Admin endpoint to get footer configuration for editing.
     */
    @GetMapping("/api/admin/config/footer")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<FooterConfigResponse> getAdminFooterConfig() {
        log.info("GET /api/admin/config/footer - Admin fetching footer configuration");
        FooterConfigResponse response = footerSettingsService.getFooterConfig();
        return ResponseEntity.ok(response);
    }

    /**
     * Admin endpoint to update footer configuration.
     */
    @PutMapping("/api/admin/config/footer")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<FooterConfigResponse> updateFooterConfig(
            @Valid @RequestBody FooterConfigRequest request) {
        log.info("PUT /api/admin/config/footer - Updating footer configuration");
        FooterConfigResponse response = footerSettingsService.updateFooterConfig(request);
        log.info("Footer configuration updated successfully");
        return ResponseEntity.ok(response);
    }
}

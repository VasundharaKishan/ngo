package com.myfoundation.school.contact;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Admin controller for managing contact settings.
 * Protected by JWT authentication - requires ADMIN role.
 */
@RestController
@RequestMapping("/api/admin/config")
@RequiredArgsConstructor
@Slf4j
public class AdminContactController {

    private final ContactSettingsService contactSettingsService;

    /**
     * Update contact information (email and locations).
     * Only accessible by authenticated admins.
     */
    @PutMapping("/contact")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ContactInfoResponse> updateContactInfo(
            @Valid @RequestBody ContactInfoRequest request) {
        
        log.info("PUT /api/admin/config/contact - Updating contact information");
        log.debug("Request: email={}, locations={}", 
            request.getEmail(), 
            request.getLocations().size());
        
        ContactInfoResponse response = contactSettingsService.updateContactInfo(request);
        
        log.info("Contact information updated successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * Get current contact information (same as public endpoint but through admin route).
     * Useful for admin UI to fetch current values for editing.
     */
    @GetMapping("/contact")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ContactInfoResponse> getContactInfo() {
        log.info("GET /api/admin/config/contact - Fetching contact information");
        ContactInfoResponse response = contactSettingsService.getContactInfo();
        return ResponseEntity.ok(response);
    }
}

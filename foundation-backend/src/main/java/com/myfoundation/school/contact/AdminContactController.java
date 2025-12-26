package com.myfoundation.school.contact;

import com.myfoundation.school.campaign.CampaignService;
import com.myfoundation.school.config.SiteConfigService;
import com.myfoundation.school.dto.CampaignSummaryDto;
import com.myfoundation.school.dto.DonatePopupSettingsRequest;
import com.myfoundation.school.dto.DonatePopupSettingsResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

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
    private final SiteConfigService siteConfigService;
    private final CampaignService campaignService;

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
    
    /**
     * Get current donate popup settings including spotlight campaign.
     */
    @GetMapping("/donate-popup")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<DonatePopupSettingsResponse> getDonatePopupSettings() {
        log.info("GET /api/admin/config/donate-popup - Fetching donate popup settings");
        
        String spotlightCampaignId = siteConfigService.getConfigValue("donate_popup.spotlight_campaign_id");
        
        DonatePopupSettingsResponse.DonatePopupSettingsResponseBuilder builder = DonatePopupSettingsResponse.builder()
                .spotlightCampaignId(spotlightCampaignId);
        
        // If spotlight is set, fetch campaign details
        if (spotlightCampaignId != null && !spotlightCampaignId.isEmpty()) {
            Optional<CampaignSummaryDto> campaign = campaignService.getCampaignSummary(spotlightCampaignId);
            campaign.ifPresent(builder::spotlightCampaign);
        }
        
        return ResponseEntity.ok(builder.build());
    }
    
    /**
     * Update donate popup settings (set or clear spotlight campaign).
     */
    @PutMapping("/donate-popup")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<DonatePopupSettingsResponse> updateDonatePopupSettings(
            @Valid @RequestBody DonatePopupSettingsRequest request) {
        
        log.info("PUT /api/admin/config/donate-popup - Updating donate popup settings");
        log.debug("Request: campaignId={}", request.getCampaignId());
        
        String campaignId = request.getCampaignId();
        
        // Validate campaign exists and is active if provided
        if (campaignId != null && !campaignId.isEmpty()) {
            Optional<CampaignSummaryDto> campaign = campaignService.getCampaignSummary(campaignId);
            
            if (campaign.isEmpty()) {
                log.error("Campaign not found: {}", campaignId);
                return ResponseEntity.badRequest().build();
            }
            
            if (!campaign.get().getActive()) {
                log.error("Campaign is not active: {}", campaignId);
                return ResponseEntity.badRequest().build();
            }
        }
        
        // Update config (null or empty means clear spotlight)
        String valueToStore = (campaignId == null || campaignId.isEmpty()) ? null : campaignId;
        siteConfigService.updateConfig(
            "donate_popup.spotlight_campaign_id",
            valueToStore,
            "Campaign ID to feature in Donate Now popup (null for automatic selection)"
        );
        
        log.info("Donate popup settings updated successfully");
        
        // Return updated settings
        return getDonatePopupSettings();
    }
}

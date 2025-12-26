package com.myfoundation.school.config;

import com.myfoundation.school.campaign.CampaignService;
import com.myfoundation.school.contact.ContactInfoResponse;
import com.myfoundation.school.contact.ContactSettingsService;
import com.myfoundation.school.dto.CampaignPopupDto;
import com.myfoundation.school.dto.DonatePopupResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Public endpoint for retrieving site configuration values
 * that are safe to expose to unauthenticated users.
 * 
 * Configuration Flow:
 * 1. Admin updates settings via POST /api/admin/config
 * 2. Values are saved to site_config table
 * 3. Frontend calls GET /api/config/public to fetch current values
 * 4. CampaignList.tsx uses itemsPerPage for pagination
 * 5. FeaturedCampaignModal queries with ?featured=true
 * 6. Backend automatically applies featuredCampaignsCount limit
 * 
 * Changes take effect immediately - no cache or restart needed.
 */
@RestController
@RequestMapping("/api/config")
@RequiredArgsConstructor
@Slf4j
public class PublicConfigController {
    
    private final SiteConfigService siteConfigService;
    private final ContactSettingsService contactSettingsService;
    private final CampaignService campaignService;
    
    /**
     * Get public-safe site configuration values.
     * Returns only configuration that should be visible to all users.
     */
    @GetMapping("/public")
    public ResponseEntity<Map<String, Object>> getPublicConfig() {
        log.info("GET /api/config/public - Fetching public site configuration");
        
        Map<String, Object> config = new HashMap<>();
        
        // Featured campaigns count for homepage
        config.put("featuredCampaignsCount", 
            siteConfigService.getIntConfigValue("homepage.featured_campaigns_count"));
        
        // Items per page for campaign list
        config.put("itemsPerPage", 
            siteConfigService.getIntConfigValue("campaigns_page.items_per_page"));
        
        return ResponseEntity.ok(config);
    }
    
    /**
     * Get public contact information.
     * Returns email and location details for display on website.
     */
    @GetMapping("/public/contact")
    public ResponseEntity<ContactInfoResponse> getPublicContactInfo() {
        log.info("GET /api/config/public/contact - Fetching public contact information");
        ContactInfoResponse contactInfo = contactSettingsService.getContactInfo();
        return ResponseEntity.ok(contactInfo);
    }
    
    /**
     * Get campaign for donate popup.
     * Returns spotlight campaign if set, otherwise returns fallback campaign.
     * Fallback logic: newest active campaign prioritized by featured > urgent > updatedAt DESC.
     */
    @GetMapping("/public/donate-popup")
    public ResponseEntity<DonatePopupResponse> getDonatePopup() {
        log.info("GET /api/config/public/donate-popup - Fetching donate popup campaign");
        
        String spotlightCampaignId = siteConfigService.getConfigValue("donate_popup.spotlight_campaign_id");
        
        // Try to get spotlight campaign if configured
        if (spotlightCampaignId != null && !spotlightCampaignId.isEmpty()) {
            Optional<CampaignPopupDto> spotlightCampaign = campaignService.getCampaignForPopup(spotlightCampaignId);
            
            if (spotlightCampaign.isPresent()) {
                log.info("Returning spotlight campaign: {}", spotlightCampaignId);
                return ResponseEntity.ok(DonatePopupResponse.builder()
                        .campaign(spotlightCampaign.get())
                        .mode("SPOTLIGHT")
                        .fallbackReason(null)
                        .build());
            } else {
                log.warn("Spotlight campaign {} not found or inactive, falling back", spotlightCampaignId);
            }
        }
        
        // Fallback to newest active campaign
        Optional<CampaignPopupDto> fallbackCampaign = campaignService.getFallbackCampaignForPopup();
        
        if (fallbackCampaign.isPresent()) {
            log.info("Returning fallback campaign");
            return ResponseEntity.ok(DonatePopupResponse.builder()
                    .campaign(fallbackCampaign.get())
                    .mode("FALLBACK")
                    .fallbackReason(spotlightCampaignId == null ? "NO_SPOTLIGHT_SET" : "SPOTLIGHT_INACTIVE")
                    .build());
        }
        
        // No campaigns available
        log.warn("No active campaigns available for donate popup");
        return ResponseEntity.ok(DonatePopupResponse.builder()
                .campaign(null)
                .mode("FALLBACK")
                .fallbackReason("NO_ACTIVE_CAMPAIGNS")
                .build());
    }
}

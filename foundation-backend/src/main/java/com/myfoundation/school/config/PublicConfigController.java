package com.myfoundation.school.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

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
}

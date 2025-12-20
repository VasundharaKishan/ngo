package com.myfoundation.school.campaign;

import com.myfoundation.school.config.SiteConfigService;
import com.myfoundation.school.dto.CampaignResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/campaigns")
@RequiredArgsConstructor
@Slf4j
public class CampaignController {
    
    private final CampaignService campaignService;
    private final SiteConfigService siteConfigService;
    
    @GetMapping
    public ResponseEntity<List<CampaignResponse>> getAllActiveCampaigns(
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) Boolean featured,
            @RequestParam(required = false) Boolean urgent,
            @RequestParam(required = false) Integer limit) {
        log.info("GET /api/campaigns - Fetching campaigns with filters: categoryId={}, featured={}, urgent={}, limit={}", 
                categoryId, featured, urgent, limit);
        
        // If featured and no explicit limit, use config value
        if (Boolean.TRUE.equals(featured) && limit == null) {
            limit = siteConfigService.getIntConfigValue("homepage.featured_campaigns_count");
        }
        
        List<CampaignResponse> campaigns = campaignService.getCampaigns(categoryId, featured, urgent);
        
        // Apply limit if specified
        if (limit != null && limit > 0 && campaigns.size() > limit) {
            campaigns = campaigns.subList(0, limit);
        }
        
        return ResponseEntity.ok(campaigns);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<CampaignResponse> getCampaignById(@PathVariable String id) {
        log.info("GET /api/campaigns/{} - Fetching campaign details", id);
        CampaignResponse campaign = campaignService.getCampaignById(id);
        return ResponseEntity.ok(campaign);
    }
}

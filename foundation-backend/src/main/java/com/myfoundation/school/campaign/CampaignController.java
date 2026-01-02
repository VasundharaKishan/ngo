package com.myfoundation.school.campaign;

import com.myfoundation.school.config.SiteConfigService;
import com.myfoundation.school.dto.CampaignResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/campaigns")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Campaigns", description = "Public endpoints for browsing active donation campaigns")
public class CampaignController {
    
    private final CampaignService campaignService;
    private final SiteConfigService siteConfigService;
    
    @Operation(
        summary = "Get all active campaigns",
        description = "Retrieves all active campaigns with optional filtering by category, featured status, or urgency. " +
                      "Results can be limited using the limit parameter."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Successfully retrieved campaigns",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = CampaignResponse.class)))
        )
    })
    @GetMapping
    public ResponseEntity<List<CampaignResponse>> getAllActiveCampaigns(
            @Parameter(description = "Filter by category ID") @RequestParam(required = false) String categoryId,
            @Parameter(description = "Filter featured campaigns only") @RequestParam(required = false) Boolean featured,
            @Parameter(description = "Filter urgent campaigns only") @RequestParam(required = false) Boolean urgent,
            @Parameter(description = "Maximum number of campaigns to return") @RequestParam(required = false) Integer limit) {
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
    
    @Operation(
        summary = "Get campaign by ID",
        description = "Retrieves detailed information about a specific campaign by its ID"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Campaign found",
            content = @Content(schema = @Schema(implementation = CampaignResponse.class))
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Campaign not found"
        )
    })
    @GetMapping("/{id}")
    public ResponseEntity<CampaignResponse> getCampaignById(
            @Parameter(description = "Campaign ID") @PathVariable String id) {
        log.info("GET /api/campaigns/{} - Fetching campaign details", id);
        CampaignResponse campaign = campaignService.getCampaignById(id);
        return ResponseEntity.ok(campaign);
    }
}

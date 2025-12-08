package com.myfoundation.school.campaign;

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
    
    @GetMapping
    public ResponseEntity<List<CampaignResponse>> getAllActiveCampaigns() {
        log.info("GET /api/campaigns - Fetching all active campaigns");
        List<CampaignResponse> campaigns = campaignService.getAllActiveCampaigns();
        return ResponseEntity.ok(campaigns);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<CampaignResponse> getCampaignById(@PathVariable String id) {
        log.info("GET /api/campaigns/{} - Fetching campaign details", id);
        CampaignResponse campaign = campaignService.getCampaignById(id);
        return ResponseEntity.ok(campaign);
    }
}

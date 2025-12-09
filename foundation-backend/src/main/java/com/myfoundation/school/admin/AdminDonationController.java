package com.myfoundation.school.admin;

import com.myfoundation.school.campaign.Campaign;
import com.myfoundation.school.campaign.CampaignRepository;
import com.myfoundation.school.campaign.Category;
import com.myfoundation.school.campaign.CategoryRepository;
import com.myfoundation.school.config.SiteConfig;
import com.myfoundation.school.config.SiteConfigRequest;
import com.myfoundation.school.config.SiteConfigService;
import com.myfoundation.school.donation.DonationService;
import com.myfoundation.school.dto.CampaignResponse;
import com.myfoundation.school.dto.DonationResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminDonationController {
    
    private final DonationService donationService;
    private final AdminCampaignService adminCampaignService;
    private final AdminCategoryService adminCategoryService;
    private final CampaignRepository campaignRepository;
    private final CategoryRepository categoryRepository;
    private final SiteConfigService siteConfigService;
    
    // Donation endpoints
    @GetMapping("/donations")
    public ResponseEntity<List<DonationResponse>> getAllDonations() {
        log.info("GET /api/admin/donations - Fetching all donations");
        List<DonationResponse> donations = donationService.getAllDonations();
        return ResponseEntity.ok(donations);
    }
    
    // Campaign CRUD endpoints
    @GetMapping("/campaigns")
    public ResponseEntity<List<Campaign>> getAllCampaigns() {
        log.info("GET /api/admin/campaigns - Fetching all campaigns");
        List<Campaign> campaigns = campaignRepository.findAll();
        return ResponseEntity.ok(campaigns);
    }
    
    @GetMapping("/campaigns/{id}")
    public ResponseEntity<Campaign> getCampaignById(@PathVariable String id) {
        log.info("GET /api/admin/campaigns/{} - Fetching campaign", id);
        return campaignRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/campaigns")
    public ResponseEntity<Campaign> createCampaign(@Valid @RequestBody AdminCampaignRequest request) {
        log.info("POST /api/admin/campaigns - Creating campaign: {}", request.getTitle());
        Campaign campaign = adminCampaignService.createCampaign(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(campaign);
    }
    
    @PutMapping("/campaigns/{id}")
    public ResponseEntity<Campaign> updateCampaign(@PathVariable String id, @Valid @RequestBody AdminCampaignRequest request) {
        log.info("PUT /api/admin/campaigns/{} - Updating campaign", id);
        Campaign campaign = adminCampaignService.updateCampaign(id, request);
        return ResponseEntity.ok(campaign);
    }
    
    @DeleteMapping("/campaigns/{id}")
    public ResponseEntity<Void> deleteCampaign(@PathVariable String id) {
        log.info("DELETE /api/admin/campaigns/{} - Deleting campaign", id);
        adminCampaignService.deleteCampaign(id);
        return ResponseEntity.noContent().build();
    }
    
    // Category CRUD endpoints
    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getAllCategories() {
        log.info("GET /api/admin/categories - Fetching all categories");
        List<Category> categories = categoryRepository.findAll();
        return ResponseEntity.ok(categories);
    }
    
    @GetMapping("/categories/{id}")
    public ResponseEntity<Category> getCategoryById(@PathVariable String id) {
        log.info("GET /api/admin/categories/{} - Fetching category", id);
        return categoryRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/categories")
    public ResponseEntity<Category> createCategory(@Valid @RequestBody AdminCategoryRequest request) {
        log.info("POST /api/admin/categories - Creating category: {}", request.getName());
        Category category = adminCategoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(category);
    }
    
    @PutMapping("/categories/{id}")
    public ResponseEntity<Category> updateCategory(@PathVariable String id, @Valid @RequestBody AdminCategoryRequest request) {
        log.info("PUT /api/admin/categories/{} - Updating category", id);
        Category category = adminCategoryService.updateCategory(id, request);
        return ResponseEntity.ok(category);
    }
    
    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable String id) {
        log.info("DELETE /api/admin/categories/{} - Deleting category", id);
        adminCategoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
    
    // Site Config endpoints
    @GetMapping("/config")
    public ResponseEntity<List<SiteConfig>> getAllConfigs() {
        log.info("GET /api/admin/config - Fetching all site configs");
        List<SiteConfig> configs = siteConfigService.getAllConfigs();
        return ResponseEntity.ok(configs);
    }
    
    @PostMapping("/config")
    public ResponseEntity<SiteConfig> updateConfig(@Valid @RequestBody SiteConfigRequest request) {
        log.info("POST /api/admin/config - Updating config: {}", request.getConfigKey());
        SiteConfig config = siteConfigService.updateConfig(
            request.getConfigKey(), 
            request.getConfigValue(), 
            request.getDescription()
        );
        return ResponseEntity.ok(config);
    }
    
    @PostMapping("/config/initialize")
    public ResponseEntity<Void> initializeConfigs() {
        log.info("POST /api/admin/config/initialize - Initializing default configs");
        siteConfigService.initializeDefaultConfigs();
        return ResponseEntity.ok().build();
    }
}

package com.myfoundation.school.admin;

import com.myfoundation.school.campaign.Campaign;
import com.myfoundation.school.campaign.CampaignRepository;
import com.myfoundation.school.campaign.CampaignService;
import com.myfoundation.school.campaign.Category;
import com.myfoundation.school.campaign.CategoryRepository;
import com.myfoundation.school.config.SiteConfig;
import com.myfoundation.school.config.SiteConfigRequest;
import com.myfoundation.school.config.SiteConfigService;
import com.myfoundation.school.donation.DonationReceiptService;
import com.myfoundation.school.donation.DonationRepository;
import com.myfoundation.school.donation.DonationService;
import com.myfoundation.school.donation.DonationStatus;
import com.myfoundation.school.dto.CampaignResponse;
import com.myfoundation.school.dto.DonationResponse;
import com.myfoundation.school.dto.DonationPageResponse;
import com.myfoundation.school.donation.Donation;
import com.myfoundation.school.audit.AuditAction;
import com.myfoundation.school.audit.AuditLogService;
import com.myfoundation.school.exception.BusinessException;
import com.myfoundation.school.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminDonationController {
    
    private final DonationService donationService;
    private final DonationReceiptService donationReceiptService;
    private final AuditLogService auditLogService;
    private final AdminCampaignService adminCampaignService;
    private final AdminCategoryService adminCategoryService;
    private final CampaignRepository campaignRepository;
    private final CategoryRepository categoryRepository;
    private final SiteConfigService siteConfigService;
    private final CampaignService campaignService;
    private final DonationRepository donationRepository;
    
    // Donation endpoints
    @GetMapping("/donations")
    public ResponseEntity<?> getAllDonations(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status) {
        
        // If page parameter is present, use paginated endpoint
        if (page != null) {
            log.info("GET /api/admin/donations (paginated) - page: {}, size: {}, sort: {}, q: {}, status: {}", 
                    page, size, sort, q, status);
            
            // Parse pagination parameters
            int pageNumber = Math.max(0, page);
            int pageSize = (size != null && size > 0 && size <= 100) ? size : 25;
            
            // Parse sort parameter (format: "field,direction")
            Sort sortObj = Sort.by(Sort.Direction.DESC, "createdAt"); // default
            if (sort != null && !sort.isEmpty()) {
                String[] sortParts = sort.split(",");
                if (sortParts.length == 2) {
                    String field = sortParts[0].trim();
                    String direction = sortParts[1].trim();
                    // Validate field
                    if ("createdAt".equals(field) || "amount".equals(field)) {
                        sortObj = "asc".equalsIgnoreCase(direction) 
                                ? Sort.by(Sort.Direction.ASC, field)
                                : Sort.by(Sort.Direction.DESC, field);
                    }
                }
            }
            
            Pageable pageable = PageRequest.of(pageNumber, pageSize, sortObj);
            
            // Parse status filter
            DonationStatus statusFilter = null;
            if (status != null && !status.isEmpty() && !"ALL".equalsIgnoreCase(status)) {
                try {
                    statusFilter = DonationStatus.valueOf(status.toUpperCase());
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid status filter: {}", status);
                }
            }
            
            DonationPageResponse response = donationService.getDonationsPaginated(q, statusFilter, pageable);

            String adminUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            String details = String.format("page=%d, size=%d, q=%s, status=%s, sort=%s", pageNumber, pageSize, q, status, sort);
            auditLogService.log(AuditAction.DONATION_LIST_VIEWED, "Donation", null, adminUsername, details);

            return ResponseEntity.ok(response);
        }

        // Legacy non-paginated endpoint
        log.info("GET /api/admin/donations - Fetching all donations");
        List<DonationResponse> donations = donationService.getAllDonations();

        String adminUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        auditLogService.log(AuditAction.DONATION_LIST_VIEWED, "Donation", null, adminUsername, "legacy non-paginated");

        return ResponseEntity.ok(donations);
    }
    
    // Refund request body
    public record RefundRequest(String reason) {}

    @PostMapping("/donations/{id}/refund")
    public ResponseEntity<?> refundDonation(
            @PathVariable String id,
            @RequestBody(required = false) RefundRequest request) {
        log.info("POST /api/admin/donations/{}/refund - Initiating refund", id);
        try {
            String adminUsername = SecurityContextHolder.getContext()
                    .getAuthentication().getName();
            String reason = (request != null) ? request.reason() : null;
            Donation donation = donationService.refundDonation(id, reason, adminUsername);

            Map<String, Object> response = new HashMap<>();
            response.put("id", donation.getId());
            response.put("status", donation.getStatus().name());
            response.put("refundedAt", donation.getRefundedAt());
            response.put("refundReason", donation.getRefundReason());
            response.put("stripeRefundId", donation.getStripeRefundId());
            response.put("message", "Donation refunded successfully");
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (BusinessException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/donations/{id}/receipt")
    public ResponseEntity<byte[]> downloadReceipt(@PathVariable String id) {
        log.info("GET /api/admin/donations/{}/receipt - Admin receipt download", id);

        byte[] pdfBytes = donationReceiptService.generateReceipt(id);

        String adminUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        auditLogService.log(AuditAction.DONATION_EXPORTED, "Donation", id, adminUsername, "Receipt PDF downloaded");

        String filename = "donation-receipt-" + id + ".pdf";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", filename);
        headers.setContentLength(pdfBytes.length);

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats() {
        long totalRaised = donationRepository.sumAllSuccessfulDonations();
        long totalDonations = donationRepository.countSuccessfulDonations();
        long totalDonors = donationRepository.countDistinctDonors();
        long averageDonation = totalDonations > 0 ? totalRaised / totalDonations : 0;
        long activeCampaigns = campaignRepository.countByActiveTrue();

        java.time.Instant monthStart = java.time.YearMonth.now()
                .atDay(1).atStartOfDay(java.time.ZoneOffset.UTC).toInstant();
        long monthlyRaised = donationRepository.sumSuccessfulDonationsSince(monthStart);
        long monthlyDonations = donationRepository.countSuccessfulDonationsSince(monthStart);

        List<Donation> recent = donationRepository.findRecentDonations(PageRequest.of(0, 5));
        List<DashboardStatsResponse.RecentDonation> recentDtos = recent.stream()
                .map(d -> DashboardStatsResponse.RecentDonation.builder()
                        .id(d.getId())
                        .donorName(d.getDonorName() != null ? d.getDonorName() : "Anonymous")
                        .amount(d.getAmount())
                        .currency(d.getCurrency())
                        .campaignTitle(d.getCampaign() != null ? d.getCampaign().getTitle() : "General")
                        .status(d.getStatus().name())
                        .createdAt(d.getCreatedAt().toString())
                        .build())
                .collect(Collectors.toList());

        List<Object[]> topRaw = donationRepository.findTopCampaignsByAmountRaised(PageRequest.of(0, 5));
        List<DashboardStatsResponse.TopCampaign> topDtos = topRaw.stream()
                .map(row -> {
                    String cId = (String) row[0];
                    long target = campaignRepository.findById(cId)
                            .map(Campaign::getTargetAmount).orElse(0L);
                    return DashboardStatsResponse.TopCampaign.builder()
                            .id(cId)
                            .title((String) row[1])
                            .raised((Long) row[2])
                            .target(target)
                            .donationCount((Long) row[3])
                            .build();
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(DashboardStatsResponse.builder()
                .totalRaised(totalRaised)
                .totalDonations(totalDonations)
                .totalDonors(totalDonors)
                .averageDonation(averageDonation)
                .activeCampaigns(activeCampaigns)
                .monthlyRaised(monthlyRaised)
                .monthlyDonations(monthlyDonations)
                .recentDonations(recentDtos)
                .topCampaigns(topDtos)
                .build());
    }

    // Campaign CRUD endpoints
    @GetMapping("/campaigns")
    public ResponseEntity<?> getAllCampaigns(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        if (page != null) {
            log.info("GET /api/admin/campaigns (paginated) - page={}, size={}", page, size);
            int pageNum = Math.max(0, page);
            int pageSize = (size != null && size > 0 && size <= 100) ? size : 25;
            Pageable pageable = PageRequest.of(pageNum, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
            Page<Campaign> campaignPage = campaignRepository.findAll(pageable);
            List<Campaign> pageContent = campaignPage.getContent();
            // Batch-load donation sums to avoid N+1
            java.util.Map<String, Long> donationSums = batchLoadDonationSums(pageContent);
            List<AdminCampaignResponse> items = pageContent.stream()
                    .map(c -> toAdminCampaignResponse(c, donationSums.getOrDefault(c.getId(), 0L)))
                    .collect(Collectors.toList());
            Map<String, Object> response = new HashMap<>();
            response.put("items", items);
            response.put("page", campaignPage.getNumber());
            response.put("size", campaignPage.getSize());
            response.put("totalItems", campaignPage.getTotalElements());
            response.put("totalPages", campaignPage.getTotalPages());
            return ResponseEntity.ok(response);
        }
        log.info("GET /api/admin/campaigns - Fetching all campaigns");
        List<Campaign> campaigns = campaignRepository.findAll();
        // Batch-load donation sums to avoid N+1
        java.util.Map<String, Long> donationSums = batchLoadDonationSums(campaigns);
        List<AdminCampaignResponse> responses = campaigns.stream()
                .map(c -> toAdminCampaignResponse(c, donationSums.getOrDefault(c.getId(), 0L)))
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }
    
    @GetMapping("/campaigns/{id}")
    public ResponseEntity<AdminCampaignResponse> getCampaignById(@PathVariable String id) {
        log.info("GET /api/admin/campaigns/{} - Fetching campaign", id);
        return campaignRepository.findById(id)
                .map(this::toAdminCampaignResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/campaigns")
    public ResponseEntity<AdminCampaignResponse> createCampaign(@Valid @RequestBody AdminCampaignRequest request) {
        log.info("POST /api/admin/campaigns - Creating campaign: {}",
                 request.getTitle().replaceAll("[\\r\\n]", "_"));
        Campaign campaign = adminCampaignService.createCampaign(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(toAdminCampaignResponse(campaign));
    }
    
    @PutMapping("/campaigns/{id}")
    public ResponseEntity<AdminCampaignResponse> updateCampaign(@PathVariable String id, @Valid @RequestBody AdminCampaignRequest request) {
        log.info("PUT /api/admin/campaigns/{} - Updating campaign", id);
        Campaign campaign = adminCampaignService.updateCampaign(id, request);
        return ResponseEntity.ok(toAdminCampaignResponse(campaign));
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

    @PatchMapping("/categories/{id}")
    public ResponseEntity<Category> patchCategory(@PathVariable String id, @Valid @RequestBody AdminCategoryRequest request) {
        log.info("PATCH /api/admin/categories/{} - Patching category", id);
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
    
    /**
     * Batch-load donation sums for a list of campaigns in one query.
     * Returns a map of campaignId → total donated amount (in lowest currency unit).
     */
    private java.util.Map<String, Long> batchLoadDonationSums(List<Campaign> campaigns) {
        if (campaigns == null || campaigns.isEmpty()) {
            return java.util.Map.of();
        }
        List<String> ids = campaigns.stream().map(Campaign::getId).collect(Collectors.toList());
        return donationRepository.sumSuccessfulDonationsByCampaignIds(ids).stream()
                .collect(Collectors.toMap(row -> (String) row[0], row -> (Long) row[1]));
    }

    /**
     * Single-campaign lookup — donation sum fetched individually (no N+1 concern for 1 row).
     */
    private AdminCampaignResponse toAdminCampaignResponse(Campaign campaign) {
        Long currentAmount = donationRepository.sumSuccessfulDonationsByCampaignId(campaign.getId());
        return toAdminCampaignResponse(campaign, currentAmount);
    }

    /**
     * Convert Campaign entity to AdminCampaignResponse with a pre-loaded currentAmount.
     * Use this variant when building list responses to avoid N+1 queries.
     */
    private AdminCampaignResponse toAdminCampaignResponse(Campaign campaign, Long currentAmount) {
        AdminCampaignResponse response = new AdminCampaignResponse();
        response.setId(campaign.getId());
        response.setTitle(campaign.getTitle());
        response.setSlug(campaign.getSlug());
        response.setShortDescription(campaign.getShortDescription());
        response.setFullDescription(campaign.getDescription());
        response.setTargetAmount(campaign.getTargetAmount());
        response.setCurrentAmount(currentAmount); // Calculated from successful donations
        response.setCurrency(campaign.getCurrency());
        response.setImageUrl(campaign.getImageUrl());
        response.setLocation(campaign.getLocation());
        response.setBeneficiariesCount(campaign.getBeneficiariesCount());
        response.setActive(campaign.getActive());
        response.setFeatured(campaign.getFeatured());
        response.setUrgent(campaign.getUrgent());
        response.setCreatedAt(campaign.getCreatedAt());
        response.setUpdatedAt(campaign.getUpdatedAt());

        if (campaign.getCategory() != null) {
            response.setCategoryId(campaign.getCategory().getId());
            response.setCategoryName(campaign.getCategory().getName());
            response.setCategoryIcon(campaign.getCategory().getIcon());
            response.setCategoryColor(campaign.getCategory().getColor());
        }

        return response;
    }
}

package com.myfoundation.school.campaign;

import com.myfoundation.school.donation.DonationRepository;
import com.myfoundation.school.dto.CampaignPopupDto;
import com.myfoundation.school.dto.CampaignResponse;
import com.myfoundation.school.dto.CampaignSummaryDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service layer for campaign management and business logic.
 * 
 * This service handles:
 * - Campaign retrieval with filtering (category, featured, urgent)
 * - Campaign data transformation to various DTOs (full, popup, summary)
 * - Donation progress calculation
 * - Fallback campaign selection for donate popups
 * 
 * All read operations use {@code @Transactional(readOnly = true)} for optimization.
 * 
 * @author Foundation Team
 * @version 1.0
 * @since 1.0
 */
@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CampaignService {
    
    private final CampaignRepository campaignRepository;
    private final DonationRepository donationRepository;
    
    /**
     * Get campaigns with optional filters.
     * 
     * Filter priority (applied in order):
     * 1. Featured campaigns (if featured=true)
     * 2. Urgent campaigns (if urgent=true)
     * 3. Category campaigns (if categoryId provided)
     * 4. All active campaigns (if no filters)
     * 
     * @param categoryId Filter by category ID (optional)
     * @param featured Filter for featured campaigns only (optional)
     * @param urgent Filter for urgent campaigns only (optional)
     * @return List of campaigns matching filters, transformed to CampaignResponse DTOs
     */
    public List<CampaignResponse> getCampaigns(String categoryId, Boolean featured, Boolean urgent) {
        log.info("Fetching campaigns with filters: categoryId={}, featured={}, urgent={}", 
                categoryId, featured, urgent);
        
        List<Campaign> campaigns;
        
        if (featured != null && featured) {
            campaigns = campaignRepository.findByActiveTrueAndFeaturedTrue();
        } else if (urgent != null && urgent) {
            campaigns = campaignRepository.findByActiveTrueAndUrgentTrue();
        } else if (categoryId != null && !categoryId.isEmpty()) {
            campaigns = campaignRepository.findByActiveTrueAndCategoryId(categoryId);
        } else {
            campaigns = campaignRepository.findByActiveTrue();
        }
        
        return campaigns.stream()
                .map(this::toCampaignResponse)
                .collect(Collectors.toList());
    }
    
    public List<CampaignResponse> getAllActiveCampaigns() {
        return getCampaigns(null, null, null);
    }
    
    /**
     * Get a single campaign by its unique identifier.
     * 
     * @param id The campaign ID
     * @return Campaign details as CampaignResponse DTO
     * @throws RuntimeException if campaign not found
     */
    public CampaignResponse getCampaignById(String id) {
        log.info("Fetching campaign with id: {}", id);
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaign not found with id: " + id));
        return toCampaignResponse(campaign);
    }
    
    /**
     * Get campaign details optimized for donate popup modal.
     * 
     * Returns a lightweight DTO with only fields needed for the popup:
     * - Campaign ID, title, short description
     * - Image URL
     * - Target and current amounts with progress percentage
     * - Badge text ("Urgent Need" or "Active Campaign")
     * - Category name and icon
     * 
     * @param campaignId The campaign ID
     * @return Optional containing CampaignPopupDto if campaign exists and is active
     */
    public Optional<CampaignPopupDto> getCampaignForPopup(String campaignId) {
        return campaignRepository.findById(campaignId)
                .filter(Campaign::getActive)
                .map(this::toCampaignPopupDto);
    }
    
    /**
     * Get fallback campaign for donate popup when spotlight campaign is not set.
     * 
     * Selection criteria (in order of priority):
     * 1. Featured campaigns first
     * 2. Then urgent campaigns
     * 3. Then newest active campaigns (by updatedAt DESC)
     * 
     * Returns the first matching campaign from the sorted list.
     * 
     * @return Optional containing CampaignPopupDto for the best fallback campaign, or empty if no active campaigns
     */
    public Optional<CampaignPopupDto> getFallbackCampaignForPopup() {
        List<Campaign> campaigns = campaignRepository.findActiveCampaignsForPopup(PageRequest.of(0, 1));
        return campaigns.isEmpty() ? Optional.empty() : Optional.of(toCampaignPopupDto(campaigns.get(0)));
    }
    
    public Optional<CampaignSummaryDto> getCampaignSummary(String campaignId) {
        return campaignRepository.findById(campaignId)
                .map(this::toCampaignSummaryDto);
    }
    
    private CampaignPopupDto toCampaignPopupDto(Campaign campaign) {
        Long currentAmount = donationRepository.sumSuccessfulDonationsByCampaignId(campaign.getId());
        int progressPercent = calculateProgressPercent(currentAmount, campaign.getTargetAmount());
        
        String badgeText = campaign.getUrgent() ? "Urgent Need" : "Active Campaign";
        
        return CampaignPopupDto.builder()
                .id(campaign.getId())
                .title(campaign.getTitle())
                .shortDescription(campaign.getShortDescription())
                .imageUrl(campaign.getImageUrl())
                .targetAmount(campaign.getTargetAmount())
                .currentAmount(currentAmount)
                .currency(campaign.getCurrency())
                .progressPercent(progressPercent)
                .badgeText(badgeText)
                .categoryName(campaign.getCategory() != null ? campaign.getCategory().getName() : null)
                .categoryIcon(campaign.getCategory() != null ? campaign.getCategory().getIcon() : null)
                .build();
    }
    
    private CampaignSummaryDto toCampaignSummaryDto(Campaign campaign) {
        return CampaignSummaryDto.builder()
                .id(campaign.getId())
                .title(campaign.getTitle())
                .active(campaign.getActive())
                .featured(campaign.getFeatured())
                .categoryName(campaign.getCategory() != null ? campaign.getCategory().getName() : null)
                .updatedAt(campaign.getUpdatedAt())
                .build();
    }
    
    private int calculateProgressPercent(Long current, Long target) {
        if (target == null || target == 0) return 0;
        if (current == null) return 0;
        return (int) Math.min(100, (current * 100) / target);
    }
    
    private CampaignResponse toCampaignResponse(Campaign campaign) {
        // Calculate current amount from successful donations only
        Long currentAmount = donationRepository.sumSuccessfulDonationsByCampaignId(campaign.getId());
        
        return CampaignResponse.builder()
                .id(campaign.getId())
                .title(campaign.getTitle())
                .slug(campaign.getSlug())
                .shortDescription(campaign.getShortDescription())
                .description(campaign.getDescription())
                .targetAmount(campaign.getTargetAmount())
                .currentAmount(currentAmount) // Calculated from successful donations
                .currency(campaign.getCurrency())
                .active(campaign.getActive())
                .categoryId(campaign.getCategory() != null ? campaign.getCategory().getId() : null)
                .categoryName(campaign.getCategory() != null ? campaign.getCategory().getName() : null)
                .categoryIcon(campaign.getCategory() != null ? campaign.getCategory().getIcon() : null)
                .categoryColor(campaign.getCategory() != null ? campaign.getCategory().getColor() : null)
                .imageUrl(campaign.getImageUrl())
                .location(campaign.getLocation())
                .beneficiariesCount(campaign.getBeneficiariesCount())
                .featured(campaign.getFeatured())
                .urgent(campaign.getUrgent())
                .build();
    }
}

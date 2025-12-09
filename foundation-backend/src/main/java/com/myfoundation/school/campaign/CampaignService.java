package com.myfoundation.school.campaign;

import com.myfoundation.school.dto.CampaignResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CampaignService {
    
    private final CampaignRepository campaignRepository;
    
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
    
    public CampaignResponse getCampaignById(String id) {
        log.info("Fetching campaign with id: {}", id);
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaign not found with id: " + id));
        return toCampaignResponse(campaign);
    }
    
    private CampaignResponse toCampaignResponse(Campaign campaign) {
        return CampaignResponse.builder()
                .id(campaign.getId())
                .title(campaign.getTitle())
                .slug(campaign.getSlug())
                .shortDescription(campaign.getShortDescription())
                .description(campaign.getDescription())
                .targetAmount(campaign.getTargetAmount())
                .currentAmount(campaign.getCurrentAmount())
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

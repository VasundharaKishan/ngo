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
    
    public List<CampaignResponse> getAllActiveCampaigns() {
        log.info("Fetching all active campaigns");
        return campaignRepository.findByActiveTrue().stream()
                .map(this::toCampaignResponse)
                .collect(Collectors.toList());
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
                .currency(campaign.getCurrency())
                .active(campaign.getActive())
                .build();
    }
}

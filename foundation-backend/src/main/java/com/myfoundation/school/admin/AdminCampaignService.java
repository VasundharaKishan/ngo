package com.myfoundation.school.admin;

import com.myfoundation.school.campaign.Campaign;
import com.myfoundation.school.campaign.CampaignRepository;
import com.myfoundation.school.campaign.Category;
import com.myfoundation.school.campaign.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AdminCampaignService {
    
    private final CampaignRepository campaignRepository;
    private final CategoryRepository categoryRepository;
    
    @Transactional
    public Campaign createCampaign(AdminCampaignRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId().toString())
                .orElseThrow(() -> new RuntimeException("Category not found"));
        
        Campaign campaign = new Campaign();
        campaign.setTitle(request.getTitle());
        campaign.setShortDescription(request.getShortDescription());
        campaign.setDescription(request.getFullDescription());
        campaign.setSlug(request.getTitle().toLowerCase().replaceAll("[^a-z0-9]+", "-"));
        campaign.setCurrency("USD");
        campaign.setCategory(category);
        campaign.setTargetAmount(request.getTargetAmount());
        campaign.setCurrentAmount(request.getCurrentAmount() != null ? request.getCurrentAmount() : 0L);
        campaign.setImageUrl(request.getImageUrl());
        campaign.setLocation(request.getLocation());
        campaign.setBeneficiariesCount(request.getBeneficiariesCount());
        campaign.setFeatured(request.getFeatured());
        campaign.setUrgent(request.getUrgent());
        campaign.setActive(request.getActive());
        campaign.setCreatedAt(Instant.now());
        campaign.setUpdatedAt(Instant.now());
        
        return campaignRepository.save(campaign);
    }
    
    @Transactional
    public Campaign updateCampaign(String id, AdminCampaignRequest request) {
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaign not found"));
        
        Category category = categoryRepository.findById(request.getCategoryId().toString())
                .orElseThrow(() -> new RuntimeException("Category not found"));
        
        campaign.setTitle(request.getTitle());
        campaign.setShortDescription(request.getShortDescription());
        campaign.setDescription(request.getFullDescription());
        campaign.setCategory(category);
        campaign.setTargetAmount(request.getTargetAmount());
        campaign.setCurrentAmount(request.getCurrentAmount() != null ? request.getCurrentAmount() : campaign.getCurrentAmount());
        campaign.setImageUrl(request.getImageUrl());
        campaign.setLocation(request.getLocation());
        campaign.setBeneficiariesCount(request.getBeneficiariesCount());
        campaign.setFeatured(request.getFeatured());
        campaign.setUrgent(request.getUrgent());
        campaign.setActive(request.getActive());
        campaign.setUpdatedAt(Instant.now());
        
        return campaignRepository.save(campaign);
    }
    
    @Transactional
    public void deleteCampaign(String id) {
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaign not found"));
        campaignRepository.delete(campaign);
    }
}

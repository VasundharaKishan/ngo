package com.myfoundation.school.admin;

import com.myfoundation.school.audit.AuditAction;
import com.myfoundation.school.audit.AuditLogService;
import com.myfoundation.school.campaign.Campaign;
import com.myfoundation.school.campaign.CampaignRepository;
import com.myfoundation.school.campaign.Category;
import com.myfoundation.school.campaign.CategoryRepository;
import com.myfoundation.school.donation.DonationRepository;
import com.myfoundation.school.exception.BusinessException;
import com.myfoundation.school.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminCampaignService {

    /** Maximum slug-uniqueness attempts before falling back to a UUID suffix. */
    private static final int MAX_SLUG_ATTEMPTS = 50;

    private final CampaignRepository campaignRepository;
    private final CategoryRepository categoryRepository;
    private final DonationRepository donationRepository;
    private final AuditLogService auditLogService;
    
    @Transactional
    public Campaign createCampaign(AdminCampaignRequest request) {
        // Validate featured campaign requirements
        if (Boolean.TRUE.equals(request.getFeatured())) {
            if (request.getImageUrl() == null || request.getImageUrl().trim().isEmpty()) {
                throw new BusinessException("Featured campaigns must have an image URL");
            }
            if (Boolean.FALSE.equals(request.getActive())) {
                throw new BusinessException("Featured campaigns cannot be inactive");
            }
        }
        
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        Campaign campaign = new Campaign();
        campaign.setTitle(request.getTitle());
        campaign.setShortDescription(request.getShortDescription());
        campaign.setDescription(request.getFullDescription());
        campaign.setSlug(uniqueSlug(request.getTitle(), null));
        campaign.setCurrency(request.getCurrency() != null ? request.getCurrency() : "INR");
        campaign.setCategory(category);
        campaign.setTargetAmount(request.getTargetAmount());
        // Note: currentAmount is now calculated from donations, not stored
        campaign.setImageUrl(request.getImageUrl());
        campaign.setLocation(request.getLocation());
        campaign.setBeneficiariesCount(request.getBeneficiariesCount());
        campaign.setFeatured(request.getFeatured());
        campaign.setUrgent(request.getUrgent());
        campaign.setActive(request.getActive());
        campaign.setCreatedAt(Instant.now());
        campaign.setUpdatedAt(Instant.now());

        Campaign saved = campaignRepository.save(campaign);
        auditLogService.log(AuditAction.CAMPAIGN_CREATED, "Campaign", saved.getId(), null, "Title: " + saved.getTitle());
        return saved;
    }
    
    @Transactional
    public Campaign updateCampaign(String id, AdminCampaignRequest request) {
        // Validate featured campaign requirements
        if (Boolean.TRUE.equals(request.getFeatured())) {
            if (request.getImageUrl() == null || request.getImageUrl().trim().isEmpty()) {
                throw new BusinessException("Featured campaigns must have an image URL");
            }
            if (Boolean.FALSE.equals(request.getActive())) {
                throw new BusinessException("Featured campaigns cannot be inactive");
            }
        }
        
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found"));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        
        campaign.setTitle(request.getTitle());
        campaign.setSlug(uniqueSlug(request.getTitle(), id));
        campaign.setShortDescription(request.getShortDescription());
        campaign.setDescription(request.getFullDescription());
        campaign.setCategory(category);
        campaign.setTargetAmount(request.getTargetAmount());
        // Note: currentAmount is now calculated from donations, not stored
        campaign.setImageUrl(request.getImageUrl());
        campaign.setLocation(request.getLocation());
        campaign.setBeneficiariesCount(request.getBeneficiariesCount());
        campaign.setFeatured(request.getFeatured());
        campaign.setUrgent(request.getUrgent());
        campaign.setActive(request.getActive());
        if (request.getCurrency() != null) {
            campaign.setCurrency(request.getCurrency());
        }
        campaign.setUpdatedAt(Instant.now());

        Campaign saved = campaignRepository.save(campaign);
        auditLogService.log(AuditAction.CAMPAIGN_UPDATED, "Campaign", id, null, "Title: " + saved.getTitle());
        return saved;
    }

    /**
     * Generates a URL-safe slug from the given title, guaranteed to be unique
     * among all campaigns except the one with {@code excludeId} (pass {@code null}
     * when creating a new campaign).  If the base slug is taken, a numeric suffix
     * (-2, -3, …) is appended until a free slot is found.
     *
     * <p>The loop is capped at {@link #MAX_SLUG_ATTEMPTS} iterations.  If no free
     * slot is found within that budget (e.g. hundreds of campaigns share the same
     * title), a short UUID suffix is used as a guaranteed-unique fallback, avoiding
     * an unbounded series of DB round-trips.</p>
     *
     * <p>If the title contains only non-alphanumeric characters the base slug would
     * be empty; in that case the UUID fallback is used immediately.</p>
     */
    private String uniqueSlug(String title, String excludeId) {
        String base = title.toLowerCase().replaceAll("[^a-z0-9]+", "-")
                           .replaceAll("^-+|-+$", ""); // trim leading/trailing dashes
        String skipId = excludeId != null ? excludeId : "";

        // Guard: title contained only non-alphanumeric chars — use UUID slug directly.
        if (base.isEmpty()) {
            return UUID.randomUUID().toString();
        }

        String candidate = base;
        int suffix = 2;
        int attempts = 0;
        while (campaignRepository.existsBySlugAndIdNot(candidate, skipId)) {
            if (attempts++ >= MAX_SLUG_ATTEMPTS) {
                // Exceeded attempt budget — append short UUID to guarantee uniqueness
                // without further DB queries.
                candidate = base + "-" + UUID.randomUUID().toString().substring(0, 8);
                break;
            }
            candidate = base + "-" + suffix++;
        }
        return candidate;
    }

    @Transactional
    public void deleteCampaign(String id) {
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found"));

        // Refuse deletion if the campaign has any associated donations (ANY status).
        // Deleting a campaign with donations would violate the nullable=false FK constraint
        // and produce a cryptic 500 error. Admins should deactivate campaigns instead.
        long donationCount = donationRepository.countByCampaignId(id);
        if (donationCount > 0) {
            throw new BusinessException(
                "Cannot delete campaign '" + campaign.getTitle() + "' — it has " +
                donationCount + " associated donation(s). Deactivate the campaign instead.");
        }

        campaignRepository.delete(campaign);
        auditLogService.log(AuditAction.CAMPAIGN_DELETED, "Campaign", id, null, "Title: " + campaign.getTitle());
    }
}

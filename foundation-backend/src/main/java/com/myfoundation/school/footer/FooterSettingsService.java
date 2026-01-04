package com.myfoundation.school.footer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing footer configuration settings.
 * Handles business logic for footer customization.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FooterSettingsService {

    private final FooterSettingsRepository footerSettingsRepository;

    /**
     * Get current footer configuration.
     * Returns default values if no configuration exists.
     */
    @Transactional(readOnly = true)
    public FooterConfigResponse getFooterConfig() {
        log.debug("Fetching footer configuration");
        
        FooterSettings settings = footerSettingsRepository.findFirstByOrderByCreatedAtAsc()
                .orElseGet(this::getDefaultFooterSettings);
        
        return mapToResponse(settings);
    }

    /**
     * Update footer configuration.
     * Creates new record if none exists.
     */
    @Transactional
    public FooterConfigResponse updateFooterConfig(FooterConfigRequest request) {
        log.info("Updating footer configuration");
        
        FooterSettings settings = footerSettingsRepository.findFirstByOrderByCreatedAtAsc()
                .orElseGet(() -> FooterSettings.builder().build());
        
        // Update fields
        settings.setTagline(request.getTagline());
        settings.setShowQuickLinks(request.getShowQuickLinks() != null ? request.getShowQuickLinks() : true);
        settings.setShowGetInvolved(request.getShowGetInvolved() != null ? request.getShowGetInvolved() : true);
        settings.setCopyrightText(request.getCopyrightText());
        settings.setDisclaimerText(request.getDisclaimerText());
        
        // Update social media links
        if (request.getSocialMedia() != null) {
            settings.setFacebookUrl(request.getSocialMedia().getFacebook());
            settings.setTwitterUrl(request.getSocialMedia().getTwitter());
            settings.setInstagramUrl(request.getSocialMedia().getInstagram());
            settings.setYoutubeUrl(request.getSocialMedia().getYoutube());
            settings.setLinkedinUrl(request.getSocialMedia().getLinkedin());
        }
        
        FooterSettings saved = footerSettingsRepository.save(settings);
        log.info("Footer configuration updated successfully");
        
        return mapToResponse(saved);
    }

    /**
     * Get default footer settings when no configuration exists.
     */
    private FooterSettings getDefaultFooterSettings() {
        return FooterSettings.builder()
                .tagline("Empowering communities worldwide through compassion and action.")
                .facebookUrl("https://facebook.com")
                .twitterUrl("https://twitter.com")
                .instagramUrl("https://instagram.com")
                .youtubeUrl("https://youtube.com")
                .linkedinUrl("https://linkedin.com")
                .showQuickLinks(true)
                .showGetInvolved(true)
                .copyrightText("© {year} {siteName}. All rights reserved. Registered Charity")
                .disclaimerText("{siteName} is a registered nonprofit organization. Donations are tax-deductible to the extent permitted by law.")
                .build();
    }

    /**
     * Map entity to response DTO.
     */
    private FooterConfigResponse mapToResponse(FooterSettings settings) {
        SocialMediaLinks socialMedia = SocialMediaLinks.builder()
                .facebook(settings.getFacebookUrl())
                .twitter(settings.getTwitterUrl())
                .instagram(settings.getInstagramUrl())
                .youtube(settings.getYoutubeUrl())
                .linkedin(settings.getLinkedinUrl())
                .build();
        
        return FooterConfigResponse.builder()
                .tagline(settings.getTagline())
                .socialMedia(socialMedia)
                .showQuickLinks(settings.getShowQuickLinks())
                .showGetInvolved(settings.getShowGetInvolved())
                .copyrightText(settings.getCopyrightText())
                .disclaimerText(settings.getDisclaimerText())
                .build();
    }
}

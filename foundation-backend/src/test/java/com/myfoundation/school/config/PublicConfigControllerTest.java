package com.myfoundation.school.config;

import com.myfoundation.school.campaign.CampaignService;
import com.myfoundation.school.dto.CampaignPopupDto;
import com.myfoundation.school.dto.DonatePopupResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class PublicConfigControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SiteConfigService siteConfigService;

    @MockBean
    private CampaignService campaignService;

    @Test
    void getDonatePopup_WithSpotlightSet_ReturnsSpotlightCampaign() throws Exception {
        // Given
        String spotlightId = "camp-spotlight";
        CampaignPopupDto mockCampaign = CampaignPopupDto.builder()
                .id(spotlightId)
                .title("Spotlight Campaign")
                .shortDescription("Featured campaign")
                .targetAmount(50000L)
                .currentAmount(20000L)
                .currency("USD")
                .progressPercent(40)
                .badgeText("Active Campaign")
                .build();

        when(siteConfigService.getConfigValue("donate_popup.spotlight_campaign_id"))
                .thenReturn(spotlightId);
        when(campaignService.getCampaignForPopup(spotlightId))
                .thenReturn(Optional.of(mockCampaign));

        // When & Then
        mockMvc.perform(get("/api/config/public/donate-popup"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.mode").value("SPOTLIGHT"))
                .andExpect(jsonPath("$.fallbackReason").isEmpty())
                .andExpect(jsonPath("$.campaign.id").value(spotlightId))
                .andExpect(jsonPath("$.campaign.title").value("Spotlight Campaign"))
                .andExpect(jsonPath("$.campaign.progressPercent").value(40))
                .andExpect(jsonPath("$.campaign.badgeText").value("Active Campaign"));
    }

    @Test
    void getDonatePopup_WithoutSpotlight_ReturnsFallbackCampaign() throws Exception {
        // Given
        CampaignPopupDto mockFallback = CampaignPopupDto.builder()
                .id("camp-fallback")
                .title("Fallback Campaign")
                .shortDescription("Auto-selected campaign")
                .targetAmount(30000L)
                .currentAmount(10000L)
                .currency("USD")
                .progressPercent(33)
                .badgeText("Active Campaign")
                .build();

        when(siteConfigService.getConfigValue("donate_popup.spotlight_campaign_id"))
                .thenReturn(null);
        when(campaignService.getFallbackCampaignForPopup())
                .thenReturn(Optional.of(mockFallback));

        // When & Then
        mockMvc.perform(get("/api/config/public/donate-popup"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mode").value("FALLBACK"))
                .andExpect(jsonPath("$.fallbackReason").value("NO_SPOTLIGHT_SET"))
                .andExpect(jsonPath("$.campaign.id").value("camp-fallback"));
    }

    @Test
    void getDonatePopup_SpotlightInactive_FallsBackToAuto() throws Exception {
        // Given
        String inactiveSpotlightId = "camp-inactive";
        CampaignPopupDto mockFallback = CampaignPopupDto.builder()
                .id("camp-fallback")
                .title("Fallback Campaign")
                .shortDescription("Auto-selected campaign")
                .targetAmount(30000L)
                .currentAmount(10000L)
                .currency("USD")
                .progressPercent(33)
                .badgeText("Active Campaign")
                .build();

        when(siteConfigService.getConfigValue("donate_popup.spotlight_campaign_id"))
                .thenReturn(inactiveSpotlightId);
        when(campaignService.getCampaignForPopup(inactiveSpotlightId))
                .thenReturn(Optional.empty()); // Spotlight not found/inactive
        when(campaignService.getFallbackCampaignForPopup())
                .thenReturn(Optional.of(mockFallback));

        // When & Then
        mockMvc.perform(get("/api/config/public/donate-popup"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mode").value("FALLBACK"))
                .andExpect(jsonPath("$.fallbackReason").value("SPOTLIGHT_INACTIVE"))
                .andExpect(jsonPath("$.campaign.id").value("camp-fallback"));
    }

    @Test
    void getDonatePopup_NoCampaignsAvailable_ReturnsNullCampaign() throws Exception {
        // Given
        when(siteConfigService.getConfigValue("donate_popup.spotlight_campaign_id"))
                .thenReturn(null);
        when(campaignService.getFallbackCampaignForPopup())
                .thenReturn(Optional.empty());

        // When & Then
        mockMvc.perform(get("/api/config/public/donate-popup"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mode").value("FALLBACK"))
                .andExpect(jsonPath("$.fallbackReason").value("NO_ACTIVE_CAMPAIGNS"))
                .andExpect(jsonPath("$.campaign").isEmpty());
    }

    @Test
    void getDonatePopup_WithUrgentCampaign_ShowsCorrectBadge() throws Exception {
        // Given
        CampaignPopupDto urgentCampaign = CampaignPopupDto.builder()
                .id("camp-urgent")
                .title("Urgent Campaign")
                .shortDescription("Help needed now")
                .targetAmount(25000L)
                .currentAmount(5000L)
                .currency("USD")
                .progressPercent(20)
                .badgeText("Urgent Need")
                .build();

        when(siteConfigService.getConfigValue("donate_popup.spotlight_campaign_id"))
                .thenReturn("camp-urgent");
        when(campaignService.getCampaignForPopup("camp-urgent"))
                .thenReturn(Optional.of(urgentCampaign));

        // When & Then
        mockMvc.perform(get("/api/config/public/donate-popup"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.campaign.badgeText").value("Urgent Need"));
    }
}

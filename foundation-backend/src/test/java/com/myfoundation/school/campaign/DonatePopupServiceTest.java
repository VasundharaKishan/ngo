package com.myfoundation.school.campaign;

import com.myfoundation.school.dto.CampaignPopupDto;
import com.myfoundation.school.dto.CampaignSummaryDto;
import com.myfoundation.school.donation.DonationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DonatePopupServiceTest {

    @Mock
    private CampaignRepository campaignRepository;

    @Mock
    private DonationRepository donationRepository;

    @InjectMocks
    private CampaignService campaignService;

    private Campaign activeCampaign;
    private Campaign inactiveCampaign;

    @BeforeEach
    void setUp() {
        activeCampaign = Campaign.builder()
                .id("camp-001")
                .title("Active Campaign")
                .shortDescription("Test active campaign")
                .targetAmount(50000L)
                .currency("USD")
                .active(true)
                .featured(true)
                .urgent(false)
                .imageUrl("https://example.com/image.jpg")
                .updatedAt(Instant.now())
                .build();

        inactiveCampaign = Campaign.builder()
                .id("camp-002")
                .title("Inactive Campaign")
                .shortDescription("Test inactive campaign")
                .targetAmount(30000L)
                .currency("USD")
                .active(false)
                .featured(false)
                .urgent(false)
                .updatedAt(Instant.now())
                .build();
    }

    @Test
    void getCampaignForPopup_WithValidActiveCampaign_ReturnsPopupDto() {
        // Given
        when(campaignRepository.findById("camp-001")).thenReturn(Optional.of(activeCampaign));
        when(donationRepository.sumSuccessfulDonationsByCampaignId("camp-001")).thenReturn(10000L);

        // When
        Optional<CampaignPopupDto> result = campaignService.getCampaignForPopup("camp-001");

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo("camp-001");
        assertThat(result.get().getTitle()).isEqualTo("Active Campaign");
        assertThat(result.get().getCurrentAmount()).isEqualTo(10000L);
        assertThat(result.get().getProgressPercent()).isEqualTo(20); // 10000/50000 = 20%
        assertThat(result.get().getBadgeText()).isEqualTo("Active Campaign");
    }

    @Test
    void getCampaignForPopup_WithInactiveCampaign_ReturnsEmpty() {
        // Given
        when(campaignRepository.findById("camp-002")).thenReturn(Optional.of(inactiveCampaign));

        // When
        Optional<CampaignPopupDto> result = campaignService.getCampaignForPopup("camp-002");

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void getCampaignForPopup_WithNonExistentCampaign_ReturnsEmpty() {
        // Given
        when(campaignRepository.findById("non-existent")).thenReturn(Optional.empty());

        // When
        Optional<CampaignPopupDto> result = campaignService.getCampaignForPopup("non-existent");

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void getCampaignForPopup_WithUrgentCampaign_ShowsUrgentBadge() {
        // Given
        Campaign urgentCampaign = Campaign.builder()
                .id("camp-urgent")
                .title("Urgent Campaign")
                .shortDescription("Urgent help needed")
                .targetAmount(25000L)
                .currency("USD")
                .active(true)
                .featured(false)
                .urgent(true)
                .updatedAt(Instant.now())
                .build();

        when(campaignRepository.findById("camp-urgent")).thenReturn(Optional.of(urgentCampaign));
        when(donationRepository.sumSuccessfulDonationsByCampaignId("camp-urgent")).thenReturn(5000L);

        // When
        Optional<CampaignPopupDto> result = campaignService.getCampaignForPopup("camp-urgent");

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getBadgeText()).isEqualTo("Urgent Need");
    }

    @Test
    void getFallbackCampaignForPopup_ReturnsFirstActiveCampaign() {
        // Given
        when(campaignRepository.findActiveCampaignsForPopup(any(PageRequest.class)))
                .thenReturn(List.of(activeCampaign));
        when(donationRepository.sumSuccessfulDonationsByCampaignId("camp-001")).thenReturn(10000L);

        // When
        Optional<CampaignPopupDto> result = campaignService.getFallbackCampaignForPopup();

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo("camp-001");
    }

    @Test
    void getFallbackCampaignForPopup_WithNoCampaigns_ReturnsEmpty() {
        // Given
        when(campaignRepository.findActiveCampaignsForPopup(any(PageRequest.class)))
                .thenReturn(List.of());

        // When
        Optional<CampaignPopupDto> result = campaignService.getFallbackCampaignForPopup();

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void getCampaignSummary_WithValidCampaign_ReturnsSummary() {
        // Given
        when(campaignRepository.findById("camp-001")).thenReturn(Optional.of(activeCampaign));

        // When
        Optional<CampaignSummaryDto> result = campaignService.getCampaignSummary("camp-001");

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo("camp-001");
        assertThat(result.get().getTitle()).isEqualTo("Active Campaign");
        assertThat(result.get().getActive()).isTrue();
        assertThat(result.get().getFeatured()).isTrue();
    }

    @Test
    void getCampaignSummary_WithNonExistentCampaign_ReturnsEmpty() {
        // Given
        when(campaignRepository.findById("non-existent")).thenReturn(Optional.empty());

        // When
        Optional<CampaignSummaryDto> result = campaignService.getCampaignSummary("non-existent");

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void progressPercent_WithZeroTarget_ReturnsZero() {
        // Given
        Campaign zeroTargetCampaign = Campaign.builder()
                .id("camp-zero")
                .title("Zero Target Campaign")
                .shortDescription("Test zero target")
                .targetAmount(0L)
                .currency("USD")
                .active(true)
                .featured(false)
                .urgent(false)
                .updatedAt(Instant.now())
                .build();

        when(campaignRepository.findById("camp-zero")).thenReturn(Optional.of(zeroTargetCampaign));
        when(donationRepository.sumSuccessfulDonationsByCampaignId("camp-zero")).thenReturn(1000L);

        // When
        Optional<CampaignPopupDto> result = campaignService.getCampaignForPopup("camp-zero");

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getProgressPercent()).isEqualTo(0);
    }

    @Test
    void progressPercent_OverTarget_CapsAt100() {
        // Given
        when(campaignRepository.findById("camp-001")).thenReturn(Optional.of(activeCampaign));
        when(donationRepository.sumSuccessfulDonationsByCampaignId("camp-001")).thenReturn(60000L); // Over target

        // When
        Optional<CampaignPopupDto> result = campaignService.getCampaignForPopup("camp-001");

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getProgressPercent()).isEqualTo(100);
    }
}

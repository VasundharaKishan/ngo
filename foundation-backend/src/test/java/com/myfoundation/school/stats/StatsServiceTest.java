package com.myfoundation.school.stats;

import com.myfoundation.school.campaign.Campaign;
import com.myfoundation.school.campaign.CampaignRepository;
import com.myfoundation.school.donation.Donation;
import com.myfoundation.school.donation.DonationRepository;
import com.myfoundation.school.donation.DonationStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StatsServiceTest {
    
    @Mock
    private CampaignRepository campaignRepository;
    
    @Mock
    private DonationRepository donationRepository;
    
    @InjectMocks
    private StatsService statsService;
    
    private List<Campaign> mockActiveCampaigns;
    private List<Donation> mockDonations;
    
    @BeforeEach
    void setUp() {
        // Mock 3 active campaigns with beneficiaries
        Campaign campaign1 = Campaign.builder()
                .id("c1")
                .title("Campaign 1")
                .beneficiariesCount(1000)
                .active(true)
                .build();
        
        Campaign campaign2 = Campaign.builder()
                .id("c2")
                .title("Campaign 2")
                .beneficiariesCount(2500)
                .active(true)
                .build();
        
        Campaign campaign3 = Campaign.builder()
                .id("c3")
                .title("Campaign 3")
                .beneficiariesCount(null) // Test null handling
                .active(true)
                .build();
        
        mockActiveCampaigns = Arrays.asList(campaign1, campaign2, campaign3);
        
        // Mock 5 donations: 4 SUCCESS, 1 FAILED
        Donation d1 = Donation.builder().id("d1").amount(10000L).status(DonationStatus.SUCCESS).build();
        Donation d2 = Donation.builder().id("d2").amount(25000L).status(DonationStatus.SUCCESS).build();
        Donation d3 = Donation.builder().id("d3").amount(50000L).status(DonationStatus.SUCCESS).build();
        Donation d4 = Donation.builder().id("d4").amount(15000L).status(DonationStatus.SUCCESS).build();
        Donation d5 = Donation.builder().id("d5").amount(5000L).status(DonationStatus.FAILED).build();
        
        mockDonations = Arrays.asList(d1, d2, d3, d4, d5);
    }
    
    @Test
    void getPublicStats_shouldComputeCorrectValues() {
        // Arrange
        when(campaignRepository.findByActiveTrue()).thenReturn(mockActiveCampaigns);
        when(donationRepository.findAll()).thenReturn(mockDonations);
        when(donationRepository.count()).thenReturn(5L);
        
        // Act
        PublicStatsDTO stats = statsService.getPublicStats();
        
        // Assert
        assertThat(stats).isNotNull();
        assertThat(stats.getLivesImpacted()).isEqualTo(3500L); // 1000 + 2500 + 0
        assertThat(stats.getActiveCampaigns()).isEqualTo(3L);
        assertThat(stats.getFundsRaised()).isEqualTo(100000L); // 10k + 25k + 50k + 15k
        assertThat(stats.getSuccessRate()).isEqualTo(80.0); // 4/5 * 100
    }
    
    @Test
    void getPublicStats_withNoCampaigns_shouldReturnZeros() {
        // Arrange
        when(campaignRepository.findByActiveTrue()).thenReturn(Collections.emptyList());
        when(donationRepository.findAll()).thenReturn(Collections.emptyList());
        when(donationRepository.count()).thenReturn(0L);
        
        // Act
        PublicStatsDTO stats = statsService.getPublicStats();
        
        // Assert
        assertThat(stats).isNotNull();
        assertThat(stats.getLivesImpacted()).isEqualTo(0L);
        assertThat(stats.getActiveCampaigns()).isEqualTo(0L);
        assertThat(stats.getFundsRaised()).isEqualTo(0L);
        assertThat(stats.getSuccessRate()).isNull(); // No donations
    }
    
    @Test
    void getPublicStats_withOnlyFailedDonations_shouldReturn0SuccessRate() {
        // Arrange
        Donation failed = Donation.builder().id("f1").amount(1000L).status(DonationStatus.FAILED).build();
        when(campaignRepository.findByActiveTrue()).thenReturn(mockActiveCampaigns);
        when(donationRepository.findAll()).thenReturn(Collections.singletonList(failed));
        when(donationRepository.count()).thenReturn(1L);
        
        // Act
        PublicStatsDTO stats = statsService.getPublicStats();
        
        // Assert
        assertThat(stats.getSuccessRate()).isEqualTo(0.0);
    }
    
    @Test
    void getPublicStats_withAllSuccessfulDonations_shouldReturn100SuccessRate() {
        // Arrange
        List<Donation> allSuccess = Arrays.asList(
                Donation.builder().id("s1").amount(1000L).status(DonationStatus.SUCCESS).build(),
                Donation.builder().id("s2").amount(2000L).status(DonationStatus.SUCCESS).build()
        );
        when(campaignRepository.findByActiveTrue()).thenReturn(mockActiveCampaigns);
        when(donationRepository.findAll()).thenReturn(allSuccess);
        when(donationRepository.count()).thenReturn(2L);
        
        // Act
        PublicStatsDTO stats = statsService.getPublicStats();
        
        // Assert
        assertThat(stats.getSuccessRate()).isEqualTo(100.0);
    }
}

package com.myfoundation.school.donation;

import com.myfoundation.school.campaign.Campaign;
import com.myfoundation.school.campaign.CampaignRepository;
import com.myfoundation.school.config.StripeConfig;
import com.myfoundation.school.dto.DonationRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DonationServiceTest {
    
    @Mock
    private DonationRepository donationRepository;
    
    @Mock
    private CampaignRepository campaignRepository;
    
    @Mock
    private StripeConfig stripeConfig;
    
    @InjectMocks
    private DonationService donationService;
    
    private Campaign testCampaign;
    private DonationRequest testRequest;
    
    @BeforeEach
    void setUp() {
        testCampaign = Campaign.builder()
                .id("campaign-123")
                .title("Build Classroom")
                .slug("build-classroom")
                .shortDescription("Help us build a new classroom")
                .targetAmount(100000L)
                .currency("USD")
                .active(true)
                .build();
        
        testRequest = DonationRequest.builder()
                .amount(5000L)
                .currency("USD")
                .donorName("John Doe")
                .donorEmail("john@example.com")
                .campaignId("campaign-123")
                .build();
    }
    
    @Test
    void testCreateStripeCheckoutSession_CampaignNotFound() {
        when(campaignRepository.findById("campaign-123")).thenReturn(Optional.empty());
        
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            donationService.createStripeCheckoutSession(testRequest);
        });
        
        assertTrue(exception.getMessage().contains("Campaign not found"));
        verify(donationRepository, never()).save(any());
    }
    
    @Test
    void testCreateStripeCheckoutSession_InactiveCampaign() {
        testCampaign.setActive(false);
        when(campaignRepository.findById("campaign-123")).thenReturn(Optional.of(testCampaign));
        
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            donationService.createStripeCheckoutSession(testRequest);
        });
        
        assertTrue(exception.getMessage().contains("not accepting donations"));
        verify(donationRepository, never()).save(any());
    }
    
    @Test
    void testMarkDonationSuccessFromStripe() {
        Donation donation = Donation.builder()
                .id("donation-123")
                .amount(5000L)
                .currency("USD")
                .status(DonationStatus.PENDING)
                .campaign(testCampaign)
                .build();
        
        when(donationRepository.findById("donation-123")).thenReturn(Optional.of(donation));
        when(donationRepository.save(any(Donation.class))).thenReturn(donation);
        
        donationService.markDonationSuccessFromStripe("donation-123", "pi_123");
        
        verify(donationRepository).save(argThat(d -> 
            d.getStatus() == DonationStatus.SUCCESS && 
            "pi_123".equals(d.getStripePaymentIntentId())
        ));
    }
    
    @Test
    void testMarkDonationFailed() {
        Donation donation = Donation.builder()
                .id("donation-123")
                .amount(5000L)
                .currency("USD")
                .status(DonationStatus.PENDING)
                .campaign(testCampaign)
                .build();
        
        when(donationRepository.findById("donation-123")).thenReturn(Optional.of(donation));
        when(donationRepository.save(any(Donation.class))).thenReturn(donation);
        
        donationService.markDonationFailed("donation-123");
        
        verify(donationRepository).save(argThat(d -> d.getStatus() == DonationStatus.FAILED));
    }
}

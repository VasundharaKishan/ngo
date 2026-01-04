package com.myfoundation.school.donation;

import com.myfoundation.school.auth.EmailService;
import com.myfoundation.school.campaign.Campaign;
import com.myfoundation.school.campaign.CampaignRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Test class for donation email functionality.
 * Verifies that emails are sent correctly after successful donations.
 */
@ExtendWith(MockitoExtension.class)
class DonationEmailTest {

    @Mock
    private DonationRepository donationRepository;

    @Mock
    private CampaignRepository campaignRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private DonationService donationService;

    @Test
    void testDonationSuccessEmailsSent() {
        // Arrange
        String donationId = "don_test123";
        String paymentIntentId = "pi_test123";
        
        Campaign campaign = Campaign.builder()
                .id("camp_test")
                .title("Test Campaign")
                .build();
        
        Donation donation = Donation.builder()
                .id(donationId)
                .status(DonationStatus.PENDING)
                .donorName("John Doe")
                .donorEmail("john@example.com")
                .amount(5000L) // $50.00
                .currency("usd")
                .campaign(campaign)
                .createdAt(Instant.now())
                .build();

        when(donationRepository.findById(donationId)).thenReturn(Optional.of(donation));
        when(donationRepository.save(any(Donation.class))).thenReturn(donation);
        
        // Mock email service to not throw exceptions
        doNothing().when(emailService).sendDonationAcknowledgement(
                anyString(), anyString(), anyLong(), anyString(), anyString(), anyString(), anyString()
        );
        doNothing().when(emailService).sendDonationNotificationToAdmin(
                anyString(), anyString(), anyLong(), anyString(), anyString(), anyString(), anyString()
        );

        // Act
        donationService.markDonationSuccessFromStripe(donationId, paymentIntentId);

        // Assert
        verify(donationRepository).save(argThat(d -> 
            d.getStatus() == DonationStatus.SUCCESS && 
            d.getStripePaymentIntentId().equals(paymentIntentId)
        ));
        
        // Verify donor acknowledgement email was sent
        verify(emailService, times(1)).sendDonationAcknowledgement(
                eq("john@example.com"),
                eq("John Doe"),
                eq(5000L),
                eq("usd"),
                eq("Test Campaign"),
                eq(donationId),
                anyString()
        );
        
        // Verify admin notification email was sent
        verify(emailService, times(1)).sendDonationNotificationToAdmin(
                eq("John Doe"),
                eq("john@example.com"),
                eq(5000L),
                eq("usd"),
                eq("Test Campaign"),
                eq(donationId),
                anyString()
        );
    }

    @Test
    void testDonationSuccessEmailFailureDoesNotAffectDonationStatus() {
        // Arrange
        String donationId = "don_test456";
        String paymentIntentId = "pi_test456";
        
        Campaign campaign = Campaign.builder()
                .id("camp_test")
                .title("Test Campaign")
                .build();
        
        Donation donation = Donation.builder()
                .id(donationId)
                .status(DonationStatus.PENDING)
                .donorName("Jane Smith")
                .donorEmail("jane@example.com")
                .amount(10000L)
                .currency("usd")
                .campaign(campaign)
                .createdAt(Instant.now())
                .build();

        when(donationRepository.findById(donationId)).thenReturn(Optional.of(donation));
        when(donationRepository.save(any(Donation.class))).thenReturn(donation);
        
        // Mock email service to throw exception
        doThrow(new RuntimeException("Email service unavailable"))
                .when(emailService).sendDonationAcknowledgement(
                        anyString(), anyString(), anyLong(), anyString(), anyString(), anyString(), anyString()
                );

        // Act - should not throw exception even if email fails
        donationService.markDonationSuccessFromStripe(donationId, paymentIntentId);

        // Assert - donation should still be marked as SUCCESS
        verify(donationRepository).save(argThat(d -> 
            d.getStatus() == DonationStatus.SUCCESS
        ));
    }

    @Test
    void testIdempotencyDoesNotSendDuplicateEmails() {
        // Arrange
        String donationId = "don_test789";
        String paymentIntentId = "pi_test789";
        
        Campaign campaign = Campaign.builder()
                .id("camp_test")
                .title("Test Campaign")
                .build();
        
        Donation donation = Donation.builder()
                .id(donationId)
                .status(DonationStatus.SUCCESS) // Already successful
                .stripePaymentIntentId(paymentIntentId)
                .donorName("Bob Johnson")
                .donorEmail("bob@example.com")
                .amount(2500L)
                .currency("usd")
                .campaign(campaign)
                .createdAt(Instant.now())
                .build();

        when(donationRepository.findById(donationId)).thenReturn(Optional.of(donation));

        // Act
        donationService.markDonationSuccessFromStripe(donationId, paymentIntentId);

        // Assert - donation should not be saved again (idempotency)
        verify(donationRepository, never()).save(any(Donation.class));
        
        // Assert - emails should not be sent (idempotency)
        verify(emailService, never()).sendDonationAcknowledgement(
                anyString(), anyString(), anyLong(), anyString(), anyString(), anyString(), anyString()
        );
        verify(emailService, never()).sendDonationNotificationToAdmin(
                anyString(), anyString(), anyLong(), anyString(), anyString(), anyString(), anyString()
        );
    }

    @Test
    void testDonationWithoutCampaignSendsEmailWithGenericTitle() {
        // Arrange
        String donationId = "don_test_no_campaign";
        String paymentIntentId = "pi_test_no_campaign";
        
        Donation donation = Donation.builder()
                .id(donationId)
                .status(DonationStatus.PENDING)
                .donorName("Alice Williams")
                .donorEmail("alice@example.com")
                .amount(7500L)
                .currency("usd")
                .campaign(null) // No campaign associated
                .createdAt(Instant.now())
                .build();

        when(donationRepository.findById(donationId)).thenReturn(Optional.of(donation));
        when(donationRepository.save(any(Donation.class))).thenReturn(donation);
        
        doNothing().when(emailService).sendDonationAcknowledgement(
                anyString(), anyString(), anyLong(), anyString(), anyString(), anyString(), anyString()
        );
        doNothing().when(emailService).sendDonationNotificationToAdmin(
                anyString(), anyString(), anyLong(), anyString(), anyString(), anyString(), anyString()
        );

        // Act
        donationService.markDonationSuccessFromStripe(donationId, paymentIntentId);

        // Assert - should use "General Donation" as campaign title
        verify(emailService, times(1)).sendDonationAcknowledgement(
                eq("alice@example.com"),
                eq("Alice Williams"),
                eq(7500L),
                eq("usd"),
                eq("General Donation"),
                eq(donationId),
                anyString()
        );
    }
}

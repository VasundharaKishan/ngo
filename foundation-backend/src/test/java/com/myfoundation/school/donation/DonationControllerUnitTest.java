package com.myfoundation.school.donation;

import com.myfoundation.school.dto.CheckoutSessionResponse;
import com.myfoundation.school.dto.DonationRequest;
import com.myfoundation.school.dto.DonationResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DonationControllerUnitTest {

    @Mock
    private DonationService donationService;

    @Mock
    private ReceiptTokenService receiptTokenService;

    @InjectMocks
    private DonationController controller;

    @Test
    void createCheckoutSession_delegatesToServiceAndReturnsOk() {
        DonationRequest request = new DonationRequest();
        CheckoutSessionResponse expected = new CheckoutSessionResponse();
        expected.setUrl("https://checkout.stripe.com/session-123");

        when(donationService.createStripeCheckoutSession(request)).thenReturn(expected);

        ResponseEntity<CheckoutSessionResponse> response = controller.createCheckoutSession(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getUrl()).isEqualTo("https://checkout.stripe.com/session-123");
        verify(donationService).createStripeCheckoutSession(request);
    }

    @Test
    void verifyDonation_successfulDonation_includesReceiptToken() {
        DonationResponse donation = new DonationResponse();
        donation.setId("don-123");
        donation.setStatus(DonationStatus.SUCCESS);

        when(donationService.verifyDonationBySessionId("session-abc")).thenReturn(donation);
        when(receiptTokenService.generateToken("don-123")).thenReturn("jwt.receipt.token");

        ResponseEntity<DonationResponse> response = controller.verifyDonation("session-abc");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getReceiptToken()).isEqualTo("jwt.receipt.token");
    }

    @Test
    void verifyDonation_pendingDonation_noReceiptToken() {
        DonationResponse donation = new DonationResponse();
        donation.setId("don-456");
        donation.setStatus(DonationStatus.PENDING);

        when(donationService.verifyDonationBySessionId("session-pending")).thenReturn(donation);

        ResponseEntity<DonationResponse> response = controller.verifyDonation("session-pending");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getReceiptToken()).isNull();
        verify(receiptTokenService, never()).generateToken(any());
    }

    @Test
    void verifyDonation_nullId_noReceiptToken() {
        DonationResponse donation = new DonationResponse();
        donation.setId(null);
        donation.setStatus(DonationStatus.SUCCESS);

        when(donationService.verifyDonationBySessionId("session-null")).thenReturn(donation);

        ResponseEntity<DonationResponse> response = controller.verifyDonation("session-null");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(receiptTokenService, never()).generateToken(any());
    }
}

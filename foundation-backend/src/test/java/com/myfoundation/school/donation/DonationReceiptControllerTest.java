package com.myfoundation.school.donation;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DonationReceiptControllerTest {

    @Mock
    private DonationReceiptService donationReceiptService;

    @Mock
    private ReceiptTokenService receiptTokenService;

    @InjectMocks
    private DonationReceiptController controller;

    private static final String DONATION_ID = "don-abc-123";
    private static final byte[] PDF_BYTES = "%PDF-fake".getBytes();

    @Test
    void downloadReceipt_validToken_returnsPdf() {
        String token = "valid.jwt.token";
        when(receiptTokenService.validateToken(token, DONATION_ID))
                .thenReturn(Optional.of(DONATION_ID));
        when(donationReceiptService.generateReceipt(DONATION_ID))
                .thenReturn(PDF_BYTES);

        ResponseEntity<byte[]> response = controller.downloadReceipt(DONATION_ID, token, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(PDF_BYTES);
        assertThat(response.getHeaders().getContentType().toString()).isEqualTo("application/pdf");
        verify(donationReceiptService, never()).findAndVerifyDonation(any(), any());
    }

    @Test
    void downloadReceipt_validEmail_returnsPdf() {
        String email = "donor@example.com";
        Donation donation = Donation.builder().id(DONATION_ID).donorEmail(email).build();
        when(donationReceiptService.findAndVerifyDonation(DONATION_ID, email))
                .thenReturn(donation);
        when(donationReceiptService.generateReceipt(DONATION_ID))
                .thenReturn(PDF_BYTES);

        ResponseEntity<byte[]> response = controller.downloadReceipt(DONATION_ID, null, email);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(PDF_BYTES);
    }

    @Test
    void downloadReceipt_invalidToken_fallsBackToEmail() {
        String token = "invalid.token";
        String email = "donor@example.com";
        Donation donation = Donation.builder().id(DONATION_ID).donorEmail(email).build();

        when(receiptTokenService.validateToken(token, DONATION_ID))
                .thenReturn(Optional.empty());
        when(donationReceiptService.findAndVerifyDonation(DONATION_ID, email))
                .thenReturn(donation);
        when(donationReceiptService.generateReceipt(DONATION_ID))
                .thenReturn(PDF_BYTES);

        ResponseEntity<byte[]> response = controller.downloadReceipt(DONATION_ID, token, email);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void downloadReceipt_noCredentials_returns403() {
        ResponseEntity<byte[]> response = controller.downloadReceipt(DONATION_ID, null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).isNull();
        verify(donationReceiptService, never()).generateReceipt(any());
    }

    @Test
    void downloadReceipt_invalidTokenAndWrongEmail_returns403() {
        when(receiptTokenService.validateToken("bad.token", DONATION_ID))
                .thenReturn(Optional.empty());
        when(donationReceiptService.findAndVerifyDonation(DONATION_ID, "wrong@example.com"))
                .thenReturn(null);

        ResponseEntity<byte[]> response = controller.downloadReceipt(DONATION_ID, "bad.token", "wrong@example.com");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(donationReceiptService, never()).generateReceipt(any());
    }

    @Test
    void downloadReceipt_blankToken_treatedAsAbsent() {
        when(donationReceiptService.findAndVerifyDonation(DONATION_ID, "donor@test.com"))
                .thenReturn(Donation.builder().id(DONATION_ID).build());
        when(donationReceiptService.generateReceipt(DONATION_ID))
                .thenReturn(PDF_BYTES);

        ResponseEntity<byte[]> response = controller.downloadReceipt(DONATION_ID, "   ", "donor@test.com");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(receiptTokenService, never()).validateToken(any(), any());
    }

    @Test
    void downloadReceipt_blankEmail_treatedAsAbsent() {
        ResponseEntity<byte[]> response = controller.downloadReceipt(DONATION_ID, null, "  ");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void downloadReceipt_setsContentDispositionFilename() {
        when(receiptTokenService.validateToken("tok", DONATION_ID))
                .thenReturn(Optional.of(DONATION_ID));
        when(donationReceiptService.generateReceipt(DONATION_ID))
                .thenReturn(PDF_BYTES);

        ResponseEntity<byte[]> response = controller.downloadReceipt(DONATION_ID, "tok", null);

        String disposition = response.getHeaders().getContentDisposition().toString();
        assertThat(disposition).contains("donation-receipt-" + DONATION_ID + ".pdf");
    }

    @Test
    void downloadReceipt_setsContentLength() {
        when(receiptTokenService.validateToken("tok", DONATION_ID))
                .thenReturn(Optional.of(DONATION_ID));
        when(donationReceiptService.generateReceipt(DONATION_ID))
                .thenReturn(PDF_BYTES);

        ResponseEntity<byte[]> response = controller.downloadReceipt(DONATION_ID, "tok", null);

        assertThat(response.getHeaders().getContentLength()).isEqualTo(PDF_BYTES.length);
    }
}

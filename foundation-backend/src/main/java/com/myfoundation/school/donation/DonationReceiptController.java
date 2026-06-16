package com.myfoundation.school.donation;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Public endpoint for downloading donation PDF receipts.
 *
 * Security: donors must provide their email address to download a receipt,
 * preventing enumeration of donation IDs by unauthorized parties.
 */
@RestController
@RequestMapping("/api/donations")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Donation Receipts", description = "Download donation PDF receipts")
public class DonationReceiptController {

    private final DonationReceiptService donationReceiptService;

    @Operation(
        summary = "Download donation receipt PDF",
        description = "Downloads a PDF receipt for a donation. The donor must provide their email " +
                      "address as a query parameter for verification. Returns 403 if the email does not match."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "PDF receipt returned successfully"),
        @ApiResponse(responseCode = "403", description = "Email does not match the donation record"),
        @ApiResponse(responseCode = "404", description = "Donation not found")
    })
    @GetMapping("/{id}/receipt")
    public ResponseEntity<byte[]> downloadReceipt(
            @PathVariable String id,
            @RequestParam(required = false) String email) {

        log.info("GET /api/donations/{}/receipt - Receipt download requested", id);

        if (email == null || email.isBlank()) {
            log.warn("Receipt download denied for donation {} - no email provided", id);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Donation donation = donationReceiptService.findAndVerifyDonation(id, email);
        if (donation == null) {
            log.warn("Receipt download denied for donation {} - email mismatch", id);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        byte[] pdfBytes = donationReceiptService.generateReceipt(id);

        String filename = "donation-receipt-" + id + ".pdf";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", filename);
        headers.setContentLength(pdfBytes.length);

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}

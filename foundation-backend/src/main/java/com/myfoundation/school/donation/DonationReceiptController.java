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

@RestController
@RequestMapping("/api/donations")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Donation Receipts", description = "Download donation PDF receipts")
public class DonationReceiptController {

    private final DonationReceiptService donationReceiptService;
    private final ReceiptTokenService receiptTokenService;

    @Operation(
        summary = "Download donation receipt PDF",
        description = "Downloads a PDF receipt for a donation. Requires a signed token (issued at checkout) " +
                      "or the donor's email address for verification."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "PDF receipt returned successfully"),
        @ApiResponse(responseCode = "403", description = "Invalid token or email mismatch"),
        @ApiResponse(responseCode = "404", description = "Donation not found")
    })
    @GetMapping("/{id}/receipt")
    public ResponseEntity<byte[]> downloadReceipt(
            @PathVariable String id,
            @RequestParam(required = false) String token,
            @RequestParam(required = false) String email) {

        log.info("GET /api/donations/{}/receipt - Receipt download requested", id);

        boolean authorized = false;

        if (token != null && !token.isBlank()) {
            authorized = receiptTokenService.validateToken(token, id).isPresent();
        }

        if (!authorized && email != null && !email.isBlank()) {
            authorized = donationReceiptService.findAndVerifyDonation(id, email) != null;
        }

        if (!authorized) {
            log.warn("Receipt download denied for donation {} - invalid credentials", id);
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

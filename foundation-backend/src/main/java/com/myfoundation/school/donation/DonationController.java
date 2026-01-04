package com.myfoundation.school.donation;

import com.myfoundation.school.dto.CheckoutSessionResponse;
import com.myfoundation.school.dto.DonationRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/donations/stripe")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Donations", description = "Donation processing endpoints for Stripe payments")
public class DonationController {
    
    private final DonationService donationService;
    
    @Operation(
        summary = "Create Stripe checkout session",
        description = "Creates a Stripe checkout session for processing a donation to a specific campaign. " +
                      "Returns a session URL to redirect the donor to Stripe's hosted checkout page."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Checkout session created successfully",
            content = @Content(schema = @Schema(implementation = CheckoutSessionResponse.class))
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid request data (e.g., campaign not found, inactive campaign)"
        ),
        @ApiResponse(
            responseCode = "500",
            description = "Stripe API error or internal server error"
        )
    })
    @PostMapping("/create")
    public ResponseEntity<CheckoutSessionResponse> createCheckoutSession(
            @Valid @RequestBody DonationRequest request) {
        log.info("POST /api/donations/stripe/create - Creating checkout session for campaign: {}", 
                request.getCampaignId());
        
        CheckoutSessionResponse response = donationService.createStripeCheckoutSession(request);
        return ResponseEntity.ok(response);
    }
}

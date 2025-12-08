package com.myfoundation.school.donation;

import com.myfoundation.school.dto.CheckoutSessionResponse;
import com.myfoundation.school.dto.DonationRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/donations/stripe")
@RequiredArgsConstructor
@Slf4j
public class DonationController {
    
    private final DonationService donationService;
    
    @PostMapping("/create")
    public ResponseEntity<CheckoutSessionResponse> createCheckoutSession(
            @Valid @RequestBody DonationRequest request) {
        log.info("POST /api/donations/stripe/create - Creating checkout session for campaign: {}", 
                request.getCampaignId());
        
        CheckoutSessionResponse response = donationService.createStripeCheckoutSession(request);
        return ResponseEntity.ok(response);
    }
}

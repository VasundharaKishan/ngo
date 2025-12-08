package com.myfoundation.school.webhook;

import com.myfoundation.school.config.StripeConfig;
import com.myfoundation.school.donation.DonationService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/donations/stripe")
@RequiredArgsConstructor
@Slf4j
public class StripeWebhookController {
    
    private final DonationService donationService;
    private final StripeConfig stripeConfig;
    
    @PostMapping("/webhook")
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {
        
        log.info("Received Stripe webhook");
        
        Event event;
        
        try {
            event = Webhook.constructEvent(
                    payload, 
                    sigHeader, 
                    stripeConfig.getWebhookSecret()
            );
        } catch (SignatureVerificationException e) {
            log.error("Invalid webhook signature", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature");
        }
        
        log.info("Processing webhook event type: {}", event.getType());
        
        // Handle the event
        switch (event.getType()) {
            case "checkout.session.completed":
                handleCheckoutSessionCompleted(event);
                break;
            case "checkout.session.expired":
                handleCheckoutSessionExpired(event);
                break;
            default:
                log.info("Unhandled event type: {}", event.getType());
        }
        
        return ResponseEntity.ok("ok");
    }
    
    private void handleCheckoutSessionCompleted(Event event) {
        Session session = (Session) event.getDataObjectDeserializer()
                .getObject()
                .orElseThrow(() -> new RuntimeException("Failed to deserialize session"));
        
        log.info("Checkout session completed: {}", session.getId());
        
        String donationId = session.getMetadata().get("donationId");
        String paymentIntentId = session.getPaymentIntent();
        
        if (donationId != null) {
            try {
                donationService.markDonationSuccessFromStripe(donationId, paymentIntentId);
                log.info("Successfully processed checkout.session.completed for donation: {}", donationId);
            } catch (Exception e) {
                log.error("Failed to update donation status for id: {}", donationId, e);
            }
        } else {
            log.warn("No donationId found in session metadata");
        }
    }
    
    private void handleCheckoutSessionExpired(Event event) {
        Session session = (Session) event.getDataObjectDeserializer()
                .getObject()
                .orElseThrow(() -> new RuntimeException("Failed to deserialize session"));
        
        log.info("Checkout session expired: {}", session.getId());
        
        String donationId = session.getMetadata().get("donationId");
        
        if (donationId != null) {
            try {
                donationService.markDonationFailed(donationId);
                log.info("Successfully processed checkout.session.expired for donation: {}", donationId);
            } catch (Exception e) {
                log.error("Failed to mark donation as failed for id: {}", donationId, e);
            }
        }
    }
}

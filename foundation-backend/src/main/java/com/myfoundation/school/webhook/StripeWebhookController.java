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
    private final WebhookReplayGuard webhookReplayGuard;
    private final StripeEventRecordService eventRecordService;
    
    @PostMapping("/webhook")
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {
        
        log.info("[Webhook] Received Stripe webhook request");
        
        Event event;
        
        try {
            event = Webhook.constructEvent(
                    payload, 
                    sigHeader, 
                    stripeConfig.getWebhookSecret()
            );
        } catch (SignatureVerificationException e) {
            log.error("[Webhook] Invalid webhook signature - potential security issue", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature");
        }

        if (!isTimestampFresh(event)) {
            log.warn("[Webhook] Event timestamp too old/new for id {}", event.getId());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("stale event");
        }

        if (webhookReplayGuard.isReplay(event.getId())) {
            log.warn("[Webhook] Replay detected for event id {}", event.getId());
            return ResponseEntity.status(HttpStatus.OK).body("ignored");
        }

        if (eventRecordService.isReplayAndRecord(event.getId())) {
            log.warn("[Webhook] Persistent replay detected for event id {}", event.getId());
            return ResponseEntity.status(HttpStatus.OK).body("ignored");
        }

        log.info("[Webhook] Processing event: {} (ID: {})", event.getType(), event.getId());
        
        // Handle the event
        switch (event.getType()) {
            case "checkout.session.completed":
                handleCheckoutSessionCompleted(event);
                break;
            case "checkout.session.async_payment_succeeded":
                handleAsyncPaymentSucceeded(event);
                break;
            case "checkout.session.async_payment_failed":
                handleAsyncPaymentFailed(event);
                break;
            case "checkout.session.expired":
                handleCheckoutSessionExpired(event);
                break;
            default:
                log.info("[Webhook] Unhandled event type: {} - ignoring", event.getType());
        }
        
        log.info("[Webhook] Successfully processed event: {}", event.getId());
        return ResponseEntity.ok("ok");
    }

    private boolean isTimestampFresh(Event event) {
        if (event == null || event.getCreated() == null) {
            return true;
        }
        long created = event.getCreated();
        long now = System.currentTimeMillis() / 1000;
        long skew = Math.abs(now - created);
        return skew <= 300;
    }
    
    private void handleCheckoutSessionCompleted(Event event) {

        Session session = (Session) event.getDataObjectDeserializer()
                .getObject()
                .orElseThrow(() -> new RuntimeException("Failed to deserialize session"));
        
        String sessionId = session.getId();
        String paymentStatus = session.getPaymentStatus();
        String paymentIntentId = session.getPaymentIntent();
        
        log.info("[Webhook] checkout.session.completed - sessionId: {}, payment_status: {}, payment_intent: {}",
                sessionId, paymentStatus, paymentIntentId);
        
        String donationId = session.getMetadata().get("donationId");
        String campaignId = session.getMetadata().get("campaignId");
        
        log.info("[Webhook] Session metadata - donationId: {}, campaignId: {}", donationId, campaignId);
        
        if (donationId == null) {
            log.warn("[Webhook] No donationId in session metadata - cannot update donation status");
            return;
        }
        
        try {
            // Check payment_status to determine if payment completed immediately or is async
            if ("paid".equals(paymentStatus) || "no_payment_required".equals(paymentStatus)) {
                // Immediate payment success (card, Link, etc.)
                log.info("[Webhook] Payment completed immediately (payment_status={}), marking donation {} as SUCCESS",
                        paymentStatus, donationId);
                donationService.markDonationSuccessFromStripe(donationId, paymentIntentId);
                log.info("[Webhook] Successfully marked donation {} as SUCCESS", donationId);
            } else {
                // Async payment pending (Klarna, Bancontact, EPS, Revolut Pay, Amazon Pay)
                log.info("[Webhook] Checkout completed but payment_status='{}' (unpaid) for donation {}. " +
                        "Payment is async - awaiting checkout.session.async_payment_succeeded webhook",
                        paymentStatus, donationId);
                // Donation remains PENDING - no action needed
            }
        } catch (Exception e) {
            log.error("[Webhook] Failed to process checkout.session.completed for donation: {} - Error: {}",
                    donationId, e.getMessage(), e);
        }
    }
    
    private void handleAsyncPaymentSucceeded(Event event) {
        Session session = (Session) event.getDataObjectDeserializer()
                .getObject()
                .orElseThrow(() -> new RuntimeException("Failed to deserialize session"));
        
        String sessionId = session.getId();
        String paymentStatus = session.getPaymentStatus();
        String paymentIntentId = session.getPaymentIntent();
        
        log.info("[Webhook] checkout.session.async_payment_succeeded - sessionId: {}, payment_status: {}, payment_intent: {}",
                sessionId, paymentStatus, paymentIntentId);
        
        String donationId = session.getMetadata().get("donationId");
        String campaignId = session.getMetadata().get("campaignId");
        
        log.info("[Webhook] Session metadata - donationId: {}, campaignId: {}", donationId, campaignId);
        
        if (donationId == null) {
            log.warn("[Webhook] No donationId in session metadata - cannot update donation status");
            return;
        }
        
        try {
            // Verify payment_status is paid before marking success
            if ("paid".equals(paymentStatus)) {
                log.info("[Webhook] Async payment succeeded (payment_status=paid), marking donation {} as SUCCESS",
                        donationId);
                donationService.markDonationSuccessFromStripe(donationId, paymentIntentId);
                log.info("[Webhook] Successfully marked donation {} as SUCCESS after async payment", donationId);
            } else {
                log.warn("[Webhook] async_payment_succeeded but payment_status='{}' (not paid) for donation {} - unexpected state",
                        paymentStatus, donationId);
            }
        } catch (Exception e) {
            log.error("[Webhook] Failed to process async_payment_succeeded for donation: {} - Error: {}",
                    donationId, e.getMessage(), e);
        }
    }
    
    private void handleAsyncPaymentFailed(Event event) {
        Session session = (Session) event.getDataObjectDeserializer()
                .getObject()
                .orElseThrow(() -> new RuntimeException("Failed to deserialize session"));
        
        String sessionId = session.getId();
        String paymentStatus = session.getPaymentStatus();
        
        log.info("[Webhook] checkout.session.async_payment_failed - sessionId: {}, payment_status: {}",
                sessionId, paymentStatus);
        
        String donationId = session.getMetadata().get("donationId");
        String campaignId = session.getMetadata().get("campaignId");
        
        log.info("[Webhook] Session metadata - donationId: {}, campaignId: {}", donationId, campaignId);
        
        if (donationId == null) {
            log.warn("[Webhook] No donationId in session metadata - cannot mark donation as failed");
            return;
        }
        
        try {
            log.info("[Webhook] Async payment failed, marking donation {} as FAILED", donationId);
            donationService.markDonationFailed(donationId);
            log.info("[Webhook] Successfully marked donation {} as FAILED after async payment failure", donationId);
        } catch (Exception e) {
            log.error("[Webhook] Failed to process async_payment_failed for donation: {} - Error: {}",
                    donationId, e.getMessage(), e);
        }
    }
    
    private void handleCheckoutSessionExpired(Event event) {
        Session session = (Session) event.getDataObjectDeserializer()
                .getObject()
                .orElseThrow(() -> new RuntimeException("Failed to deserialize session"));
        
        String sessionId = session.getId();
        String sessionStatus = session.getStatus();
        
        log.info("[Webhook] checkout.session.expired - sessionId: {}, session_status: {}", sessionId, sessionStatus);
        
        String donationId = session.getMetadata().get("donationId");
        String campaignId = session.getMetadata().get("campaignId");
        
        log.info("[Webhook] Session metadata - donationId: {}, campaignId: {}", donationId, campaignId);
        
        if (donationId == null) {
            log.warn("[Webhook] No donationId in session metadata - cannot mark donation as failed");
            return;
        }
        
        try {
            log.info("[Webhook] Session expired, marking donation {} as FAILED", donationId);
            donationService.markDonationFailed(donationId);
            log.info("[Webhook] Successfully marked donation {} as FAILED after session expiration", donationId);
        } catch (Exception e) {
            log.error("[Webhook] Failed to process session.expired for donation: {} - Error: {}",
                    donationId, e.getMessage(), e);
        }
    }
}

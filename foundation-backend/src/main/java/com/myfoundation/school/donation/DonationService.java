package com.myfoundation.school.donation;

import com.myfoundation.school.campaign.Campaign;
import com.myfoundation.school.campaign.CampaignRepository;
import com.myfoundation.school.config.StripeConfig;
import com.myfoundation.school.dto.CheckoutSessionResponse;
import com.myfoundation.school.dto.DonationRequest;
import com.myfoundation.school.dto.DonationResponse;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class DonationService {
    
    private final DonationRepository donationRepository;
    private final CampaignRepository campaignRepository;
    private final StripeConfig stripeConfig;
    
    @Transactional
    public CheckoutSessionResponse createStripeCheckoutSession(DonationRequest request) {
        log.info("Creating Stripe checkout session for campaign: {}, amount: {}", 
                request.getCampaignId(), request.getAmount());
        
        // Validate campaign exists and is active
        Campaign campaign = campaignRepository.findById(request.getCampaignId())
                .orElseThrow(() -> new RuntimeException("Campaign not found with id: " + request.getCampaignId()));
        
        if (!campaign.getActive()) {
            throw new RuntimeException("This campaign is not accepting donations at this time. Please choose another campaign.");
        }
        
        // Create donation entity with PENDING status
        Donation donation = Donation.builder()
                .amount(request.getAmount())
                .currency(request.getCurrency().toLowerCase())
                .donorName(request.getDonorName())
                .donorEmail(request.getDonorEmail())
                .status(DonationStatus.PENDING)
                .campaign(campaign)
                .build();
        
        donation = donationRepository.save(donation);
        log.info("Created donation with id: {}", donation.getId());
        
        try {
            // Create Stripe Checkout Session
            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(stripeConfig.getSuccessUrl())
                    .setCancelUrl(stripeConfig.getCancelUrl())
                    .addLineItem(
                            SessionCreateParams.LineItem.builder()
                                    .setPriceData(
                                            SessionCreateParams.LineItem.PriceData.builder()
                                                    .setCurrency(request.getCurrency().toLowerCase())
                                                    .setUnitAmount(request.getAmount())
                                                    .setProductData(
                                                            SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                    .setName("Donation for " + campaign.getTitle())
                                                                    .setDescription(campaign.getShortDescription())
                                                                    .build()
                                                    )
                                                    .build()
                                    )
                                    .setQuantity(1L)
                                    .build()
                    )
                    .putMetadata("donationId", donation.getId())
                    .putMetadata("campaignId", campaign.getId())
                    .build();
            
            Session session = Session.create(params);
            
            // Update donation with session ID
            donation.setStripeSessionId(session.getId());
            donationRepository.save(donation);
            
            log.info("Stripe checkout session created: {}", session.getId());
            
            return CheckoutSessionResponse.builder()
                    .sessionId(session.getId())
                    .url(session.getUrl())
                    .build();
            
        } catch (StripeException e) {
            log.error("Failed to create Stripe checkout session", e);
            throw new RuntimeException("Failed to create checkout session: " + e.getMessage(), e);
        }
    }
    
    @Transactional
    public void markDonationSuccessFromStripe(String donationId, String paymentIntentId) {
        log.info("[Webhook] Attempting to mark donation {} as SUCCESS with paymentIntent: {}", donationId, paymentIntentId);
        
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new RuntimeException("Donation not found with id: " + donationId));
        
        // Idempotency check: if already SUCCESS, skip update (duplicate webhook)
        if (donation.getStatus() == DonationStatus.SUCCESS) {
            log.info("[Webhook] Donation {} already marked as SUCCESS - idempotent webhook, skipping", donationId);
            return;
        }
        
        log.info("[Webhook] Updating donation {} from {} to SUCCESS", donationId, donation.getStatus());
        donation.setStatus(DonationStatus.SUCCESS);
        donation.setStripePaymentIntentId(paymentIntentId);
        donationRepository.save(donation);
        
        log.info("[Webhook] Donation {} successfully marked as SUCCESS. Campaign totals will be derived from this donation.", donationId);
    }
    
    @Transactional
    public void markDonationFailed(String donationId) {
        log.info("[Webhook] Attempting to mark donation {} as FAILED", donationId);
        
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new RuntimeException("Donation not found with id: " + donationId));
        
        // Idempotency check: if already SUCCESS, don't change it (payment succeeded)
        if (donation.getStatus() == DonationStatus.SUCCESS) {
            log.warn("[Webhook] Donation {} already marked as SUCCESS - cannot mark as FAILED, skipping", donationId);
            return;
        }
        
        // Idempotency check: if already FAILED, skip update (duplicate webhook)
        if (donation.getStatus() == DonationStatus.FAILED) {
            log.info("[Webhook] Donation {} already marked as FAILED - idempotent webhook, skipping", donationId);
            return;
        }
        
        log.info("[Webhook] Updating donation {} from {} to FAILED", donationId, donation.getStatus());
        donation.setStatus(DonationStatus.FAILED);
        donationRepository.save(donation);
        
        log.info("[Webhook] Donation {} successfully marked as FAILED", donationId);
    }
    
    @Transactional(readOnly = true)
    public List<DonationResponse> getAllDonations() {
        log.info("Fetching all donations");
        return donationRepository.findAll().stream()
                .map(this::toDonationResponse)
                .collect(Collectors.toList());
    }
    
    private DonationResponse toDonationResponse(Donation donation) {
        return DonationResponse.builder()
                .id(donation.getId())
                .donorName(donation.getDonorName())
                .donorEmail(donation.getDonorEmail())
                .amount(donation.getAmount())
                .currency(donation.getCurrency())
                .status(donation.getStatus())
                .campaignId(donation.getCampaign().getId())
                .campaignTitle(donation.getCampaign().getTitle())
                .createdAt(donation.getCreatedAt())
                .build();
    }
}

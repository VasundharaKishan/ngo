package com.myfoundation.school.stats;

import com.myfoundation.school.campaign.CampaignRepository;
import com.myfoundation.school.donation.DonationRepository;
import com.myfoundation.school.donation.DonationStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service for computing public statistics from database.
 * All KPIs are calculated in real-time.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StatsService {
    
    private final CampaignRepository campaignRepository;
    private final DonationRepository donationRepository;
    
    /**
     * Compute all public statistics from the database.
     * 
     * @return PublicStatsDTO with real-time calculated values
     */
    public PublicStatsDTO getPublicStats() {
        log.info("Computing public statistics from database");
        
        // Lives Impacted: SUM of beneficiariesCount from active campaigns
        Long livesImpacted = campaignRepository.findByActiveTrue()
                .stream()
                .map(campaign -> campaign.getBeneficiariesCount() != null ? campaign.getBeneficiariesCount() : 0)
                .mapToLong(Integer::longValue)
                .sum();
        
        // Active Campaigns: COUNT of active campaigns
        Long activeCampaigns = (long) campaignRepository.findByActiveTrue().size();
        
        // Funds Raised: SUM of successful donation amounts
        Long fundsRaised = donationRepository.findAll()
                .stream()
                .filter(donation -> donation.getStatus() == DonationStatus.SUCCESS)
                .mapToLong(donation -> donation.getAmount())
                .sum();
        
        // Success Rate: (SUCCESS / TOTAL) * 100
        Long totalDonations = donationRepository.count();
        Long successfulDonations = donationRepository.findAll()
                .stream()
                .filter(donation -> donation.getStatus() == DonationStatus.SUCCESS)
                .count();
        
        Double successRate = null;
        if (totalDonations > 0) {
            successRate = (successfulDonations.doubleValue() / totalDonations.doubleValue()) * 100.0;
        }
        
        log.info("Stats computed - Lives: {}, Campaigns: {}, Funds: {}, Success Rate: {}%", 
                livesImpacted, activeCampaigns, fundsRaised, successRate);
        
        return PublicStatsDTO.builder()
                .livesImpacted(livesImpacted)
                .activeCampaigns(activeCampaigns)
                .fundsRaised(fundsRaised)
                .successRate(successRate)
                .build();
    }
}

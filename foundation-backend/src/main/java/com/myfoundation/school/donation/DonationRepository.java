package com.myfoundation.school.donation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DonationRepository extends JpaRepository<Donation, String>, JpaSpecificationExecutor<Donation> {
    
    List<Donation> findByCampaignId(String campaignId);
    
    Optional<Donation> findByStripeSessionId(String stripeSessionId);
    
    /**
     * Calculate the total amount raised for a campaign from successful donations only.
     * Returns 0 if no successful donations exist.
     */
    @Query("SELECT COALESCE(SUM(d.amount), 0L) FROM Donation d WHERE d.campaign.id = :campaignId AND d.status = 'SUCCESS'")
    Long sumSuccessfulDonationsByCampaignId(@Param("campaignId") String campaignId);
}

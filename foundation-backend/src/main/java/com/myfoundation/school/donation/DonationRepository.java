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

    /**
     * Batch-fetch donation sums for multiple campaigns in a single query.
     * Returns a list of [campaignId, totalAmount] pairs for campaigns that have at least one successful donation.
     * Campaigns with no successful donations will NOT appear in the result; callers should default missing IDs to 0.
     *
     * Use this instead of calling {@link #sumSuccessfulDonationsByCampaignId} in a loop to avoid N+1 queries.
     */
    @Query("SELECT d.campaign.id, COALESCE(SUM(d.amount), 0L) FROM Donation d " +
           "WHERE d.campaign.id IN :campaignIds AND d.status = 'SUCCESS' " +
           "GROUP BY d.campaign.id")
    List<Object[]> sumSuccessfulDonationsByCampaignIds(@Param("campaignIds") List<String> campaignIds);

}


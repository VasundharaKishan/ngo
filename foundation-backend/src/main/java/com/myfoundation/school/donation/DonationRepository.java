package com.myfoundation.school.donation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DonationRepository extends JpaRepository<Donation, String> {
    
    List<Donation> findByCampaignId(String campaignId);
    
    Optional<Donation> findByStripeSessionId(String stripeSessionId);
}

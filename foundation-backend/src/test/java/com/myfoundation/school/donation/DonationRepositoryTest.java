package com.myfoundation.school.donation;

import com.myfoundation.school.campaign.Campaign;
import com.myfoundation.school.campaign.CampaignRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class DonationRepositoryTest {

    @Autowired
    private DonationRepository donationRepository;

    @Autowired
    private CampaignRepository campaignRepository;

    private Campaign campaign;

    @BeforeEach
    void setUp() {
        donationRepository.deleteAll();
        campaignRepository.deleteAll();

        campaign = campaignRepository.save(Campaign.builder()
                .title("Test Campaign")
                .slug("test-campaign")
                .targetAmount(100000L)
                .currency("INR")
                .active(true)
                .build());
    }

    private Donation createDonation(String email, long amount, DonationStatus status) {
        return donationRepository.save(Donation.builder()
                .donorName("Donor")
                .donorEmail(email)
                .amount(amount)
                .currency("INR")
                .status(status)
                .campaign(campaign)
                .build());
    }

    @Test
    void sumSuccessfulDonationsByCampaignId_sumsOnlySuccessful() {
        createDonation("a@test.com", 5000L, DonationStatus.SUCCESS);
        createDonation("b@test.com", 3000L, DonationStatus.SUCCESS);
        createDonation("c@test.com", 2000L, DonationStatus.FAILED);

        Long total = donationRepository.sumSuccessfulDonationsByCampaignId(campaign.getId());

        assertThat(total).isEqualTo(8000L);
    }

    @Test
    void sumSuccessfulDonationsByCampaignId_returnsZeroWhenNone() {
        Long total = donationRepository.sumSuccessfulDonationsByCampaignId(campaign.getId());

        assertThat(total).isEqualTo(0L);
    }

    @Test
    void countSuccessfulDonations_countsOnlySuccessful() {
        createDonation("a@test.com", 1000L, DonationStatus.SUCCESS);
        createDonation("b@test.com", 2000L, DonationStatus.PENDING);
        createDonation("c@test.com", 3000L, DonationStatus.SUCCESS);

        Long count = donationRepository.countSuccessfulDonations();

        assertThat(count).isEqualTo(2L);
    }

    @Test
    void countDistinctDonors_countsUniqueEmails() {
        createDonation("same@test.com", 1000L, DonationStatus.SUCCESS);
        createDonation("same@test.com", 2000L, DonationStatus.SUCCESS);
        createDonation("other@test.com", 3000L, DonationStatus.SUCCESS);
        createDonation("failed@test.com", 4000L, DonationStatus.FAILED);

        Long count = donationRepository.countDistinctDonors();

        assertThat(count).isEqualTo(2L);
    }

    @Test
    void findByDonorEmailIgnoreCase_matchesCaseInsensitively() {
        createDonation("User@Test.COM", 1000L, DonationStatus.SUCCESS);

        List<Donation> results = donationRepository.findByDonorEmailIgnoreCase("user@test.com");

        assertThat(results).hasSize(1);
    }

    @Test
    void findByStripeSessionId_returnsMatchingDonation() {
        Donation d = createDonation("a@test.com", 1000L, DonationStatus.SUCCESS);
        d.setStripeSessionId("sess_123");
        donationRepository.save(d);

        Optional<Donation> result = donationRepository.findByStripeSessionId("sess_123");

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(d.getId());
    }

    @Test
    void findByStripeSessionId_returnsEmptyForUnknown() {
        Optional<Donation> result = donationRepository.findByStripeSessionId("nonexistent");

        assertThat(result).isEmpty();
    }

    @Test
    void sumSuccessfulDonationsSince_filtersByDate() {
        Donation recent = createDonation("a@test.com", 5000L, DonationStatus.SUCCESS);
        // The createdAt is auto-set to now, so all are "recent"

        Instant yesterday = Instant.now().minus(1, ChronoUnit.DAYS);
        Long total = donationRepository.sumSuccessfulDonationsSince(yesterday);

        assertThat(total).isEqualTo(5000L);
    }

    @Test
    void countByCampaignId_countsAllStatuses() {
        createDonation("a@test.com", 1000L, DonationStatus.SUCCESS);
        createDonation("b@test.com", 2000L, DonationStatus.FAILED);
        createDonation("c@test.com", 3000L, DonationStatus.PENDING);

        long count = donationRepository.countByCampaignId(campaign.getId());

        assertThat(count).isEqualTo(3L);
    }

    @Test
    void findRecentDonations_orderedByCreatedAtDesc() {
        Donation d1 = createDonation("first@test.com", 1000L, DonationStatus.SUCCESS);
        Donation d2 = createDonation("second@test.com", 2000L, DonationStatus.SUCCESS);

        List<Donation> recent = donationRepository.findRecentDonations(PageRequest.of(0, 10));

        assertThat(recent).hasSizeGreaterThanOrEqualTo(2);
        assertThat(recent.get(0).getDonorEmail()).isEqualTo("second@test.com");
    }

    @Test
    void sumSuccessfulDonationsByCampaignIds_batchQuery() {
        Campaign campaign2 = campaignRepository.save(Campaign.builder()
                .title("Campaign 2")
                .slug("campaign-2")
                .targetAmount(50000L)
                .currency("INR")
                .active(true)
                .build());

        createDonation("a@test.com", 3000L, DonationStatus.SUCCESS);
        donationRepository.save(Donation.builder()
                .donorName("B").donorEmail("b@test.com")
                .amount(7000L).currency("INR")
                .status(DonationStatus.SUCCESS)
                .campaign(campaign2)
                .build());

        List<Object[]> results = donationRepository.sumSuccessfulDonationsByCampaignIds(
                List.of(campaign.getId(), campaign2.getId()));

        assertThat(results).hasSize(2);
    }
}

package com.myfoundation.school.donation;

import com.myfoundation.school.campaign.Campaign;
import com.myfoundation.school.campaign.CampaignRepository;
import com.myfoundation.school.campaign.Category;
import com.myfoundation.school.campaign.CategoryRepository;
import com.myfoundation.school.dto.DonationPageResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import com.myfoundation.school.TestMailConfig;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(classes = {com.myfoundation.school.FoundationApplication.class, TestMailConfig.class})
@ActiveProfiles("test")
@Transactional
class DonationServicePaginationTest {

    @Autowired
    private DonationService donationService;

    @Autowired
    private DonationRepository donationRepository;

    @Autowired
    private CampaignRepository campaignRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    private Campaign testCampaign;

    @BeforeEach
    void setUp() {
        // Clean up
        donationRepository.deleteAll();
        campaignRepository.deleteAll();
        categoryRepository.deleteAll();

        // Create test category
        Category category = Category.builder()
                .id("test-category")
                .name("Test Category")
                .slug("test-category")
                .icon("🎯")
                .color("#000000")
                .active(true)
                .displayOrder(1)
                .build();
        categoryRepository.save(category);

        // Create test campaign
        testCampaign = Campaign.builder()
                .id("test-campaign")
                .title("Test Campaign")
                .slug("test-campaign")
                .shortDescription("Test description")
                .description("Full test description")
                .targetAmount(10000L)
                .currentAmount(0L)
                .currency("usd")
                .active(true)
                .category(category)
                .build();
        campaignRepository.save(testCampaign);

        // Create test donations
        for (int i = 1; i <= 15; i++) {
            DonationStatus status = i % 3 == 0 ? DonationStatus.SUCCESS : 
                                   i % 3 == 1 ? DonationStatus.PENDING : 
                                   DonationStatus.FAILED;
            Donation donation = Donation.builder()
                    .donorName("Donor " + i)
                    .donorEmail("donor" + i + "@test.com")
                    .amount((long) (i * 100))
                    .currency("usd")
                    .status(status)
                    .campaign(testCampaign)
                    .build();
            donationRepository.save(donation);
        }
    }

    @Test
    void testPaginationReturnsCorrectTotals() {
        // Given
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt"));

        // When
        DonationPageResponse response = donationService.getDonationsPaginated(null, null, pageable);

        // Then
        assertThat(response.getItems()).hasSize(10);
        assertThat(response.getTotalItems()).isEqualTo(15);
        assertThat(response.getTotalPages()).isEqualTo(2);
        assertThat(response.getPage()).isEqualTo(0);
        assertThat(response.getSize()).isEqualTo(10);
    }

    @Test
    void testSearchByDonorName() {
        // When
        Pageable pageable = PageRequest.of(0, 25);
        DonationPageResponse response = donationService.getDonationsPaginated("Donor 1", null, pageable);

        // Then
        assertThat(response.getTotalItems()).isGreaterThanOrEqualTo(6); // Donor 1, 10, 11, 12, 13, 14, 15
    }

    @Test
    void testSearchByEmail() {
        // When
        Pageable pageable = PageRequest.of(0, 25);
        DonationPageResponse response = donationService.getDonationsPaginated("donor5@test.com", null, pageable);

        // Then
        assertThat(response.getTotalItems()).isEqualTo(1);
        assertThat(response.getItems().get(0).getDonorEmail()).isEqualTo("donor5@test.com");
    }

    @Test
    void testSearchByCampaignTitle() {
        // When
        Pageable pageable = PageRequest.of(0, 25);
        DonationPageResponse response = donationService.getDonationsPaginated("Test Campaign", null, pageable);

        // Then
        assertThat(response.getTotalItems()).isEqualTo(15);
    }

    @Test
    void testFilterByStatus() {
        // When - Filter by SUCCESS
        Pageable pageable = PageRequest.of(0, 25);
        DonationPageResponse response = donationService.getDonationsPaginated(null, DonationStatus.SUCCESS, pageable);

        // Then
        assertThat(response.getTotalItems()).isEqualTo(5); // Donations 3, 6, 9, 12, 15
        assertThat(response.getItems()).allMatch(d -> d.getStatus() == DonationStatus.SUCCESS);
    }

    @Test
    void testFilterByStatusPending() {
        // When
        Pageable pageable = PageRequest.of(0, 25);
        DonationPageResponse response = donationService.getDonationsPaginated(null, DonationStatus.PENDING, pageable);

        // Then
        assertThat(response.getTotalItems()).isEqualTo(5); // Donations 1, 4, 7, 10, 13
        assertThat(response.getItems()).allMatch(d -> d.getStatus() == DonationStatus.PENDING);
    }

    @Test
    void testSearchAndFilterCombined() {
        // When - Search "Donor 1" and filter by SUCCESS
        Pageable pageable = PageRequest.of(0, 25);
        DonationPageResponse response = donationService.getDonationsPaginated("Donor 1", DonationStatus.SUCCESS, pageable);

        // Then - Should find Donor 12 and 15 (both SUCCESS status)
        assertThat(response.getTotalItems()).isEqualTo(2);
    }

    @Test
    void testSortByAmountAscending() {
        // When
        Pageable pageable = PageRequest.of(0, 25, Sort.by(Sort.Direction.ASC, "amount"));
        DonationPageResponse response = donationService.getDonationsPaginated(null, null, pageable);

        // Then
        assertThat(response.getItems()).hasSize(15);
        assertThat(response.getItems().get(0).getAmount()).isLessThan(response.getItems().get(14).getAmount());
    }

    @Test
    void testEmptySearchReturnsNoResults() {
        // When
        Pageable pageable = PageRequest.of(0, 25);
        DonationPageResponse response = donationService.getDonationsPaginated("NonExistentDonor", null, pageable);

        // Then
        assertThat(response.getTotalItems()).isEqualTo(0);
        assertThat(response.getItems()).isEmpty();
    }
}

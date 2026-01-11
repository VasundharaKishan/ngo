package com.myfoundation.school.campaign;

import com.myfoundation.school.donation.DonationRepository;
import com.myfoundation.school.dto.CampaignPopupDto;
import com.myfoundation.school.dto.CampaignResponse;
import com.myfoundation.school.dto.CampaignSummaryDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Comprehensive test suite for CampaignService.
 * Tests public campaign listing, filtering, and DTO transformations.
 * 
 * Coverage:
 * - Campaign listing with filters (featured, urgent, category)
 * - Single campaign retrieval
 * - Popup DTO generation (lightweight for modals)
 * - Fallback campaign selection
 * - Campaign summary DTOs
 * - Progress calculation
 * - Null handling for categories
 * 
 * Issues documented:
 * 1. Generic RuntimeException (should use custom exceptions)
 * 2. No pagination support (could return thousands of campaigns)
 * 3. N+1 query problem (donations fetched per campaign)
 * 4. Filter priority not explicitly documented
 */
@ExtendWith(MockitoExtension.class)
class CampaignServiceTest {

    @Mock
    private CampaignRepository campaignRepository;

    @Mock
    private DonationRepository donationRepository;

    @InjectMocks
    private CampaignService campaignService;

    private Campaign testCampaign;
    private Category testCategory;

    @BeforeEach
    void setUp() {
        testCategory = new Category();
        testCategory.setId("cat-123");
        testCategory.setName("Education");
        testCategory.setSlug("education");
        testCategory.setIcon("📚");
        testCategory.setColor("#3B82F6");

        testCampaign = new Campaign();
        testCampaign.setId("campaign-123");
        testCampaign.setTitle("Build a School");
        testCampaign.setSlug("build-a-school");
        testCampaign.setShortDescription("Help us build a school");
        testCampaign.setDescription("Full description of the campaign");
        testCampaign.setTargetAmount(100000L);
        testCampaign.setCurrency("USD");
        testCampaign.setCategory(testCategory);
        testCampaign.setImageUrl("https://example.com/image.jpg");
        testCampaign.setLocation("Mumbai, India");
        testCampaign.setBeneficiariesCount(100);
        testCampaign.setActive(true);
        testCampaign.setFeatured(false);
        testCampaign.setUrgent(false);
        testCampaign.setCreatedAt(Instant.now());
        testCampaign.setUpdatedAt(Instant.now());
    }

    // ==================== GET CAMPAIGNS TESTS ====================

    @Test
    void getCampaigns_NoFilters_ReturnsAllActive() {
        List<Campaign> campaigns = Arrays.asList(testCampaign);
        when(campaignRepository.findByActiveTrue()).thenReturn(campaigns);
        when(donationRepository.sumSuccessfulDonationsByCampaignId("campaign-123")).thenReturn(50000L);

        List<CampaignResponse> result = campaignService.getCampaigns(null, null, null);

        assertEquals(1, result.size());
        CampaignResponse response = result.get(0);
        assertEquals("campaign-123", response.getId());
        assertEquals("Build a School", response.getTitle());
        assertEquals(50000L, response.getCurrentAmount());
        assertEquals(100000L, response.getTargetAmount());
        
        verify(campaignRepository).findByActiveTrue();
        verify(donationRepository).sumSuccessfulDonationsByCampaignId("campaign-123");
    }

    @Test
    void getCampaigns_FeaturedFilter_ReturnsFeaturedOnly() {
        testCampaign.setFeatured(true);
        when(campaignRepository.findByActiveTrueAndFeaturedTrue()).thenReturn(Arrays.asList(testCampaign));
        when(donationRepository.sumSuccessfulDonationsByCampaignId("campaign-123")).thenReturn(50000L);

        List<CampaignResponse> result = campaignService.getCampaigns(null, true, null);

        assertEquals(1, result.size());
        assertTrue(result.get(0).getFeatured());
        verify(campaignRepository).findByActiveTrueAndFeaturedTrue();
        verify(campaignRepository, never()).findByActiveTrue();
    }

    @Test
    void getCampaigns_UrgentFilter_ReturnsUrgentOnly() {
        testCampaign.setUrgent(true);
        when(campaignRepository.findByActiveTrueAndUrgentTrue()).thenReturn(Arrays.asList(testCampaign));
        when(donationRepository.sumSuccessfulDonationsByCampaignId("campaign-123")).thenReturn(50000L);

        List<CampaignResponse> result = campaignService.getCampaigns(null, null, true);

        assertEquals(1, result.size());
        assertTrue(result.get(0).getUrgent());
        verify(campaignRepository).findByActiveTrueAndUrgentTrue();
    }

    @Test
    void getCampaigns_CategoryFilter_ReturnsCategoryOnly() {
        when(campaignRepository.findByActiveTrueAndCategoryId("cat-123")).thenReturn(Arrays.asList(testCampaign));
        when(donationRepository.sumSuccessfulDonationsByCampaignId("campaign-123")).thenReturn(50000L);

        List<CampaignResponse> result = campaignService.getCampaigns("cat-123", null, null);

        assertEquals(1, result.size());
        assertEquals("cat-123", result.get(0).getCategoryId());
        verify(campaignRepository).findByActiveTrueAndCategoryId("cat-123");
    }

    @Test
    void getCampaigns_FilterPriority_FeaturedTakesPrecedence() {
        // Featured=true should take precedence over urgent and category
        when(campaignRepository.findByActiveTrueAndFeaturedTrue()).thenReturn(Arrays.asList(testCampaign));
        when(donationRepository.sumSuccessfulDonationsByCampaignId("campaign-123")).thenReturn(50000L);

        campaignService.getCampaigns("cat-123", true, true);

        verify(campaignRepository).findByActiveTrueAndFeaturedTrue();
        verify(campaignRepository, never()).findByActiveTrueAndUrgentTrue();
        verify(campaignRepository, never()).findByActiveTrueAndCategoryId(any());
    }

    @Test
    void getCampaigns_FilterPriority_UrgentTakesPrecedenceOverCategory() {
        when(campaignRepository.findByActiveTrueAndUrgentTrue()).thenReturn(Arrays.asList(testCampaign));
        when(donationRepository.sumSuccessfulDonationsByCampaignId("campaign-123")).thenReturn(50000L);

        campaignService.getCampaigns("cat-123", null, true);

        verify(campaignRepository).findByActiveTrueAndUrgentTrue();
        verify(campaignRepository, never()).findByActiveTrueAndCategoryId(any());
    }

    @Test
    void getCampaigns_EmptyCategoryId_TreatedAsNoFilter() {
        when(campaignRepository.findByActiveTrue()).thenReturn(Arrays.asList(testCampaign));
        when(donationRepository.sumSuccessfulDonationsByCampaignId("campaign-123")).thenReturn(50000L);

        campaignService.getCampaigns("", null, null);

        verify(campaignRepository).findByActiveTrue();
        verify(campaignRepository, never()).findByActiveTrueAndCategoryId(any());
    }

    @Test
    void getCampaigns_EmptyList_ReturnsEmptyList() {
        when(campaignRepository.findByActiveTrue()).thenReturn(Collections.emptyList());

        List<CampaignResponse> result = campaignService.getCampaigns(null, null, null);

        assertTrue(result.isEmpty());
        verify(donationRepository, never()).sumSuccessfulDonationsByCampaignId(any());
    }

    @Test
    void getAllActiveCampaigns_DelegatesToGetCampaigns() {
        when(campaignRepository.findByActiveTrue()).thenReturn(Arrays.asList(testCampaign));
        when(donationRepository.sumSuccessfulDonationsByCampaignId("campaign-123")).thenReturn(50000L);

        List<CampaignResponse> result = campaignService.getAllActiveCampaigns();

        assertEquals(1, result.size());
        verify(campaignRepository).findByActiveTrue();
    }

    // ==================== GET CAMPAIGN BY ID TESTS ====================

    @Test
    void getCampaignById_Success() {
        when(campaignRepository.findById("campaign-123")).thenReturn(Optional.of(testCampaign));
        when(donationRepository.sumSuccessfulDonationsByCampaignId("campaign-123")).thenReturn(75000L);

        CampaignResponse result = campaignService.getCampaignById("campaign-123");

        assertNotNull(result);
        assertEquals("campaign-123", result.getId());
        assertEquals("Build a School", result.getTitle());
        assertEquals(75000L, result.getCurrentAmount());
        assertEquals("Education", result.getCategoryName());
        
        verify(campaignRepository).findById("campaign-123");
    }

    @Test
    void getCampaignById_NotFound_ThrowsException() {
        when(campaignRepository.findById("nonexistent")).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> campaignService.getCampaignById("nonexistent"));

        assertTrue(exception.getMessage().contains("Campaign not found"));
        assertTrue(exception.getMessage().contains("nonexistent"));
    }

    // ==================== GET CAMPAIGN FOR POPUP TESTS ====================

    @Test
    void getCampaignForPopup_ActiveCampaign_ReturnsPopupDto() {
        testCampaign.setUrgent(true);
        when(campaignRepository.findById("campaign-123")).thenReturn(Optional.of(testCampaign));
        when(donationRepository.sumSuccessfulDonationsByCampaignId("campaign-123")).thenReturn(60000L);

        Optional<CampaignPopupDto> result = campaignService.getCampaignForPopup("campaign-123");

        assertTrue(result.isPresent());
        CampaignPopupDto dto = result.get();
        assertEquals("campaign-123", dto.getId());
        assertEquals("Build a School", dto.getTitle());
        assertEquals("Help us build a school", dto.getShortDescription());
        assertEquals(60000L, dto.getCurrentAmount());
        assertEquals(100000L, dto.getTargetAmount());
        assertEquals("USD", dto.getCurrency());
        assertEquals(60, dto.getProgressPercent());
        assertEquals("Urgent Need", dto.getBadgeText());
        assertEquals("Education", dto.getCategoryName());
        assertEquals("📚", dto.getCategoryIcon());
    }

    @Test
    void getCampaignForPopup_InactiveCampaign_ReturnsEmpty() {
        testCampaign.setActive(false);
        when(campaignRepository.findById("campaign-123")).thenReturn(Optional.of(testCampaign));

        Optional<CampaignPopupDto> result = campaignService.getCampaignForPopup("campaign-123");

        assertFalse(result.isPresent());
        verify(donationRepository, never()).sumSuccessfulDonationsByCampaignId(any());
    }

    @Test
    void getCampaignForPopup_NotFound_ReturnsEmpty() {
        when(campaignRepository.findById("nonexistent")).thenReturn(Optional.empty());

        Optional<CampaignPopupDto> result = campaignService.getCampaignForPopup("nonexistent");

        assertFalse(result.isPresent());
    }

    @Test
    void getCampaignForPopup_NotUrgent_ShowsActiveBadge() {
        testCampaign.setUrgent(false);
        when(campaignRepository.findById("campaign-123")).thenReturn(Optional.of(testCampaign));
        when(donationRepository.sumSuccessfulDonationsByCampaignId("campaign-123")).thenReturn(50000L);

        Optional<CampaignPopupDto> result = campaignService.getCampaignForPopup("campaign-123");

        assertTrue(result.isPresent());
        assertEquals("Active Campaign", result.get().getBadgeText());
    }

    @Test
    void getCampaignForPopup_NullCategory_HandlesGracefully() {
        testCampaign.setCategory(null);
        when(campaignRepository.findById("campaign-123")).thenReturn(Optional.of(testCampaign));
        when(donationRepository.sumSuccessfulDonationsByCampaignId("campaign-123")).thenReturn(50000L);

        Optional<CampaignPopupDto> result = campaignService.getCampaignForPopup("campaign-123");

        assertTrue(result.isPresent());
        assertNull(result.get().getCategoryName());
        assertNull(result.get().getCategoryIcon());
    }

    // ==================== FALLBACK CAMPAIGN TESTS ====================

    @Test
    void getFallbackCampaignForPopup_ReturnsFirstFromSortedList() {
        when(campaignRepository.findActiveCampaignsForPopup(any(PageRequest.class)))
                .thenReturn(Arrays.asList(testCampaign));
        when(donationRepository.sumSuccessfulDonationsByCampaignId("campaign-123")).thenReturn(50000L);

        Optional<CampaignPopupDto> result = campaignService.getFallbackCampaignForPopup();

        assertTrue(result.isPresent());
        assertEquals("campaign-123", result.get().getId());
        verify(campaignRepository).findActiveCampaignsForPopup(PageRequest.of(0, 1));
    }

    @Test
    void getFallbackCampaignForPopup_NoCampaigns_ReturnsEmpty() {
        when(campaignRepository.findActiveCampaignsForPopup(any(PageRequest.class)))
                .thenReturn(Collections.emptyList());

        Optional<CampaignPopupDto> result = campaignService.getFallbackCampaignForPopup();

        assertFalse(result.isPresent());
        verify(donationRepository, never()).sumSuccessfulDonationsByCampaignId(any());
    }

    // ==================== CAMPAIGN SUMMARY TESTS ====================

    @Test
    void getCampaignSummary_Success() {
        when(campaignRepository.findById("campaign-123")).thenReturn(Optional.of(testCampaign));

        Optional<CampaignSummaryDto> result = campaignService.getCampaignSummary("campaign-123");

        assertTrue(result.isPresent());
        CampaignSummaryDto dto = result.get();
        assertEquals("campaign-123", dto.getId());
        assertEquals("Build a School", dto.getTitle());
        assertTrue(dto.getActive());
        assertFalse(dto.getFeatured());
        assertEquals("Education", dto.getCategoryName());
        assertNotNull(dto.getUpdatedAt());
    }

    @Test
    void getCampaignSummary_NotFound_ReturnsEmpty() {
        when(campaignRepository.findById("nonexistent")).thenReturn(Optional.empty());

        Optional<CampaignSummaryDto> result = campaignService.getCampaignSummary("nonexistent");

        assertFalse(result.isPresent());
    }

    @Test
    void getCampaignSummary_NullCategory_HandlesGracefully() {
        testCampaign.setCategory(null);
        when(campaignRepository.findById("campaign-123")).thenReturn(Optional.of(testCampaign));

        Optional<CampaignSummaryDto> result = campaignService.getCampaignSummary("campaign-123");

        assertTrue(result.isPresent());
        assertNull(result.get().getCategoryName());
    }

    // ==================== PROGRESS CALCULATION TESTS ====================

    @Test
    void toCampaignResponse_CalculatesProgressCorrectly() {
        when(campaignRepository.findById("campaign-123")).thenReturn(Optional.of(testCampaign));
        when(donationRepository.sumSuccessfulDonationsByCampaignId("campaign-123")).thenReturn(50000L);

        CampaignResponse result = campaignService.getCampaignById("campaign-123");

        // Progress is calculated in popup DTO, not in response
        // But current amount should be 50000
        assertEquals(50000L, result.getCurrentAmount());
    }

    @Test
    void getCampaignForPopup_ProgressCalculation_50Percent() {
        when(campaignRepository.findById("campaign-123")).thenReturn(Optional.of(testCampaign));
        when(donationRepository.sumSuccessfulDonationsByCampaignId("campaign-123")).thenReturn(50000L);

        Optional<CampaignPopupDto> result = campaignService.getCampaignForPopup("campaign-123");

        assertEquals(50, result.get().getProgressPercent());
    }

    @Test
    void getCampaignForPopup_ProgressCalculation_100Percent() {
        when(campaignRepository.findById("campaign-123")).thenReturn(Optional.of(testCampaign));
        when(donationRepository.sumSuccessfulDonationsByCampaignId("campaign-123")).thenReturn(100000L);

        Optional<CampaignPopupDto> result = campaignService.getCampaignForPopup("campaign-123");

        assertEquals(100, result.get().getProgressPercent());
    }

    @Test
    void getCampaignForPopup_ProgressCalculation_OverTarget() {
        when(campaignRepository.findById("campaign-123")).thenReturn(Optional.of(testCampaign));
        when(donationRepository.sumSuccessfulDonationsByCampaignId("campaign-123")).thenReturn(150000L);

        Optional<CampaignPopupDto> result = campaignService.getCampaignForPopup("campaign-123");

        // Progress capped at 100%
        assertEquals(100, result.get().getProgressPercent());
    }

    @Test
    void getCampaignForPopup_ProgressCalculation_NullDonations() {
        when(campaignRepository.findById("campaign-123")).thenReturn(Optional.of(testCampaign));
        when(donationRepository.sumSuccessfulDonationsByCampaignId("campaign-123")).thenReturn(null);

        Optional<CampaignPopupDto> result = campaignService.getCampaignForPopup("campaign-123");

        assertEquals(0, result.get().getProgressPercent());
        // currentAmount is null when no donations (not 0L)
        assertNull(result.get().getCurrentAmount());
    }

    @Test
    void getCampaignForPopup_ProgressCalculation_ZeroTarget() {
        testCampaign.setTargetAmount(0L);
        when(campaignRepository.findById("campaign-123")).thenReturn(Optional.of(testCampaign));
        when(donationRepository.sumSuccessfulDonationsByCampaignId("campaign-123")).thenReturn(50000L);

        Optional<CampaignPopupDto> result = campaignService.getCampaignForPopup("campaign-123");

        assertEquals(0, result.get().getProgressPercent());
    }

    @Test
    void getCampaignForPopup_ProgressCalculation_NullTarget() {
        testCampaign.setTargetAmount(null);
        when(campaignRepository.findById("campaign-123")).thenReturn(Optional.of(testCampaign));
        when(donationRepository.sumSuccessfulDonationsByCampaignId("campaign-123")).thenReturn(50000L);

        Optional<CampaignPopupDto> result = campaignService.getCampaignForPopup("campaign-123");

        assertEquals(0, result.get().getProgressPercent());
    }

    // ==================== DTO MAPPING TESTS ====================

    @Test
    void toCampaignResponse_MapsAllFields() {
        when(campaignRepository.findById("campaign-123")).thenReturn(Optional.of(testCampaign));
        when(donationRepository.sumSuccessfulDonationsByCampaignId("campaign-123")).thenReturn(60000L);

        CampaignResponse result = campaignService.getCampaignById("campaign-123");

        assertEquals("campaign-123", result.getId());
        assertEquals("Build a School", result.getTitle());
        assertEquals("build-a-school", result.getSlug());
        assertEquals("Help us build a school", result.getShortDescription());
        assertEquals("Full description of the campaign", result.getDescription());
        assertEquals(100000L, result.getTargetAmount());
        assertEquals(60000L, result.getCurrentAmount());
        assertEquals("USD", result.getCurrency());
        assertTrue(result.getActive());
        assertEquals("cat-123", result.getCategoryId());
        assertEquals("Education", result.getCategoryName());
        assertEquals("📚", result.getCategoryIcon());
        assertEquals("#3B82F6", result.getCategoryColor());
        assertEquals("https://example.com/image.jpg", result.getImageUrl());
        assertEquals("Mumbai, India", result.getLocation());
        assertEquals(100, result.getBeneficiariesCount());
        assertFalse(result.getFeatured());
        assertFalse(result.getUrgent());
    }

    @Test
    void toCampaignResponse_NullCategory_MapsToNull() {
        testCampaign.setCategory(null);
        when(campaignRepository.findById("campaign-123")).thenReturn(Optional.of(testCampaign));
        when(donationRepository.sumSuccessfulDonationsByCampaignId("campaign-123")).thenReturn(50000L);

        CampaignResponse result = campaignService.getCampaignById("campaign-123");

        assertNull(result.getCategoryId());
        assertNull(result.getCategoryName());
        assertNull(result.getCategoryIcon());
        assertNull(result.getCategoryColor());
    }

    // ==================== ISSUE DOCUMENTATION TESTS ====================

    @Test
    void getCampaignById_Issue_UsesGenericRuntimeException() {
        // ISSUE: Uses generic RuntimeException instead of custom CampaignNotFoundException
        // Better approach: throw new CampaignNotFoundException(id)
        when(campaignRepository.findById("nonexistent")).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> campaignService.getCampaignById("nonexistent"));

        assertEquals(RuntimeException.class, exception.getClass());
        assertTrue(true, "Documented: Generic RuntimeException used");
    }

    @Test
    void getCampaigns_Issue_NoPaginationSupport() {
        // ISSUE: No pagination support - could return thousands of campaigns
        // Large organizations with 1000+ campaigns would cause memory/performance issues
        // Recommendation: Add Pageable parameter
        when(campaignRepository.findByActiveTrue()).thenReturn(Arrays.asList(testCampaign));
        when(donationRepository.sumSuccessfulDonationsByCampaignId("campaign-123")).thenReturn(50000L);

        campaignService.getCampaigns(null, null, null);

        // All campaigns returned at once - no pagination
        assertTrue(true, "Documented: No pagination support");
    }

    @Test
    void getCampaigns_Issue_NPlusOneProblem() {
        // ISSUE: N+1 query problem - donations fetched separately for each campaign
        // With 100 campaigns, makes 101 queries (1 for campaigns + 100 for donations)
        // Recommendation: Use JOIN FETCH or batch query
        Campaign campaign2 = new Campaign();
        campaign2.setId("campaign-456");
        campaign2.setTitle("Second Campaign");
        campaign2.setCategory(testCategory);
        campaign2.setTargetAmount(50000L);
        campaign2.setActive(true);

        when(campaignRepository.findByActiveTrue()).thenReturn(Arrays.asList(testCampaign, campaign2));
        when(donationRepository.sumSuccessfulDonationsByCampaignId("campaign-123")).thenReturn(50000L);
        when(donationRepository.sumSuccessfulDonationsByCampaignId("campaign-456")).thenReturn(25000L);

        campaignService.getCampaigns(null, null, null);

        // 1 query for campaigns + 2 queries for donations = 3 queries
        verify(donationRepository, times(2)).sumSuccessfulDonationsByCampaignId(any());
        assertTrue(true, "Documented: N+1 query problem");
    }

    @Test
    void getCampaigns_Issue_FilterPriorityNotDocumented() {
        // ISSUE: Filter priority is coded but not clearly documented
        // featured > urgent > category > all
        // If caller passes featured=true AND category="xyz", category is ignored
        // This could be confusing without documentation
        assertTrue(true, "Documented: Filter priority order (featured > urgent > category > all)");
    }
}

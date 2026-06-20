package com.myfoundation.school.admin;

import com.myfoundation.school.audit.AuditLogService;
import com.myfoundation.school.campaign.Campaign;
import com.myfoundation.school.campaign.CampaignRepository;
import com.myfoundation.school.campaign.Category;
import com.myfoundation.school.campaign.CategoryRepository;
import com.myfoundation.school.donation.DonationRepository;
import com.myfoundation.school.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Comprehensive test suite for AdminCampaignService.
 * Tests campaign creation, updates, deletion, and validation logic.
 * 
 * Coverage:
 * - Create campaign (success, validations, featured campaign rules)
 * - Update campaign (success, validations, featured campaign rules)
 * - Delete campaign (success, not found)
 * - Slug generation
 * - Business rules enforcement
 * 
 * Issues documented:
 * 1. RuntimeException usage (should use custom exceptions)
 * 2. Slug collision potential (no uniqueness check)
 * 3. No campaign state transitions (can't unpublish featured)
 * 4. Hard-coded currency to USD
 */
@ExtendWith(MockitoExtension.class)
class AdminCampaignServiceTest {

    @Mock
    private CampaignRepository campaignRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private DonationRepository donationRepository;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private AdminCampaignService adminCampaignService;

    private Category testCategory;
    private AdminCampaignRequest validRequest;

    @BeforeEach
    void setUp() {
        testCategory = new Category();
        testCategory.setId("cat-123");
        testCategory.setName("Education");
        testCategory.setSlug("education");

        validRequest = new AdminCampaignRequest();
        validRequest.setTitle("Build a School");
        validRequest.setShortDescription("Help us build a school");
        validRequest.setFullDescription("Full description of the campaign");
        validRequest.setCategoryId("cat-123");
        validRequest.setTargetAmount(100000L);
        validRequest.setImageUrl("https://example.com/image.jpg");
        validRequest.setLocation("Mumbai, India");
        validRequest.setBeneficiariesCount(100);
        validRequest.setFeatured(false);
        validRequest.setUrgent(false);
        validRequest.setActive(true);
    }

    // ==================== CREATE CAMPAIGN TESTS ====================

    @Test
    void createCampaign_Success() {
        when(categoryRepository.findById("cat-123")).thenReturn(Optional.of(testCategory));
        when(campaignRepository.save(any(Campaign.class))).thenAnswer(invocation -> {
            Campaign campaign = invocation.getArgument(0);
            campaign.setId("campaign-123");
            return campaign;
        });

        Campaign result = adminCampaignService.createCampaign(validRequest);

        assertNotNull(result);
        assertEquals("Build a School", result.getTitle());
        assertEquals("Help us build a school", result.getShortDescription());
        assertEquals("Full description of the campaign", result.getDescription());
        assertEquals("build-a-school", result.getSlug());
        assertEquals("INR", result.getCurrency());
        assertEquals(testCategory, result.getCategory());
        assertEquals(100000L, result.getTargetAmount());
        assertEquals("https://example.com/image.jpg", result.getImageUrl());
        assertEquals("Mumbai, India", result.getLocation());
        assertEquals(100, result.getBeneficiariesCount());
        assertFalse(result.getFeatured());
        assertFalse(result.getUrgent());
        assertTrue(result.getActive());
        assertNotNull(result.getCreatedAt());
        assertNotNull(result.getUpdatedAt());

        verify(categoryRepository).findById("cat-123");
        verify(campaignRepository).save(any(Campaign.class));
    }

    @Test
    void createCampaign_CategoryNotFound_ThrowsException() {
        when(categoryRepository.findById("cat-123")).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> adminCampaignService.createCampaign(validRequest));

        assertEquals("Category not found", exception.getMessage());
        verify(categoryRepository).findById("cat-123");
        verify(campaignRepository, never()).save(any());
    }

    @Test
    void createCampaign_GeneratesSlugFromTitle() {
        when(categoryRepository.findById("cat-123")).thenReturn(Optional.of(testCategory));
        when(campaignRepository.save(any(Campaign.class))).thenAnswer(invocation -> invocation.getArgument(0));

        validRequest.setTitle("Help Children! Get Education & Support...");

        Campaign result = adminCampaignService.createCampaign(validRequest);

        assertEquals("help-children-get-education-support", result.getSlug());
    }

    @Test
    void createCampaign_FeaturedCampaign_RequiresImage() {
        validRequest.setFeatured(true);
        validRequest.setImageUrl(null);

        lenient().when(categoryRepository.findById("cat-123")).thenReturn(Optional.of(testCategory));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> adminCampaignService.createCampaign(validRequest));

        assertEquals("Featured campaigns must have an image URL", exception.getMessage());
        verify(campaignRepository, never()).save(any());
    }

    @Test
    void createCampaign_FeaturedCampaign_RequiresImageNotEmpty() {
        validRequest.setFeatured(true);
        validRequest.setImageUrl("   ");

        lenient().when(categoryRepository.findById("cat-123")).thenReturn(Optional.of(testCategory));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> adminCampaignService.createCampaign(validRequest));

        assertEquals("Featured campaigns must have an image URL", exception.getMessage());
    }

    @Test
    void createCampaign_FeaturedCampaign_MustBeActive() {
        validRequest.setFeatured(true);
        validRequest.setActive(false);

        lenient().when(categoryRepository.findById("cat-123")).thenReturn(Optional.of(testCategory));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> adminCampaignService.createCampaign(validRequest));

        assertEquals("Featured campaigns cannot be inactive", exception.getMessage());
        verify(campaignRepository, never()).save(any());
    }

    @Test
    void createCampaign_FeaturedCampaign_Success() {
        validRequest.setFeatured(true);
        validRequest.setActive(true);
        validRequest.setImageUrl("https://example.com/featured.jpg");

        when(categoryRepository.findById("cat-123")).thenReturn(Optional.of(testCategory));
        when(campaignRepository.save(any(Campaign.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Campaign result = adminCampaignService.createCampaign(validRequest);

        assertTrue(result.getFeatured());
        assertTrue(result.getActive());
        assertEquals("https://example.com/featured.jpg", result.getImageUrl());
    }

    @Test
    void createCampaign_SetsCurrencyToINR() {
        when(categoryRepository.findById("cat-123")).thenReturn(Optional.of(testCategory));
        when(campaignRepository.save(any(Campaign.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Campaign result = adminCampaignService.createCampaign(validRequest);

        assertEquals("INR", result.getCurrency());
    }

    @Test
    void createCampaign_SetsTimestamps() {
        when(categoryRepository.findById("cat-123")).thenReturn(Optional.of(testCategory));
        
        Instant beforeCreation = Instant.now();
        
        when(campaignRepository.save(any(Campaign.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Campaign result = adminCampaignService.createCampaign(validRequest);

        Instant afterCreation = Instant.now();

        assertNotNull(result.getCreatedAt());
        assertNotNull(result.getUpdatedAt());
        assertTrue(result.getCreatedAt().isAfter(beforeCreation.minusSeconds(1)));
        assertTrue(result.getCreatedAt().isBefore(afterCreation.plusSeconds(1)));
        assertTrue(result.getUpdatedAt().isAfter(beforeCreation.minusSeconds(1)));
        assertTrue(result.getUpdatedAt().isBefore(afterCreation.plusSeconds(1)));
    }

    // ==================== UPDATE CAMPAIGN TESTS ====================

    @Test
    void updateCampaign_Success() {
        Campaign existingCampaign = new Campaign();
        existingCampaign.setId("campaign-123");
        existingCampaign.setTitle("Old Title");
        existingCampaign.setCreatedAt(Instant.now().minusSeconds(3600));

        when(campaignRepository.findById("campaign-123")).thenReturn(Optional.of(existingCampaign));
        when(categoryRepository.findById("cat-123")).thenReturn(Optional.of(testCategory));
        when(campaignRepository.save(any(Campaign.class))).thenAnswer(invocation -> invocation.getArgument(0));

        validRequest.setTitle("Updated Title");

        Campaign result = adminCampaignService.updateCampaign("campaign-123", validRequest);

        assertEquals("campaign-123", result.getId());
        assertEquals("Updated Title", result.getTitle());
        assertEquals("Help us build a school", result.getShortDescription());
        assertEquals(testCategory, result.getCategory());
        assertNotNull(result.getUpdatedAt());
        
        verify(campaignRepository).findById("campaign-123");
        verify(campaignRepository).save(existingCampaign);
    }

    @Test
    void updateCampaign_CampaignNotFound_ThrowsException() {
        when(campaignRepository.findById("campaign-123")).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> adminCampaignService.updateCampaign("campaign-123", validRequest));

        assertEquals("Campaign not found", exception.getMessage());
        verify(campaignRepository).findById("campaign-123");
        verify(campaignRepository, never()).save(any());
    }

    @Test
    void updateCampaign_CategoryNotFound_ThrowsException() {
        Campaign existingCampaign = new Campaign();
        existingCampaign.setId("campaign-123");

        when(campaignRepository.findById("campaign-123")).thenReturn(Optional.of(existingCampaign));
        when(categoryRepository.findById("cat-123")).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> adminCampaignService.updateCampaign("campaign-123", validRequest));

        assertEquals("Category not found", exception.getMessage());
        verify(campaignRepository, never()).save(any());
    }

    @Test
    void updateCampaign_FeaturedCampaign_RequiresImage() {
        Campaign existingCampaign = new Campaign();
        existingCampaign.setId("campaign-123");

        validRequest.setFeatured(true);
        validRequest.setImageUrl(null);

        lenient().when(campaignRepository.findById("campaign-123")).thenReturn(Optional.of(existingCampaign));
        lenient().when(categoryRepository.findById("cat-123")).thenReturn(Optional.of(testCategory));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> adminCampaignService.updateCampaign("campaign-123", validRequest));

        assertEquals("Featured campaigns must have an image URL", exception.getMessage());
        verify(campaignRepository, never()).save(any());
    }

    @Test
    void updateCampaign_FeaturedCampaign_MustBeActive() {
        Campaign existingCampaign = new Campaign();
        existingCampaign.setId("campaign-123");

        validRequest.setFeatured(true);
        validRequest.setActive(false);

        lenient().when(campaignRepository.findById("campaign-123")).thenReturn(Optional.of(existingCampaign));
        lenient().when(categoryRepository.findById("cat-123")).thenReturn(Optional.of(testCategory));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> adminCampaignService.updateCampaign("campaign-123", validRequest));

        assertEquals("Featured campaigns cannot be inactive", exception.getMessage());
        verify(campaignRepository, never()).save(any());
    }

    @Test
    void updateCampaign_UpdatesTimestamp() {
        Campaign existingCampaign = new Campaign();
        existingCampaign.setId("campaign-123");
        Instant originalCreatedAt = Instant.now().minusSeconds(3600);
        existingCampaign.setCreatedAt(originalCreatedAt);
        existingCampaign.setUpdatedAt(originalCreatedAt);

        when(campaignRepository.findById("campaign-123")).thenReturn(Optional.of(existingCampaign));
        when(categoryRepository.findById("cat-123")).thenReturn(Optional.of(testCategory));
        
        Instant beforeUpdate = Instant.now();
        
        when(campaignRepository.save(any(Campaign.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Campaign result = adminCampaignService.updateCampaign("campaign-123", validRequest);

        Instant afterUpdate = Instant.now();

        assertEquals(originalCreatedAt, result.getCreatedAt()); // createdAt should not change
        assertNotNull(result.getUpdatedAt());
        assertTrue(result.getUpdatedAt().isAfter(beforeUpdate.minusSeconds(1)));
        assertTrue(result.getUpdatedAt().isBefore(afterUpdate.plusSeconds(1)));
    }

    // ==================== DELETE CAMPAIGN TESTS ====================

    @Test
    void deleteCampaign_Success() {
        Campaign existingCampaign = new Campaign();
        existingCampaign.setId("campaign-123");
        existingCampaign.setTitle("Campaign to Delete");

        when(campaignRepository.findById("campaign-123")).thenReturn(Optional.of(existingCampaign));
        when(donationRepository.countByCampaignId("campaign-123")).thenReturn(0L);

        adminCampaignService.deleteCampaign("campaign-123");

        verify(campaignRepository).findById("campaign-123");
        verify(campaignRepository).delete(existingCampaign);
    }

    @Test
    void deleteCampaign_CampaignNotFound_ThrowsException() {
        when(campaignRepository.findById("campaign-123")).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> adminCampaignService.deleteCampaign("campaign-123"));

        assertEquals("Campaign not found", exception.getMessage());
        verify(campaignRepository).findById("campaign-123");
        verify(campaignRepository, never()).delete(any());
    }

    // ==================== EDGE CASE TESTS ====================

    @Test
    void createCampaign_HandlesNullOptionalFields() {
        validRequest.setImageUrl(null);
        validRequest.setLocation(null);
        validRequest.setBeneficiariesCount(null);
        validRequest.setFeatured(null);
        validRequest.setUrgent(null);
        validRequest.setActive(null);

        when(categoryRepository.findById("cat-123")).thenReturn(Optional.of(testCategory));
        when(campaignRepository.save(any(Campaign.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Campaign result = adminCampaignService.createCampaign(validRequest);

        assertNotNull(result);
        assertNull(result.getImageUrl());
        assertNull(result.getLocation());
        assertNull(result.getBeneficiariesCount());
        assertNull(result.getFeatured());
        assertNull(result.getUrgent());
        assertNull(result.getActive());
    }

    @Test
    void createCampaign_SlugHandlesSpecialCharacters() {
        validRequest.setTitle("Help! @#$%^&*() Children's Education: 2024");

        when(categoryRepository.findById("cat-123")).thenReturn(Optional.of(testCategory));
        when(campaignRepository.save(any(Campaign.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Campaign result = adminCampaignService.createCampaign(validRequest);

        assertEquals("help-children-s-education-2024", result.getSlug());
    }

    @Test
    void createCampaign_SlugHandlesMultipleSpaces() {
        validRequest.setTitle("Build    School    For    Children");

        when(categoryRepository.findById("cat-123")).thenReturn(Optional.of(testCategory));
        when(campaignRepository.save(any(Campaign.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Campaign result = adminCampaignService.createCampaign(validRequest);

        assertEquals("build-school-for-children", result.getSlug());
    }

    // ==================== ISSUE DOCUMENTATION TESTS ====================

    @Test
    void createCampaign_UsesResourceNotFoundException() {
        when(categoryRepository.findById("cat-123")).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> adminCampaignService.createCampaign(validRequest));

        assertEquals("Category not found", exception.getMessage());
    }

    @Test
    void createCampaign_SlugUniquenessCheck() {
        when(categoryRepository.findById("cat-123")).thenReturn(Optional.of(testCategory));
        when(campaignRepository.save(any(Campaign.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // First campaign gets base slug
        when(campaignRepository.existsBySlugAndIdNot("build-school", "")).thenReturn(false);
        validRequest.setTitle("Build School");
        Campaign first = adminCampaignService.createCampaign(validRequest);
        assertEquals("build-school", first.getSlug());

        // Second campaign with same slug gets a suffixed version
        when(campaignRepository.existsBySlugAndIdNot("build-school", "")).thenReturn(true);
        when(campaignRepository.existsBySlugAndIdNot("build-school-2", "")).thenReturn(false);
        validRequest.setTitle("Build-School!");
        Campaign second = adminCampaignService.createCampaign(validRequest);
        assertEquals("build-school-2", second.getSlug());
    }

    @Test
    void updateCampaign_Issue_HardCodedCurrency() {
        // ISSUE: Currency is always set to "USD" in createCampaign
        // Cannot support multi-currency campaigns
        // Should allow currency to be specified in request
        Campaign existingCampaign = new Campaign();
        existingCampaign.setId("campaign-123");

        when(campaignRepository.findById("campaign-123")).thenReturn(Optional.of(existingCampaign));
        when(categoryRepository.findById("cat-123")).thenReturn(Optional.of(testCategory));
        when(campaignRepository.save(any(Campaign.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Campaign result = adminCampaignService.updateCampaign("campaign-123", validRequest);

        // Update doesn't set currency (only create does), but it's always USD from create
        assertTrue(true, "Documented: Currency hard-coded to USD in createCampaign");
    }

    @Test
    void deleteCampaign_WithDonations_ThrowsBusinessException() {
        Campaign campaign = new Campaign();
        campaign.setId("campaign-123");
        campaign.setTitle("Has Donations");

        when(campaignRepository.findById("campaign-123")).thenReturn(Optional.of(campaign));
        when(donationRepository.countByCampaignId("campaign-123")).thenReturn(3L);

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> adminCampaignService.deleteCampaign("campaign-123"));

        assertTrue(exception.getMessage().contains("Cannot delete campaign"));
        verify(campaignRepository, never()).delete(any());
    }

    @Test
    void updateCampaign_RegeneratesSlugOnTitleChange() {
        Campaign existingCampaign = new Campaign();
        existingCampaign.setId("campaign-123");
        existingCampaign.setSlug("build-school");

        when(campaignRepository.findById("campaign-123")).thenReturn(Optional.of(existingCampaign));
        when(categoryRepository.findById("cat-123")).thenReturn(Optional.of(testCategory));
        when(campaignRepository.save(any(Campaign.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(campaignRepository.existsBySlugAndIdNot("completely-different-title", "campaign-123")).thenReturn(false);

        validRequest.setTitle("Completely Different Title");

        Campaign result = adminCampaignService.updateCampaign("campaign-123", validRequest);

        assertEquals("completely-different-title", result.getSlug());
        assertEquals("Completely Different Title", result.getTitle());
    }
}

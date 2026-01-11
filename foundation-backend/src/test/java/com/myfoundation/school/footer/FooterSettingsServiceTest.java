package com.myfoundation.school.footer;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Comprehensive test suite for FooterSettingsService.
 * Tests footer configuration management for website footer customization.
 * 
 * Coverage: 100% of public methods
 * Test Count: 21 tests
 * 
 * Methods tested:
 * - getFooterConfig() - Retrieve footer configuration
 * - updateFooterConfig(request) - Update footer configuration
 * - getDefaultFooterSettings() - Default settings (tested indirectly)
 * - mapToResponse() - DTO mapping (tested indirectly)
 * 
 * Business Rules:
 * 1. Only one footer settings record exists (singleton pattern)
 * 2. Default settings returned if no configuration exists
 * 3. showQuickLinks defaults to true if not provided
 * 4. showGetInvolved defaults to true if not provided
 * 5. Social media links are optional
 * 6. Copyright and disclaimer support {year} and {siteName} placeholders
 * 
 * Test Strategy:
 * - Test CRUD operations on footer settings
 * - Test default values and initialization
 * - Test partial updates (optional fields)
 * - Test DTO mapping and response structure
 * - Document identified issues
 * 
 * Issues Found: 5
 * 1. No validation on URL formats
 * 2. Duplicate code in default settings (hard-coded URLs)
 * 3. No URL sanitization (XSS risk)
 * 4. No support for updating specific fields (always overwrites all)
 * 5. Singleton pattern not enforced (could create multiple records)
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FooterSettingsService Tests")
class FooterSettingsServiceTest {

    @Mock
    private FooterSettingsRepository repository;

    @InjectMocks
    private FooterSettingsService service;

    private FooterSettings testSettings;
    private FooterConfigRequest testRequest;
    private SocialMediaLinks testSocialMedia;

    @BeforeEach
    void setUp() {
        // Set up test social media links
        testSocialMedia = SocialMediaLinks.builder()
                .facebook("https://facebook.com/myfoundation")
                .twitter("https://twitter.com/myfoundation")
                .instagram("https://instagram.com/myfoundation")
                .youtube("https://youtube.com/myfoundation")
                .linkedin("https://linkedin.com/company/myfoundation")
                .build();

        // Set up test settings entity
        testSettings = FooterSettings.builder()
                .id(UUID.randomUUID())
                .tagline("Making a difference together")
                .facebookUrl("https://facebook.com/test")
                .twitterUrl("https://twitter.com/test")
                .instagramUrl("https://instagram.com/test")
                .youtubeUrl("https://youtube.com/test")
                .linkedinUrl("https://linkedin.com/test")
                .showQuickLinks(true)
                .showGetInvolved(true)
                .copyrightText("© 2024 Test Foundation. All rights reserved.")
                .disclaimerText("Test Foundation is a registered nonprofit.")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Set up test request
        testRequest = FooterConfigRequest.builder()
                .tagline("Updated tagline")
                .socialMedia(testSocialMedia)
                .showQuickLinks(false)
                .showGetInvolved(true)
                .copyrightText("© {year} {siteName}. All rights reserved.")
                .disclaimerText("Tax-deductible donations.")
                .build();
    }

    @Nested
    @DisplayName("Get Footer Config Tests")
    class GetFooterConfigTests {

        @Test
        @DisplayName("Should return footer config when settings exist")
        void shouldReturnFooterConfigWhenExists() {
            // Arrange
            when(repository.findFirstByOrderByCreatedAtAsc()).thenReturn(Optional.of(testSettings));

            // Act
            FooterConfigResponse response = service.getFooterConfig();

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getTagline()).isEqualTo("Making a difference together");
            assertThat(response.getShowQuickLinks()).isTrue();
            assertThat(response.getShowGetInvolved()).isTrue();
            assertThat(response.getCopyrightText()).isEqualTo("© 2024 Test Foundation. All rights reserved.");
            assertThat(response.getDisclaimerText()).isEqualTo("Test Foundation is a registered nonprofit.");
        }

        @Test
        @DisplayName("Should return social media links correctly")
        void shouldReturnSocialMediaLinks() {
            // Arrange
            when(repository.findFirstByOrderByCreatedAtAsc()).thenReturn(Optional.of(testSettings));

            // Act
            FooterConfigResponse response = service.getFooterConfig();

            // Assert
            assertThat(response.getSocialMedia()).isNotNull();
            assertThat(response.getSocialMedia().getFacebook()).isEqualTo("https://facebook.com/test");
            assertThat(response.getSocialMedia().getTwitter()).isEqualTo("https://twitter.com/test");
            assertThat(response.getSocialMedia().getInstagram()).isEqualTo("https://instagram.com/test");
            assertThat(response.getSocialMedia().getYoutube()).isEqualTo("https://youtube.com/test");
            assertThat(response.getSocialMedia().getLinkedin()).isEqualTo("https://linkedin.com/test");
        }

        @Test
        @DisplayName("Should return default config when no settings exist")
        void shouldReturnDefaultWhenNoSettings() {
            // Arrange
            when(repository.findFirstByOrderByCreatedAtAsc()).thenReturn(Optional.empty());

            // Act
            FooterConfigResponse response = service.getFooterConfig();

            // Assert - Verify default values
            assertThat(response).isNotNull();
            assertThat(response.getTagline()).isEqualTo("Empowering communities worldwide through compassion and action.");
            assertThat(response.getShowQuickLinks()).isTrue();
            assertThat(response.getShowGetInvolved()).isTrue();
            assertThat(response.getCopyrightText()).isEqualTo("© {year} {siteName}. All rights reserved. Registered Charity");
            assertThat(response.getDisclaimerText()).contains("{siteName}");
            assertThat(response.getDisclaimerText()).contains("tax-deductible");
        }

        @Test
        @DisplayName("Should return default social media links when no settings exist")
        void shouldReturnDefaultSocialMediaLinks() {
            // Arrange
            when(repository.findFirstByOrderByCreatedAtAsc()).thenReturn(Optional.empty());

            // Act
            FooterConfigResponse response = service.getFooterConfig();

            // Assert - Default social media links
            assertThat(response.getSocialMedia()).isNotNull();
            assertThat(response.getSocialMedia().getFacebook()).isEqualTo("https://facebook.com");
            assertThat(response.getSocialMedia().getTwitter()).isEqualTo("https://twitter.com");
            assertThat(response.getSocialMedia().getInstagram()).isEqualTo("https://instagram.com");
            assertThat(response.getSocialMedia().getYoutube()).isEqualTo("https://youtube.com");
            assertThat(response.getSocialMedia().getLinkedin()).isEqualTo("https://linkedin.com");
        }
    }

    @Nested
    @DisplayName("Update Footer Config Tests")
    class UpdateFooterConfigTests {

        @Test
        @DisplayName("Should update existing footer settings")
        void shouldUpdateExistingSettings() {
            // Arrange
            when(repository.findFirstByOrderByCreatedAtAsc()).thenReturn(Optional.of(testSettings));
            when(repository.save(any(FooterSettings.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            FooterConfigResponse response = service.updateFooterConfig(testRequest);

            // Assert
            assertThat(response.getTagline()).isEqualTo("Updated tagline");
            assertThat(response.getShowQuickLinks()).isFalse();
            assertThat(response.getShowGetInvolved()).isTrue();
            assertThat(response.getCopyrightText()).isEqualTo("© {year} {siteName}. All rights reserved.");

            verify(repository).save(argThat(settings ->
                    settings.getTagline().equals("Updated tagline") &&
                    !settings.getShowQuickLinks() &&
                    settings.getShowGetInvolved()
            ));
        }

        @Test
        @DisplayName("Should create new settings when none exist")
        void shouldCreateNewSettings() {
            // Arrange
            when(repository.findFirstByOrderByCreatedAtAsc()).thenReturn(Optional.empty());
            when(repository.save(any(FooterSettings.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            FooterConfigResponse response = service.updateFooterConfig(testRequest);

            // Assert
            verify(repository).save(argThat(settings ->
                    settings.getId() == null && // New entity
                    settings.getTagline().equals("Updated tagline")
            ));
        }

        @Test
        @DisplayName("Should update social media links")
        void shouldUpdateSocialMediaLinks() {
            // Arrange
            when(repository.findFirstByOrderByCreatedAtAsc()).thenReturn(Optional.of(testSettings));
            when(repository.save(any(FooterSettings.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            FooterConfigResponse response = service.updateFooterConfig(testRequest);

            // Assert
            assertThat(response.getSocialMedia().getFacebook()).isEqualTo("https://facebook.com/myfoundation");
            assertThat(response.getSocialMedia().getTwitter()).isEqualTo("https://twitter.com/myfoundation");
            assertThat(response.getSocialMedia().getInstagram()).isEqualTo("https://instagram.com/myfoundation");
            assertThat(response.getSocialMedia().getYoutube()).isEqualTo("https://youtube.com/myfoundation");
            assertThat(response.getSocialMedia().getLinkedin()).isEqualTo("https://linkedin.com/company/myfoundation");
        }

        @Test
        @DisplayName("Should default showQuickLinks to true when null")
        void shouldDefaultShowQuickLinksToTrue() {
            // Arrange
            testRequest.setShowQuickLinks(null);
            when(repository.findFirstByOrderByCreatedAtAsc()).thenReturn(Optional.empty());
            when(repository.save(any(FooterSettings.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            FooterConfigResponse response = service.updateFooterConfig(testRequest);

            // Assert
            assertThat(response.getShowQuickLinks()).isTrue();
        }

        @Test
        @DisplayName("Should default showGetInvolved to true when null")
        void shouldDefaultShowGetInvolvedToTrue() {
            // Arrange
            testRequest.setShowGetInvolved(null);
            when(repository.findFirstByOrderByCreatedAtAsc()).thenReturn(Optional.empty());
            when(repository.save(any(FooterSettings.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            FooterConfigResponse response = service.updateFooterConfig(testRequest);

            // Assert
            assertThat(response.getShowGetInvolved()).isTrue();
        }

        @Test
        @DisplayName("Should preserve false values for showQuickLinks")
        void shouldPreserveFalseShowQuickLinks() {
            // Arrange
            testRequest.setShowQuickLinks(false);
            when(repository.findFirstByOrderByCreatedAtAsc()).thenReturn(Optional.of(testSettings));
            when(repository.save(any(FooterSettings.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            FooterConfigResponse response = service.updateFooterConfig(testRequest);

            // Assert
            assertThat(response.getShowQuickLinks()).isFalse();
        }

        @Test
        @DisplayName("Should preserve false values for showGetInvolved")
        void shouldPreserveFalseShowGetInvolved() {
            // Arrange
            testRequest.setShowGetInvolved(false);
            when(repository.findFirstByOrderByCreatedAtAsc()).thenReturn(Optional.of(testSettings));
            when(repository.save(any(FooterSettings.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            FooterConfigResponse response = service.updateFooterConfig(testRequest);

            // Assert
            assertThat(response.getShowGetInvolved()).isFalse();
        }

        @Test
        @DisplayName("Should handle null social media links")
        void shouldHandleNullSocialMedia() {
            // Arrange
            testRequest.setSocialMedia(null);
            when(repository.findFirstByOrderByCreatedAtAsc()).thenReturn(Optional.of(testSettings));
            when(repository.save(any(FooterSettings.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act - Should not throw exception
            FooterConfigResponse response = service.updateFooterConfig(testRequest);

            // Assert - Social media links should remain unchanged (existing values)
            // Service doesn't update them when request.socialMedia is null
            assertThat(response).isNotNull();
        }

        @Test
        @DisplayName("Should handle partial social media updates")
        void shouldHandlePartialSocialMediaUpdates() {
            // Arrange - Only provide some social media links
            SocialMediaLinks partialLinks = SocialMediaLinks.builder()
                    .facebook("https://facebook.com/updated")
                    .twitter(null)
                    .instagram("https://instagram.com/updated")
                    .youtube(null)
                    .linkedin(null)
                    .build();
            testRequest.setSocialMedia(partialLinks);

            when(repository.findFirstByOrderByCreatedAtAsc()).thenReturn(Optional.of(testSettings));
            when(repository.save(any(FooterSettings.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            FooterConfigResponse response = service.updateFooterConfig(testRequest);

            // Assert - All provided values (including null) are set
            verify(repository).save(argThat(settings ->
                    settings.getFacebookUrl().equals("https://facebook.com/updated") &&
                    settings.getTwitterUrl() == null &&
                    settings.getInstagramUrl().equals("https://instagram.com/updated") &&
                    settings.getYoutubeUrl() == null &&
                    settings.getLinkedinUrl() == null
            ));
        }
    }

    @Nested
    @DisplayName("Edge Case Tests")
    class EdgeCaseTests {

        @Test
        @DisplayName("Should handle empty strings for text fields")
        void shouldHandleEmptyStrings() {
            // Arrange
            testRequest.setTagline("");
            testRequest.setCopyrightText("");
            testRequest.setDisclaimerText("");

            when(repository.findFirstByOrderByCreatedAtAsc()).thenReturn(Optional.empty());
            when(repository.save(any(FooterSettings.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            FooterConfigResponse response = service.updateFooterConfig(testRequest);

            // Assert - Empty strings are valid
            assertThat(response.getTagline()).isEmpty();
            assertThat(response.getCopyrightText()).isEmpty();
            assertThat(response.getDisclaimerText()).isEmpty();
        }

        @Test
        @DisplayName("Should handle very long tagline (within limits)")
        void shouldHandleLongTagline() {
            // Arrange
            String longTagline = "a".repeat(500); // Max length
            testRequest.setTagline(longTagline);

            when(repository.findFirstByOrderByCreatedAtAsc()).thenReturn(Optional.empty());
            when(repository.save(any(FooterSettings.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            FooterConfigResponse response = service.updateFooterConfig(testRequest);

            // Assert
            assertThat(response.getTagline()).hasSize(500);
        }

        @Test
        @DisplayName("Should handle placeholder text in copyright")
        void shouldHandlePlaceholderText() {
            // Arrange
            testRequest.setCopyrightText("© {year} {siteName}. All rights reserved.");
            testRequest.setDisclaimerText("{siteName} is a registered nonprofit in {country}.");

            when(repository.findFirstByOrderByCreatedAtAsc()).thenReturn(Optional.empty());
            when(repository.save(any(FooterSettings.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            FooterConfigResponse response = service.updateFooterConfig(testRequest);

            // Assert - Placeholders are stored as-is (replaced on frontend)
            assertThat(response.getCopyrightText()).contains("{year}");
            assertThat(response.getCopyrightText()).contains("{siteName}");
            assertThat(response.getDisclaimerText()).contains("{country}");
        }
    }

    @Nested
    @DisplayName("Issue Documentation Tests")
    class IssueDocumentationTests {

        @Test
        @DisplayName("ISSUE 1: No validation on URL formats")
        void issue1_noUrlValidation() {
            // Service accepts any string as URL, no format validation

            SocialMediaLinks invalidUrls = SocialMediaLinks.builder()
                    .facebook("not-a-valid-url")
                    .twitter("javascript:alert('xss')")
                    .instagram("ftp://invalid-protocol.com")
                    .youtube("12345")
                    .linkedin("https://")
                    .build();
            testRequest.setSocialMedia(invalidUrls);

            when(repository.findFirstByOrderByCreatedAtAsc()).thenReturn(Optional.empty());
            when(repository.save(any(FooterSettings.class))).thenAnswer(inv -> inv.getArgument(0));

            // This should fail but doesn't
            FooterConfigResponse response = service.updateFooterConfig(testRequest);
            assertThat(response.getSocialMedia().getFacebook()).isEqualTo("not-a-valid-url");

            // RECOMMENDATION: Add URL validation
            // private void validateUrl(String url, String fieldName) {
            //     if (url != null && !url.isEmpty()) {
            //         try {
            //             URI uri = new URI(url);
            //             if (!uri.getScheme().matches("^https?$")) {
            //                 throw new IllegalArgumentException(
            //                     fieldName + " must be HTTP or HTTPS URL"
            //                 );
            //             }
            //         } catch (URISyntaxException e) {
            //             throw new IllegalArgumentException(
            //                 "Invalid URL format for " + fieldName + ": " + url
            //             );
            //         }
            //     }
            // }
        }

        @Test
        @DisplayName("ISSUE 2: Duplicate code in default settings")
        void issue2_duplicateDefaultValues() {
            // Default URLs hard-coded in getDefaultFooterSettings() method
            // Same URLs as placeholder values in other parts of codebase

            // PROBLEM: If default social media URLs change, must update in multiple places
            // Hard-coded "https://facebook.com", "https://twitter.com", etc.

            // RECOMMENDATION: Extract to configuration file or constants
            // @Value("${footer.defaults.facebook-url}")
            // private String defaultFacebookUrl;
            //
            // Or use a configuration class:
            // @ConfigurationProperties(prefix = "footer.defaults")
            // public class FooterDefaults {
            //     private String facebookUrl = "https://facebook.com";
            //     private String twitterUrl = "https://twitter.com";
            //     // ...
            // }
        }

        @Test
        @DisplayName("ISSUE 3: No URL sanitization (XSS risk)")
        void issue3_noUrlSanitization() {
            // URLs stored without sanitization - potential XSS risk

            SocialMediaLinks xssUrls = SocialMediaLinks.builder()
                    .facebook("javascript:alert('XSS')")
                    .twitter("data:text/html,<script>alert('XSS')</script>")
                    .instagram("vbscript:msgbox('XSS')")
                    .build();
            testRequest.setSocialMedia(xssUrls);

            when(repository.findFirstByOrderByCreatedAtAsc()).thenReturn(Optional.empty());
            when(repository.save(any(FooterSettings.class))).thenAnswer(inv -> inv.getArgument(0));

            // Dangerous URLs are accepted
            FooterConfigResponse response = service.updateFooterConfig(testRequest);

            // PROBLEM: If URLs are rendered in HTML without escaping, XSS vulnerability
            // Even with escaping, malicious URLs shouldn't be stored

            // RECOMMENDATION: Sanitize URLs and reject dangerous protocols
            // private String sanitizeUrl(String url) {
            //     if (url == null || url.isEmpty()) return url;
            //
            //     String trimmed = url.trim().toLowerCase();
            //     if (trimmed.startsWith("javascript:") ||
            //         trimmed.startsWith("data:") ||
            //         trimmed.startsWith("vbscript:")) {
            //         throw new IllegalArgumentException(
            //             "Dangerous URL protocol detected: " + url
            //         );
            //     }
            //     return url;
            // }
        }

        @Test
        @DisplayName("ISSUE 4: No support for updating specific fields")
        void issue4_noPartialUpdates() {
            // Service always overwrites all fields, cannot update just one field

            when(repository.findFirstByOrderByCreatedAtAsc()).thenReturn(Optional.of(testSettings));
            when(repository.save(any(FooterSettings.class))).thenAnswer(inv -> inv.getArgument(0));

            // Want to update only tagline, but must provide all fields
            FooterConfigRequest partialRequest = FooterConfigRequest.builder()
                    .tagline("Only want to update this")
                    // Not providing other fields, but they'll be overwritten with null
                    .build();

            service.updateFooterConfig(partialRequest);

            verify(repository).save(argThat(settings ->
                    settings.getTagline().equals("Only want to update this") &&
                    settings.getCopyrightText() == null && // Oops! Lost existing value
                    settings.getDisclaimerText() == null   // Oops! Lost existing value
            ));

            // PROBLEM: Cannot do partial updates - always overwrites everything
            // Admin wants to change tagline but preserve existing copyright text

            // RECOMMENDATION: Add PATCH endpoint for partial updates
            // public FooterConfigResponse patchFooterConfig(FooterConfigPatch patch) {
            //     FooterSettings settings = footerSettingsRepository
            //         .findFirstByOrderByCreatedAtAsc()
            //         .orElseThrow();
            //
            //     if (patch.getTagline() != null) {
            //         settings.setTagline(patch.getTagline());
            //     }
            //     if (patch.getSocialMedia() != null) {
            //         // Update only provided social media links
            //     }
            //     // ... update only non-null fields
            // }
        }

        @Test
        @DisplayName("ISSUE 5: Singleton pattern not enforced")
        void issue5_singletonNotEnforced() {
            // Service uses findFirstByOrderByCreatedAtAsc() assuming single record
            // But nothing prevents creating multiple FooterSettings records

            // PROBLEM: Database could have multiple footer settings records
            // Service only returns first one by created_at, others are orphaned
            // No unique constraint on table

            // RECOMMENDATION: Add unique constraint or use ID-based singleton
            // Option 1: Database constraint
            // @Table(name = "footer_settings",
            //        uniqueConstraints = @UniqueConstraint(columnNames = {"singleton_key"}))
            // private final String singletonKey = "SINGLETON"; // Always same value
            //
            // Option 2: Fixed ID approach
            // private static final UUID SINGLETON_ID = UUID.fromString("...");
            // FooterSettings settings = footerSettingsRepository
            //     .findById(SINGLETON_ID)
            //     .orElseGet(() -> {
            //         FooterSettings newSettings = new FooterSettings();
            //         newSettings.setId(SINGLETON_ID);
            //         return newSettings;
            //     });
        }
    }
}

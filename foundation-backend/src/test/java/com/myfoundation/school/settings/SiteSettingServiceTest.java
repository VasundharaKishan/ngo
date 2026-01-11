package com.myfoundation.school.settings;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Comprehensive test suite for SiteSettingService.
 * Tests site-wide setting management with type validation and public/private access control.
 * 
 * Coverage: 100% of public methods
 * Test Count: 32 tests
 * 
 * Methods tested:
 * - getPublicSettings() - Retrieve only public settings
 * - getAllSettings() - Get all settings (admin only)
 * - getSetting(key) - Get single setting by key
 * - getSettingValue(key, default) - Get value with fallback
 * - updateSettings(map) - Batch update with type validation
 * - createOrUpdateSetting() - Create or update single setting
 * - initializeDefaultSettings() - Initialize default settings
 * - validateValue() - Type validation (private, tested indirectly)
 * 
 * Business Rules:
 * 1. Public settings: Can be accessed by anyone (frontend/public API)
 * 2. Private settings: Only accessible to admin users (e.g., maintenance mode)
 * 3. Type validation: INTEGER, BOOLEAN, JSON, STRING
 * 4. Default settings: Created on app startup if missing
 * 5. Audit trail: updatedBy, updatedAt tracked on every change
 * 
 * Test Patterns:
 * - @Nested classes for logical grouping by operation
 * - lenient() stubs for validation-only tests (no save needed)
 * - SecurityContext mocking for audit trail tests
 * 
 * Issues Found: 3
 * 1. JSON validation is basic (only checks start char, no proper parsing)
 * 2. No setting deletion method (creates orphaned settings)
 * 3. No bulk delete for settings with prefix (e.g., all "feature.*" settings)
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SiteSettingService Tests")
class SiteSettingServiceTest {

    @Mock
    private SiteSettingRepository repository;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private SiteSettingService service;

    private SiteSetting publicSetting;
    private SiteSetting privateSetting;

    @BeforeEach
    void setUp() {
        publicSetting = SiteSetting.builder()
                .key("site.name")
                .value("Test Foundation")
                .type(SiteSetting.SettingType.STRING)
                .isPublic(true)
                .description("Site name")
                .updatedBy("admin")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        privateSetting = SiteSetting.builder()
                .key("maintenance.mode")
                .value("false")
                .type(SiteSetting.SettingType.BOOLEAN)
                .isPublic(false)
                .description("Maintenance mode flag")
                .updatedBy("admin")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    @Nested
    @DisplayName("Get Public Settings Tests")
    class GetPublicSettingsTests {

        @Test
        @DisplayName("Should return only public settings as map")
        void shouldReturnOnlyPublicSettings() {
            // Arrange
            List<SiteSetting> publicSettings = Arrays.asList(
                    publicSetting,
                    SiteSetting.builder()
                            .key("site.tagline")
                            .value("Helping communities")
                            .isPublic(true)
                            .build()
            );
            when(repository.findByIsPublicTrue()).thenReturn(publicSettings);

            // Act
            Map<String, String> result = service.getPublicSettings();

            // Assert
            assertThat(result).hasSize(2);
            assertThat(result).containsEntry("site.name", "Test Foundation");
            assertThat(result).containsEntry("site.tagline", "Helping communities");
            verify(repository).findByIsPublicTrue();
        }

        @Test
        @DisplayName("Should return empty map when no public settings exist")
        void shouldReturnEmptyMapWhenNoPublicSettings() {
            // Arrange
            when(repository.findByIsPublicTrue()).thenReturn(Collections.emptyList());

            // Act
            Map<String, String> result = service.getPublicSettings();

            // Assert
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should not include private settings in public map")
        void shouldNotIncludePrivateSettings() {
            // Arrange
            when(repository.findByIsPublicTrue()).thenReturn(List.of(publicSetting));

            // Act
            Map<String, String> result = service.getPublicSettings();

            // Assert
            assertThat(result).doesNotContainKey("maintenance.mode");
            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("Get All Settings Tests")
    class GetAllSettingsTests {

        @Test
        @DisplayName("Should return all settings including public and private")
        void shouldReturnAllSettings() {
            // Arrange
            List<SiteSetting> allSettings = Arrays.asList(publicSetting, privateSetting);
            when(repository.findAll()).thenReturn(allSettings);

            // Act
            List<SiteSetting> result = service.getAllSettings();

            // Assert
            assertThat(result).hasSize(2);
            assertThat(result).contains(publicSetting, privateSetting);
        }

        @Test
        @DisplayName("Should return empty list when no settings exist")
        void shouldReturnEmptyListWhenNoSettings() {
            // Arrange
            when(repository.findAll()).thenReturn(Collections.emptyList());

            // Act
            List<SiteSetting> result = service.getAllSettings();

            // Assert
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("Get Single Setting Tests")
    class GetSingleSettingTests {

        @Test
        @DisplayName("Should return setting when key exists")
        void shouldReturnSettingWhenExists() {
            // Arrange
            when(repository.findByKey("site.name")).thenReturn(Optional.of(publicSetting));

            // Act
            SiteSetting result = service.getSetting("site.name");

            // Assert
            assertThat(result).isEqualTo(publicSetting);
            assertThat(result.getValue()).isEqualTo("Test Foundation");
        }

        @Test
        @DisplayName("Should throw SettingNotFoundException when key not found")
        void shouldThrowExceptionWhenNotFound() {
            // Arrange
            when(repository.findByKey("nonexistent.key")).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> service.getSetting("nonexistent.key"))
                    .isInstanceOf(SiteSettingService.SettingNotFoundException.class)
                    .hasMessageContaining("Setting not found: nonexistent.key");
        }
    }

    @Nested
    @DisplayName("Get Setting Value with Default Tests")
    class GetSettingValueTests {

        @Test
        @DisplayName("Should return setting value when key exists")
        void shouldReturnValueWhenExists() {
            // Arrange
            when(repository.findByKey("site.name")).thenReturn(Optional.of(publicSetting));

            // Act
            String result = service.getSettingValue("site.name", "Default Name");

            // Assert
            assertThat(result).isEqualTo("Test Foundation");
        }

        @Test
        @DisplayName("Should return default value when key not found")
        void shouldReturnDefaultWhenNotFound() {
            // Arrange
            when(repository.findByKey("missing.key")).thenReturn(Optional.empty());

            // Act
            String result = service.getSettingValue("missing.key", "Default Value");

            // Assert
            assertThat(result).isEqualTo("Default Value");
        }

        @Test
        @DisplayName("Should return null default when key not found and default is null")
        void shouldReturnNullDefaultWhenNotFound() {
            // Arrange
            when(repository.findByKey("missing.key")).thenReturn(Optional.empty());

            // Act
            String result = service.getSettingValue("missing.key", null);

            // Assert
            assertThat(result).isNull();
        }
    }

    @Nested
    @DisplayName("Update Settings Batch Tests")
    class UpdateSettingsBatchTests {

        @BeforeEach
        void setupSecurityContext() {
            SecurityContextHolder.setContext(securityContext);
            when(securityContext.getAuthentication()).thenReturn(authentication);
            when(authentication.getName()).thenReturn("test-admin");
        }

        @Test
        @DisplayName("Should update multiple settings successfully")
        void shouldUpdateMultipleSettings() {
            // Arrange
            SiteSetting intSetting = SiteSetting.builder()
                    .key("homepage.featured_campaigns_count")
                    .value("3")
                    .type(SiteSetting.SettingType.INTEGER)
                    .build();

            SiteSetting boolSetting = SiteSetting.builder()
                    .key("maintenance.mode")
                    .value("false")
                    .type(SiteSetting.SettingType.BOOLEAN)
                    .build();

            when(repository.findByKey("homepage.featured_campaigns_count"))
                    .thenReturn(Optional.of(intSetting));
            when(repository.findByKey("maintenance.mode"))
                    .thenReturn(Optional.of(boolSetting));
            when(repository.save(any(SiteSetting.class))).thenAnswer(inv -> inv.getArgument(0));

            Map<String, String> updates = new HashMap<>();
            updates.put("homepage.featured_campaigns_count", "5");
            updates.put("maintenance.mode", "true");

            // Act
            Map<String, String> results = service.updateSettings(updates);

            // Assert
            assertThat(results).hasSize(2);
            assertThat(results.get("homepage.featured_campaigns_count")).isEqualTo("SUCCESS");
            assertThat(results.get("maintenance.mode")).isEqualTo("SUCCESS");
            verify(repository, times(2)).save(any(SiteSetting.class));
        }

        @Test
        @DisplayName("Should record updatedBy from SecurityContext")
        void shouldRecordUpdatedBy() {
            // Arrange
            SiteSetting setting = SiteSetting.builder()
                    .key("site.name")
                    .value("Old Name")
                    .type(SiteSetting.SettingType.STRING)
                    .build();

            when(repository.findByKey("site.name")).thenReturn(Optional.of(setting));
            when(repository.save(any(SiteSetting.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            service.updateSettings(Map.of("site.name", "New Name"));

            // Assert
            verify(repository).save(argThat(s ->
                    s.getUpdatedBy().equals("test-admin") &&
                    s.getUpdatedAt() != null
            ));
        }

        @Test
        @DisplayName("Should return ERROR when setting not found")
        void shouldReturnErrorWhenSettingNotFound() {
            // Arrange
            when(repository.findByKey("nonexistent.key")).thenReturn(Optional.empty());

            // Act
            Map<String, String> results = service.updateSettings(
                    Map.of("nonexistent.key", "some value")
            );

            // Assert
            assertThat(results.get("nonexistent.key")).startsWith("ERROR");
            assertThat(results.get("nonexistent.key")).contains("Setting not found");
            verify(repository, never()).save(any());
        }

        @Test
        @DisplayName("Should return ERROR when type validation fails")
        void shouldReturnErrorWhenValidationFails() {
            // Arrange
            SiteSetting intSetting = SiteSetting.builder()
                    .key("homepage.featured_campaigns_count")
                    .value("3")
                    .type(SiteSetting.SettingType.INTEGER)
                    .build();

            when(repository.findByKey("homepage.featured_campaigns_count"))
                    .thenReturn(Optional.of(intSetting));

            // Act - Try to set invalid integer value
            Map<String, String> results = service.updateSettings(
                    Map.of("homepage.featured_campaigns_count", "not-a-number")
            );

            // Assert
            assertThat(results.get("homepage.featured_campaigns_count")).startsWith("ERROR");
            assertThat(results.get("homepage.featured_campaigns_count")).contains("Invalid integer value");
            verify(repository, never()).save(any());
        }

        @Test
        @DisplayName("Should continue updating other settings when one fails")
        void shouldContinueUpdatingWhenOneFails() {
            // Arrange
            SiteSetting validSetting = SiteSetting.builder()
                    .key("site.name")
                    .value("Old Name")
                    .type(SiteSetting.SettingType.STRING)
                    .build();

            when(repository.findByKey("site.name")).thenReturn(Optional.of(validSetting));
            when(repository.findByKey("invalid.key")).thenReturn(Optional.empty());
            when(repository.save(any(SiteSetting.class))).thenAnswer(inv -> inv.getArgument(0));

            Map<String, String> updates = new HashMap<>();
            updates.put("site.name", "New Name");
            updates.put("invalid.key", "some value");

            // Act
            Map<String, String> results = service.updateSettings(updates);

            // Assert
            assertThat(results.get("site.name")).isEqualTo("SUCCESS");
            assertThat(results.get("invalid.key")).startsWith("ERROR");
            verify(repository, times(1)).save(any()); // Only valid setting saved
        }
    }

    @Nested
    @DisplayName("Create Or Update Single Setting Tests")
    class CreateOrUpdateSingleSettingTests {

        @BeforeEach
        void setupSecurityContext() {
            SecurityContextHolder.setContext(securityContext);
            when(securityContext.getAuthentication()).thenReturn(authentication);
            when(authentication.getName()).thenReturn("test-admin");
        }

        @Test
        @DisplayName("Should create new setting when key doesn't exist")
        void shouldCreateNewSetting() {
            // Arrange
            when(repository.findByKey("new.setting")).thenReturn(Optional.empty());
            when(repository.save(any(SiteSetting.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            SiteSetting result = service.createOrUpdateSetting(
                    "new.setting", "test value", SiteSetting.SettingType.STRING, true, "Test setting"
            );

            // Assert
            assertThat(result.getKey()).isEqualTo("new.setting");
            assertThat(result.getValue()).isEqualTo("test value");
            assertThat(result.getType()).isEqualTo(SiteSetting.SettingType.STRING);
            assertThat(result.isPublic()).isTrue();
            assertThat(result.getUpdatedBy()).isEqualTo("test-admin");
            verify(repository).save(any(SiteSetting.class));
        }

        @Test
        @DisplayName("Should update existing setting when key exists")
        void shouldUpdateExistingSetting() {
            // Arrange
            SiteSetting existing = SiteSetting.builder()
                    .key("site.name")
                    .value("Old Name")
                    .type(SiteSetting.SettingType.STRING)
                    .isPublic(true)
                    .description("Site name")
                    .createdAt(Instant.now().minusSeconds(3600))
                    .build();

            when(repository.findByKey("site.name")).thenReturn(Optional.of(existing));
            when(repository.save(any(SiteSetting.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            SiteSetting result = service.createOrUpdateSetting(
                    "site.name", "New Name", SiteSetting.SettingType.STRING, true, "Updated name"
            );

            // Assert
            assertThat(result.getValue()).isEqualTo("New Name");
            assertThat(result.getUpdatedBy()).isEqualTo("test-admin");
            assertThat(result.getCreatedAt()).isEqualTo(existing.getCreatedAt()); // Unchanged
            verify(repository).save(existing);
        }

        @Test
        @DisplayName("Should validate value against type when creating")
        void shouldValidateValueWhenCreating() {
            // Arrange
            lenient().when(repository.findByKey(anyString())).thenReturn(Optional.empty());

            // Act & Assert - Invalid integer
            assertThatThrownBy(() -> service.createOrUpdateSetting(
                    "test.int", "not-a-number", SiteSetting.SettingType.INTEGER, false, "Test"
            ))
                    .isInstanceOf(SiteSettingService.InvalidSettingValueException.class)
                    .hasMessageContaining("Invalid integer value");

            verify(repository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Type Validation Tests")
    class TypeValidationTests {

        @BeforeEach
        void setupSecurityContext() {
            SecurityContextHolder.setContext(securityContext);
            lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
            lenient().when(authentication.getName()).thenReturn("test-admin");
            lenient().when(repository.findByKey(anyString())).thenReturn(Optional.empty());
        }

        @Test
        @DisplayName("Should accept valid INTEGER values")
        void shouldAcceptValidIntegers() {
            // Arrange
            when(repository.save(any(SiteSetting.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act & Assert
            assertThatCode(() -> service.createOrUpdateSetting(
                    "test.int", "123", SiteSetting.SettingType.INTEGER, false, "Test"
            )).doesNotThrowAnyException();

            assertThatCode(() -> service.createOrUpdateSetting(
                    "test.int", "-456", SiteSetting.SettingType.INTEGER, false, "Test"
            )).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should reject invalid INTEGER values")
        void shouldRejectInvalidIntegers() {
            // Act & Assert
            assertThatThrownBy(() -> service.createOrUpdateSetting(
                    "test.int", "12.5", SiteSetting.SettingType.INTEGER, false, "Test"
            ))
                    .isInstanceOf(SiteSettingService.InvalidSettingValueException.class)
                    .hasMessageContaining("Invalid integer value");

            assertThatThrownBy(() -> service.createOrUpdateSetting(
                    "test.int", "abc", SiteSetting.SettingType.INTEGER, false, "Test"
            ))
                    .isInstanceOf(SiteSettingService.InvalidSettingValueException.class);
        }

        @Test
        @DisplayName("Should accept valid BOOLEAN values")
        void shouldAcceptValidBooleans() {
            // Arrange
            when(repository.save(any(SiteSetting.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act & Assert
            assertThatCode(() -> service.createOrUpdateSetting(
                    "test.bool", "true", SiteSetting.SettingType.BOOLEAN, false, "Test"
            )).doesNotThrowAnyException();

            assertThatCode(() -> service.createOrUpdateSetting(
                    "test.bool", "false", SiteSetting.SettingType.BOOLEAN, false, "Test"
            )).doesNotThrowAnyException();

            assertThatCode(() -> service.createOrUpdateSetting(
                    "test.bool", "TRUE", SiteSetting.SettingType.BOOLEAN, false, "Test"
            )).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should reject invalid BOOLEAN values")
        void shouldRejectInvalidBooleans() {
            // Act & Assert
            assertThatThrownBy(() -> service.createOrUpdateSetting(
                    "test.bool", "yes", SiteSetting.SettingType.BOOLEAN, false, "Test"
            ))
                    .isInstanceOf(SiteSettingService.InvalidSettingValueException.class)
                    .hasMessageContaining("Invalid boolean value");

            assertThatThrownBy(() -> service.createOrUpdateSetting(
                    "test.bool", "1", SiteSetting.SettingType.BOOLEAN, false, "Test"
            ))
                    .isInstanceOf(SiteSettingService.InvalidSettingValueException.class);
        }

        @Test
        @DisplayName("Should accept valid JSON values")
        void shouldAcceptValidJson() {
            // Arrange
            when(repository.save(any(SiteSetting.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act & Assert
            assertThatCode(() -> service.createOrUpdateSetting(
                    "test.json", "{\"key\": \"value\"}", SiteSetting.SettingType.JSON, false, "Test"
            )).doesNotThrowAnyException();

            assertThatCode(() -> service.createOrUpdateSetting(
                    "test.json", "[1, 2, 3]", SiteSetting.SettingType.JSON, false, "Test"
            )).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should reject invalid JSON values")
        void shouldRejectInvalidJson() {
            // Act & Assert
            assertThatThrownBy(() -> service.createOrUpdateSetting(
                    "test.json", "not json", SiteSetting.SettingType.JSON, false, "Test"
            ))
                    .isInstanceOf(SiteSettingService.InvalidSettingValueException.class)
                    .hasMessageContaining("Invalid JSON value");

            assertThatThrownBy(() -> service.createOrUpdateSetting(
                    "test.json", "123", SiteSetting.SettingType.JSON, false, "Test"
            ))
                    .isInstanceOf(SiteSettingService.InvalidSettingValueException.class);
        }

        @Test
        @DisplayName("Should accept any STRING values")
        void shouldAcceptAnyStrings() {
            // Arrange
            when(repository.save(any(SiteSetting.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act & Assert
            assertThatCode(() -> service.createOrUpdateSetting(
                    "test.string", "any value", SiteSetting.SettingType.STRING, false, "Test"
            )).doesNotThrowAnyException();

            assertThatCode(() -> service.createOrUpdateSetting(
                    "test.string", "123", SiteSetting.SettingType.STRING, false, "Test"
            )).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should reject empty or null values")
        void shouldRejectEmptyValues() {
            // Act & Assert
            assertThatThrownBy(() -> service.createOrUpdateSetting(
                    "test.setting", "", SiteSetting.SettingType.STRING, false, "Test"
            ))
                    .isInstanceOf(SiteSettingService.InvalidSettingValueException.class)
                    .hasMessageContaining("Setting value cannot be empty");

            assertThatThrownBy(() -> service.createOrUpdateSetting(
                    "test.setting", "   ", SiteSetting.SettingType.STRING, false, "Test"
            ))
                    .isInstanceOf(SiteSettingService.InvalidSettingValueException.class);

            assertThatThrownBy(() -> service.createOrUpdateSetting(
                    "test.setting", null, SiteSetting.SettingType.STRING, false, "Test"
            ))
                    .isInstanceOf(SiteSettingService.InvalidSettingValueException.class);
        }
    }

    @Nested
    @DisplayName("Initialize Default Settings Tests")
    class InitializeDefaultSettingsTests {

        @Test
        @DisplayName("Should create all default settings when none exist")
        void shouldCreateDefaultSettings() {
            // Arrange
            when(repository.findByKey(anyString())).thenReturn(Optional.empty());
            when(repository.save(any(SiteSetting.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            service.initializeDefaultSettings();

            // Assert
            verify(repository, times(6)).save(any(SiteSetting.class));
            verify(repository).findByKey("homepage.featured_campaigns_count");
            verify(repository).findByKey("campaigns_page.items_per_page");
            verify(repository).findByKey("site.name");
            verify(repository).findByKey("site.tagline");
            verify(repository).findByKey("maintenance.mode");
            verify(repository).findByKey("donate_popup.spotlight_campaign_id");
        }

        @Test
        @DisplayName("Should not overwrite existing settings")
        void shouldNotOverwriteExistingSettings() {
            // Arrange
            when(repository.findByKey("site.name")).thenReturn(Optional.of(publicSetting));
            when(repository.findByKey(argThat(key -> !"site.name".equals(key))))
                    .thenReturn(Optional.empty());
            when(repository.save(any(SiteSetting.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            service.initializeDefaultSettings();

            // Assert
            verify(repository, times(5)).save(any(SiteSetting.class)); // 5 new, 1 exists
            verify(repository, never()).save(publicSetting); // Existing not saved
        }

        @Test
        @DisplayName("Should set correct default values")
        void shouldSetCorrectDefaults() {
            // Arrange
            when(repository.findByKey(anyString())).thenReturn(Optional.empty());
            when(repository.save(any(SiteSetting.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            service.initializeDefaultSettings();

            // Assert
            verify(repository).save(argThat(setting ->
                    setting.getKey().equals("homepage.featured_campaigns_count") &&
                    setting.getValue().equals("3") &&
                    setting.getType() == SiteSetting.SettingType.INTEGER &&
                    setting.isPublic()
            ));

            verify(repository).save(argThat(setting ->
                    setting.getKey().equals("maintenance.mode") &&
                    setting.getValue().equals("false") &&
                    setting.getType() == SiteSetting.SettingType.BOOLEAN &&
                    !setting.isPublic()
            ));
        }
    }

    @Nested
    @DisplayName("Issue Documentation Tests")
    class IssueDocumentationTests {

        @Test
        @DisplayName("ISSUE 1: JSON validation is basic - only checks start character")
        void issue1_jsonValidationIsBasic() {
            // Arrange
            SecurityContextHolder.setContext(securityContext);
            when(securityContext.getAuthentication()).thenReturn(authentication);
            when(authentication.getName()).thenReturn("test-admin");
            when(repository.findByKey(anyString())).thenReturn(Optional.empty());
            lenient().when(repository.save(any(SiteSetting.class))).thenAnswer(inv -> inv.getArgument(0));

            // This SHOULD fail but passes due to basic validation
            String invalidJson = "{invalid json without closing brace";

            // Act & Assert - Currently passes (but shouldn't)
            assertThatCode(() -> service.createOrUpdateSetting(
                    "test.json", invalidJson, SiteSetting.SettingType.JSON, false, "Test"
            )).doesNotThrowAnyException();

            // RECOMMENDATION: Use Jackson ObjectMapper to validate JSON:
            // try {
            //     new ObjectMapper().readTree(value);
            // } catch (JsonProcessingException e) {
            //     throw new InvalidSettingValueException("Invalid JSON: " + e.getMessage());
            // }
        }

        @Test
        @DisplayName("ISSUE 2: No setting deletion method - creates orphaned settings")
        void issue2_noSettingDeletionMethod() {
            // SiteSettingService has no deleteSetting(key) method
            // Once a setting is created, it cannot be removed from the database
            // This can lead to:
            // 1. Orphaned settings that are no longer used
            // 2. Inability to clean up test/experimental settings
            // 3. Database bloat over time

            // RECOMMENDATION: Add deleteSetting(String key) method:
            // @Transactional
            // public void deleteSetting(String key) {
            //     SiteSetting setting = getSetting(key);
            //     // Prevent deletion of critical settings
            //     if (PROTECTED_KEYS.contains(key)) {
            //         throw new IllegalOperationException("Cannot delete protected setting: " + key);
            //     }
            //     repository.delete(setting);
            //     log.info("Deleted setting: {}", key);
            // }
        }

        @Test
        @DisplayName("ISSUE 3: No bulk delete for settings with prefix")
        void issue3_noBulkDeleteForPrefix() {
            // When settings are grouped by prefix (e.g., "feature.*.enabled"),
            // there's no way to delete all settings matching a pattern.
            // Use cases:
            // 1. Remove all feature flags: deleteByPrefix("feature.")
            // 2. Clean up module settings: deleteByPrefix("module.payment.")
            // 3. Reset experiment settings: deleteByPrefix("experiment.")

            // RECOMMENDATION: Add bulk delete method:
            // @Transactional
            // public int deleteSettingsByPrefix(String prefix) {
            //     List<SiteSetting> settings = repository.findByKeyStartingWith(prefix);
            //     settings.forEach(setting -> {
            //         if (!PROTECTED_KEYS.contains(setting.getKey())) {
            //             repository.delete(setting);
            //         }
            //     });
            //     log.info("Deleted {} settings with prefix: {}", settings.size(), prefix);
            //     return settings.size();
            // }
        }
    }
}

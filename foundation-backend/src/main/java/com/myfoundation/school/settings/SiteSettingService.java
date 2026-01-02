package com.myfoundation.school.settings;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SiteSettingService {
    
    private final SiteSettingRepository repository;
    
    // Whitelisted keys that can be exposed publicly
    private static final List<String> PUBLIC_KEYS = List.of(
            "homepage.featured_campaigns_count",
            "campaigns_page.items_per_page",
            "site.name",
            "site.tagline",
            "contact.email",
            "contact.phone"
    );
    
    /**
     * Get public settings only (whitelisted keys)
     */
    public Map<String, String> getPublicSettings() {
        log.debug("Fetching public settings");
        return repository.findByIsPublicTrue().stream()
                .collect(Collectors.toMap(
                        SiteSetting::getKey,
                        SiteSetting::getValue
                ));
    }
    
    /**
     * Get all settings (admin only)
     */
    public List<SiteSetting> getAllSettings() {
        log.debug("Fetching all settings");
        return repository.findAll();
    }
    
    /**
     * Get single setting by key
     */
    public SiteSetting getSetting(String key) {
        return repository.findByKey(key)
                .orElseThrow(() -> new SettingNotFoundException("Setting not found: " + key));
    }
    
    /**
     * Get setting value with default fallback
     */
    public String getSettingValue(String key, String defaultValue) {
        return repository.findByKey(key)
                .map(SiteSetting::getValue)
                .orElse(defaultValue);
    }
    
    /**
     * Update settings in batch with type validation
     */
    @Transactional
    public Map<String, String> updateSettings(Map<String, String> updates) {
        log.info("Updating {} settings", updates.size());
        
        String updatedBy = SecurityContextHolder.getContext().getAuthentication().getName();
        Map<String, String> results = new HashMap<>();
        
        for (Map.Entry<String, String> entry : updates.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            
            try {
                SiteSetting setting = repository.findByKey(key)
                        .orElseThrow(() -> new SettingNotFoundException("Setting not found: " + key));
                
                // Validate value against type
                validateValue(value, setting.getType());
                
                // Update setting
                setting.setValue(value);
                setting.setUpdatedBy(updatedBy);
                setting.setUpdatedAt(Instant.now());
                
                repository.save(setting);
                results.put(key, "SUCCESS");
                
                log.debug("Updated setting: {} = {}", key, value);
                
            } catch (Exception e) {
                log.error("Failed to update setting {}: {}", key, e.getMessage());
                results.put(key, "ERROR: " + e.getMessage());
            }
        }
        
        return results;
    }
    
    /**
     * Create or update a single setting
     */
    @Transactional
    public SiteSetting createOrUpdateSetting(String key, String value, SiteSetting.SettingType type, 
                                              boolean isPublic, String description) {
        log.info("Creating/updating setting: {}", key);
        
        String updatedBy = SecurityContextHolder.getContext().getAuthentication().getName();
        
        // Validate value against type
        validateValue(value, type);
        
        SiteSetting setting = repository.findByKey(key)
                .orElse(SiteSetting.builder()
                        .key(key)
                        .type(type)
                        .isPublic(isPublic)
                        .description(description)
                        .createdAt(Instant.now())
                        .build());
        
        setting.setValue(value);
        setting.setUpdatedBy(updatedBy);
        setting.setUpdatedAt(Instant.now());
        
        return repository.save(setting);
    }
    
    /**
     * Validate setting value against its declared type
     */
    private void validateValue(String value, SiteSetting.SettingType type) {
        if (value == null || value.trim().isEmpty()) {
            throw new InvalidSettingValueException("Setting value cannot be empty");
        }
        
        switch (type) {
            case INTEGER:
                try {
                    Integer.parseInt(value);
                } catch (NumberFormatException e) {
                    throw new InvalidSettingValueException("Invalid integer value: " + value);
                }
                break;
                
            case BOOLEAN:
                if (!value.equalsIgnoreCase("true") && !value.equalsIgnoreCase("false")) {
                    throw new InvalidSettingValueException("Invalid boolean value: " + value);
                }
                break;
                
            case JSON:
                // Basic JSON validation - check if it starts with { or [
                String trimmed = value.trim();
                if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
                    throw new InvalidSettingValueException("Invalid JSON value");
                }
                break;
                
            case STRING:
                // No additional validation for strings
                break;
        }
    }
    
    /**
     * Initialize default settings if they don't exist
     */
    @Transactional
    public void initializeDefaultSettings() {
        log.info("Initializing default settings");
        
        createIfNotExists("homepage.featured_campaigns_count", "3", SiteSetting.SettingType.INTEGER, 
                true, "Number of featured campaigns to show on homepage");
        
        createIfNotExists("campaigns_page.items_per_page", "12", SiteSetting.SettingType.INTEGER, 
                true, "Number of campaigns per page in campaign list");
        
        createIfNotExists("site.name", "Yugal Savitri Seva", SiteSetting.SettingType.STRING, 
                true, "Site name displayed in header and footer");
        
        createIfNotExists("site.tagline", "Empowering communities worldwide", SiteSetting.SettingType.STRING, 
                true, "Site tagline or slogan");
        
        createIfNotExists("maintenance.mode", "false", SiteSetting.SettingType.BOOLEAN, 
                false, "Enable maintenance mode to block non-admin access");
        
        createIfNotExists("donate_popup.spotlight_campaign_id", "", SiteSetting.SettingType.STRING, 
                false, "Campaign ID to feature in Donate Now popup (empty for automatic selection)");
        
        log.info("Default settings initialized");
    }
    
    private void createIfNotExists(String key, String value, SiteSetting.SettingType type, 
                                    boolean isPublic, String description) {
        if (repository.findByKey(key).isEmpty()) {
            SiteSetting setting = SiteSetting.builder()
                    .key(key)
                    .value(value)
                    .type(type)
                    .isPublic(isPublic)
                    .description(description)
                    .updatedBy("system")
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
            
            repository.save(setting);
            log.debug("Created default setting: {} = {}", key, value);
        }
    }
    
    // Exception classes
    public static class SettingNotFoundException extends RuntimeException {
        public SettingNotFoundException(String message) {
            super(message);
        }
    }
    
    public static class InvalidSettingValueException extends RuntimeException {
        public InvalidSettingValueException(String message) {
            super(message);
        }
    }
}

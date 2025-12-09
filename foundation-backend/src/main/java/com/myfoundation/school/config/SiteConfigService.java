package com.myfoundation.school.config;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SiteConfigService {
    
    private final SiteConfigRepository siteConfigRepository;
    
    // Default values
    private static final Map<String, String> DEFAULT_CONFIGS = new HashMap<>();
    
    static {
        DEFAULT_CONFIGS.put("homepage.featured_campaigns_count", "3");
        DEFAULT_CONFIGS.put("campaigns_page.items_per_page", "12");
    }
    
    public String getConfigValue(String key) {
        return siteConfigRepository.findByConfigKey(key)
                .map(SiteConfig::getConfigValue)
                .orElse(DEFAULT_CONFIGS.get(key));
    }
    
    public int getIntConfigValue(String key) {
        String value = getConfigValue(key);
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return Integer.parseInt(DEFAULT_CONFIGS.getOrDefault(key, "0"));
        }
    }
    
    @Transactional
    public SiteConfig updateConfig(String key, String value, String description) {
        SiteConfig config = siteConfigRepository.findByConfigKey(key)
                .orElse(new SiteConfig());
        
        config.setConfigKey(key);
        config.setConfigValue(value);
        config.setDescription(description);
        config.setUpdatedAt(Instant.now());
        
        if (config.getId() == null) {
            config.setCreatedAt(Instant.now());
        }
        
        return siteConfigRepository.save(config);
    }
    
    public List<SiteConfig> getAllConfigs() {
        return siteConfigRepository.findAll();
    }
    
    @Transactional
    public void initializeDefaultConfigs() {
        for (Map.Entry<String, String> entry : DEFAULT_CONFIGS.entrySet()) {
            if (siteConfigRepository.findByConfigKey(entry.getKey()).isEmpty()) {
                SiteConfig config = new SiteConfig();
                config.setConfigKey(entry.getKey());
                config.setConfigValue(entry.getValue());
                config.setDescription(getDescriptionForKey(entry.getKey()));
                config.setCreatedAt(Instant.now());
                config.setUpdatedAt(Instant.now());
                siteConfigRepository.save(config);
            }
        }
    }
    
    private String getDescriptionForKey(String key) {
        return switch (key) {
            case "homepage.featured_campaigns_count" -> "Number of featured campaigns to show on homepage";
            case "campaigns_page.items_per_page" -> "Number of campaigns to show per page on campaigns list";
            default -> "";
        };
    }
}

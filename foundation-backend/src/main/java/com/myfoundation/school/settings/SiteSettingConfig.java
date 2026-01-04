package com.myfoundation.school.settings;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class SiteSettingConfig {
    
    private final SiteSettingService siteSettingService;
    
    /**
     * Initialize default settings on application startup
     */
    @Bean
    public CommandLineRunner initializeSettings() {
        return args -> {
            log.info("Checking and initializing site settings");
            try {
                siteSettingService.initializeDefaultSettings();
                log.info("Site settings initialization completed");
            } catch (Exception e) {
                log.error("Failed to initialize site settings", e);
            }
        };
    }
}

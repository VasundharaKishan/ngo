package com.myfoundation.school.settings;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/settings")
@PreAuthorize("hasAuthority('ADMIN')")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "${cors.allowed-origins}")
public class AdminSiteSettingController {
    
    private final SiteSettingService settingService;
    
    /**
     * GET /api/admin/settings - Get all settings
     */
    @GetMapping
    public ResponseEntity<List<SiteSetting>> getAllSettings() {
        log.info("Admin requesting all settings");
        List<SiteSetting> settings = settingService.getAllSettings();
        return ResponseEntity.ok(settings);
    }
    
    /**
     * GET /api/admin/settings/{key} - Get specific setting
     */
    @GetMapping("/{key}")
    public ResponseEntity<SiteSetting> getSetting(@PathVariable String key) {
        log.info("Admin requesting setting: {}", key);
        try {
            SiteSetting setting = settingService.getSetting(key);
            return ResponseEntity.ok(setting);
        } catch (SiteSettingService.SettingNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * PUT /api/admin/settings - Update settings in batch
     * Request body: { "key1": "value1", "key2": "value2", ... }
     * Response: { "key1": "SUCCESS", "key2": "ERROR: ...", ... }
     */
    @PutMapping
    public ResponseEntity<Map<String, String>> updateSettings(@RequestBody Map<String, String> updates) {
        log.info("Admin updating {} settings", updates.size());
        Map<String, String> results = settingService.updateSettings(updates);
        return ResponseEntity.ok(results);
    }
    
    /**
     * POST /api/admin/settings - Create new setting
     */
    @PostMapping
    public ResponseEntity<SiteSetting> createSetting(@RequestBody CreateSettingRequest request) {
        log.info("Admin creating new setting: {}", request.key());
        
        try {
            SiteSetting setting = settingService.createOrUpdateSetting(
                    request.key(),
                    request.value(),
                    request.type(),
                    request.isPublic(),
                    request.description()
            );
            return ResponseEntity.ok(setting);
        } catch (SiteSettingService.InvalidSettingValueException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Request DTO for creating settings
     */
    public record CreateSettingRequest(
            String key,
            String value,
            SiteSetting.SettingType type,
            boolean isPublic,
            String description
    ) {}
}

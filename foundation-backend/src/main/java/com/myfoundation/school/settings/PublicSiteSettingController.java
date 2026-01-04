package com.myfoundation.school.settings;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "${cors.allowed-origins}")
public class PublicSiteSettingController {
    
    private final SiteSettingService settingService;
    
    /**
     * GET /api/settings/public - Get public settings (no authentication required)
     * Only returns settings marked as isPublic=true
     */
    @GetMapping("/public")
    public ResponseEntity<Map<String, String>> getPublicSettings() {
        log.debug("Fetching public settings");
        Map<String, String> settings = settingService.getPublicSettings();
        return ResponseEntity.ok(settings);
    }
}

package com.myfoundation.school.home;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public/home")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "${cors.allowed-origins}")
public class PublicHomeSectionController {
    
    private final HomeSectionService sectionService;
    
    /**
     * GET /api/public/home - Get enabled home sections
     * Returns sections ordered by sort_order with their configuration
     */
    @GetMapping
    public ResponseEntity<List<HomeSectionDto>> getHomeSections() {
        log.debug("Public API: Fetching enabled home sections");
        List<HomeSectionDto> sections = sectionService.getEnabledSections();
        return ResponseEntity.ok(sections);
    }
}

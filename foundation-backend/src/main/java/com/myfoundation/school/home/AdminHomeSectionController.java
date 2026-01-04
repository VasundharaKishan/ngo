package com.myfoundation.school.home;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/home/sections")
@PreAuthorize("hasAuthority('ADMIN')")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "${cors.allowed-origins}")
public class AdminHomeSectionController {
    
    private final HomeSectionService sectionService;
    
    /**
     * GET /api/admin/home/sections - Get all home sections (admin only)
     * Returns all sections ordered by sort_order
     */
    @GetMapping
    public ResponseEntity<List<HomeSectionDto>> getAllSections() {
        log.info("Admin requesting all home sections");
        List<HomeSectionDto> sections = sectionService.getAllSections();
        return ResponseEntity.ok(sections);
    }
    
    /**
     * GET /api/admin/home/sections/{id} - Get specific section
     */
    @GetMapping("/{id}")
    public ResponseEntity<HomeSectionDto> getSectionById(@PathVariable UUID id) {
        log.info("Admin requesting home section: {}", id);
        try {
            HomeSectionDto section = sectionService.getSectionById(id);
            return ResponseEntity.ok(section);
        } catch (HomeSectionService.SectionNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * PUT /api/admin/home/sections - Update sections (order, enabled, config)
     * Request body: array of section updates
     * 
     * Example:
     * [
     *   {
     *     "id": "uuid",
     *     "enabled": true,
     *     "sortOrder": 1,
     *     "config": {"title": "Featured Campaigns", "limit": 3}
     *   }
     * ]
     */
    @PutMapping
    public ResponseEntity<List<HomeSectionDto>> updateSections(
            @RequestBody List<HomeSectionUpdateDto> updates) {
        log.info("Admin updating {} home sections", updates.size());
        
        try {
            List<HomeSectionDto> updatedSections = sectionService.updateSections(updates);
            return ResponseEntity.ok(updatedSections);
        } catch (HomeSectionService.SectionNotFoundException e) {
            log.error("Section not found during update", e);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error updating home sections", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}

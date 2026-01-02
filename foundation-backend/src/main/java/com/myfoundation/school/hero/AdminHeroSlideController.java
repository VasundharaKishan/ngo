package com.myfoundation.school.hero;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/hero-slides")
@PreAuthorize("hasAuthority('ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class AdminHeroSlideController {
    
    private final HeroSlideService heroSlideService;
    
    /**
     * GET /api/admin/hero-slides
     * Get all hero slides (including disabled) ordered by sort order
     */
    @GetMapping
    public ResponseEntity<List<HeroSlide>> getAllSlides() {
        log.info("Admin fetching all hero slides");
        List<HeroSlide> slides = heroSlideService.getAllSlides();
        return ResponseEntity.ok(slides);
    }
    
    /**
     * GET /api/admin/hero-slides/{id}
     * Get a single hero slide by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<HeroSlide> getSlideById(@PathVariable UUID id) {
        log.info("Admin fetching hero slide: {}", id);
        HeroSlide slide = heroSlideService.getSlideById(id);
        return ResponseEntity.ok(slide);
    }
    
    /**
     * POST /api/admin/hero-slides
     * Create a new hero slide
     */
    @PostMapping
    public ResponseEntity<HeroSlide> createSlide(@RequestBody HeroSlide slide) {
        log.info("Admin creating new hero slide: {}", slide.getAltText());
        HeroSlide created = heroSlideService.createSlide(slide);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    /**
     * PUT /api/admin/hero-slides/{id}
     * Update an existing hero slide
     */
    @PutMapping("/{id}")
    public ResponseEntity<HeroSlide> updateSlide(
            @PathVariable UUID id,
            @RequestBody HeroSlide slide) {
        log.info("Admin updating hero slide: {}", id);
        HeroSlide updated = heroSlideService.updateSlide(id, slide);
        return ResponseEntity.ok(updated);
    }
    
    /**
     * DELETE /api/admin/hero-slides/{id}
     * Delete a hero slide
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSlide(@PathVariable UUID id) {
        log.info("Admin deleting hero slide: {}", id);
        heroSlideService.deleteSlide(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * PUT /api/admin/hero-slides/reorder
     * Reorder hero slides (bulk update sort orders)
     */
    @PutMapping("/reorder")
    public ResponseEntity<List<HeroSlide>> reorderSlides(
            @RequestBody List<HeroSlideService.ReorderRequest> reorderRequests) {
        log.info("Admin reordering {} hero slides", reorderRequests.size());
        List<HeroSlide> updated = heroSlideService.reorderSlides(reorderRequests);
        return ResponseEntity.ok(updated);
    }
}

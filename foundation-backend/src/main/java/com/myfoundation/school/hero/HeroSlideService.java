package com.myfoundation.school.hero;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class HeroSlideService {
    
    private final HeroSlideRepository repository;
    
    /**
     * Get all enabled slides ordered by sort order (for public display)
     */
    @Transactional(readOnly = true)
    public List<HeroSlide> getEnabledSlides() {
        return repository.findByEnabledTrueOrderBySortOrder();
    }
    
    /**
     * Get all slides ordered by sort order (for admin)
     */
    @Transactional(readOnly = true)
    public List<HeroSlide> getAllSlides() {
        return repository.findAllByOrderBySortOrder();
    }
    
    /**
     * Get a single slide by ID
     */
    @Transactional(readOnly = true)
    public HeroSlide getSlideById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Hero slide not found: " + id));
    }
    
    /**
     * Create a new slide
     */
    @Transactional
    public HeroSlide createSlide(HeroSlide slide) {
        log.info("Creating new hero slide: {}", slide.getAltText());
        return repository.save(slide);
    }
    
    /**
     * Update an existing slide
     */
    @Transactional
    public HeroSlide updateSlide(UUID id, HeroSlide updatedSlide) {
        HeroSlide existing = getSlideById(id);
        
        existing.setImageUrl(updatedSlide.getImageUrl());
        existing.setAltText(updatedSlide.getAltText());
        existing.setFocus(updatedSlide.getFocus());
        existing.setEnabled(updatedSlide.isEnabled());
        existing.setSortOrder(updatedSlide.getSortOrder());
        
        log.info("Updated hero slide: {}", id);
        return repository.save(existing);
    }
    
    /**
     * Delete a slide
     */
    @Transactional
    public void deleteSlide(UUID id) {
        HeroSlide slide = getSlideById(id);
        log.info("Deleting hero slide: {} ({})", id, slide.getAltText());
        repository.delete(slide);
    }
    
    /**
     * Reorder slides (bulk update sort orders)
     */
    @Transactional
    public List<HeroSlide> reorderSlides(List<ReorderRequest> reorderRequests) {
        log.info("Reordering {} hero slides", reorderRequests.size());
        
        for (ReorderRequest request : reorderRequests) {
            HeroSlide slide = getSlideById(request.id());
            slide.setSortOrder(request.sortOrder());
            repository.save(slide);
        }
        
        return getAllSlides();
    }
    
    /**
     * Request DTO for reordering slides
     */
    public record ReorderRequest(UUID id, int sortOrder) {}
}

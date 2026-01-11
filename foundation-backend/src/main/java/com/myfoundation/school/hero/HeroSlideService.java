package com.myfoundation.school.hero;

import com.myfoundation.school.exception.ResourceNotFoundException;
import com.myfoundation.school.exception.ValidationException;
import com.myfoundation.school.validation.ValidationUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class HeroSlideService {
    
    private final HeroSlideRepository repository;
    
    /**
     * Get all enabled, non-deleted slides ordered by sort order (for public display)
     */
    @Transactional(readOnly = true)
    public List<HeroSlide> getEnabledSlides() {
        return repository.findByEnabledTrueAndDeletedFalseOrderBySortOrder();
    }
    
    /**
     * Get all non-deleted slides ordered by sort order (for admin)
     */
    @Transactional(readOnly = true)
    public List<HeroSlide> getAllSlides() {
        return repository.findByDeletedFalseOrderBySortOrder();
    }
    
    /**
     * Get a single non-deleted slide by ID
     */
    @Transactional(readOnly = true)
    public HeroSlide getSlideById(UUID id) {
        return repository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hero slide", id.toString()));
    }
    
    /**
     * Create a new slide with validation
     */
    @Transactional
    public HeroSlide createSlide(HeroSlide slide) {
        validateSlide(slide);
        log.info("Creating new hero slide: {}", slide.getAltText());
        return repository.save(slide);
    }
    
    /**
     * Update an existing slide with validation
     */
    @Transactional
    public HeroSlide updateSlide(UUID id, HeroSlide updatedSlide) {
        HeroSlide existing = getSlideById(id);
        
        validateSlide(updatedSlide);
        
        existing.setImageUrl(updatedSlide.getImageUrl());
        existing.setAltText(updatedSlide.getAltText());
        existing.setFocus(updatedSlide.getFocus());
        existing.setEnabled(updatedSlide.isEnabled());
        existing.setSortOrder(updatedSlide.getSortOrder());
        
        log.info("Updated hero slide: {}", id);
        return repository.save(existing);
    }
    
    /**
     * Soft delete a slide
     */
    @Transactional
    public void deleteSlide(UUID id) {
        HeroSlide slide = getSlideById(id);
        slide.setDeleted(true);
        slide.setDeletedAt(Instant.now());
        repository.save(slide);
        log.info("Soft deleted hero slide: {} ({})", id, slide.getAltText());
    }
    
    /**
     * Reorder slides (bulk update sort orders) with validation
     */
    @Transactional
    public List<HeroSlide> reorderSlides(List<ReorderRequest> reorderRequests) {
        log.info("Reordering {} hero slides", reorderRequests.size());
        
        // Validate all slides exist before making any changes
        Set<UUID> slideIds = new HashSet<>();
        for (ReorderRequest request : reorderRequests) {
            if (!repository.findByIdAndDeletedFalse(request.id()).isPresent()) {
                throw new ResourceNotFoundException("Hero slide", request.id().toString());
            }
            
            // Validate sortOrder
            if (request.sortOrder() < 0) {
                throw new ValidationException(
                    "Sort order must be non-negative, got: " + request.sortOrder()
                );
            }
            
            // Check for duplicate IDs in request
            if (!slideIds.add(request.id())) {
                throw new ValidationException(
                    "Duplicate slide ID in reorder request: " + request.id()
                );
            }
        }
        
        // All validation passed, now update
        for (ReorderRequest request : reorderRequests) {
            HeroSlide slide = getSlideById(request.id());
            slide.setSortOrder(request.sortOrder());
            repository.save(slide);
        }
        
        return getAllSlides();
    }
    
    /**
     * Validate hero slide data
     */
    private void validateSlide(HeroSlide slide) {
        // Validate imageUrl
        if (!ValidationUtils.isValidUrl(slide.getImageUrl())) {
            throw new ValidationException(
                "Invalid image URL format: " + slide.getImageUrl()
            );
        }
        
        // Validate altText (required for WCAG accessibility)
        if (!ValidationUtils.isNotBlank(slide.getAltText())) {
            throw new ValidationException(
                "Alt text is required for accessibility (WCAG compliance)"
            );
        }
        
        if (slide.getAltText().trim().length() < 3) {
            throw new ValidationException(
                "Alt text must be at least 3 characters long"
            );
        }
        
        // Validate sortOrder
        if (slide.getSortOrder() < 0) {
            throw new ValidationException(
                "Sort order must be non-negative, got: " + slide.getSortOrder()
            );
        }
    }
    
    /**
     * Request DTO for reordering slides
     */
    public record ReorderRequest(UUID id, int sortOrder) {}
}

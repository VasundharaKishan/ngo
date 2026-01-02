package com.myfoundation.school.home;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class HomeSectionService {
    
    private final HomeSectionRepository repository;
    
    /**
     * Get all enabled sections ordered by sort_order (public API)
     */
    public List<HomeSectionDto> getEnabledSections() {
        log.debug("Fetching enabled home sections");
        return repository.findByEnabledTrueOrderBySortOrderAsc().stream()
                .map(this::toDto)
                .toList();
    }
    
    /**
     * Get all sections ordered by sort_order (admin API)
     */
    public List<HomeSectionDto> getAllSections() {
        log.debug("Fetching all home sections");
        return repository.findAllByOrderBySortOrderAsc().stream()
                .map(this::toDto)
                .toList();
    }
    
    /**
     * Update sections (order, enabled status, config)
     */
    @Transactional
    public List<HomeSectionDto> updateSections(List<HomeSectionUpdateDto> updates) {
        log.info("Updating {} home sections", updates.size());
        
        for (HomeSectionUpdateDto update : updates) {
            HomeSection section = repository.findById(update.getId())
                    .orElseThrow(() -> new SectionNotFoundException("Section not found: " + update.getId()));
            
            section.setEnabled(update.isEnabled());
            section.setSortOrder(update.getSortOrder());
            
            if (update.getConfig() != null) {
                section.setConfigMap(update.getConfig());
            }
            
            repository.save(section);
            log.debug("Updated section: {} (order: {}, enabled: {})", 
                    section.getType(), section.getSortOrder(), section.isEnabled());
        }
        
        return getAllSections();
    }
    
    /**
     * Get single section by ID
     */
    public HomeSectionDto getSectionById(UUID id) {
        return repository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new SectionNotFoundException("Section not found: " + id));
    }
    
    /**
     * Convert entity to DTO
     */
    private HomeSectionDto toDto(HomeSection section) {
        return HomeSectionDto.builder()
                .id(section.getId())
                .type(section.getType())
                .enabled(section.isEnabled())
                .sortOrder(section.getSortOrder())
                .config(section.getConfigMap())
                .createdAt(section.getCreatedAt())
                .updatedAt(section.getUpdatedAt())
                .build();
    }
    
    // Custom exception
    public static class SectionNotFoundException extends RuntimeException {
        public SectionNotFoundException(String message) {
            super(message);
        }
    }
}

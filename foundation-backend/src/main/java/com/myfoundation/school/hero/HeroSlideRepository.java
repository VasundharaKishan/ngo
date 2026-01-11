package com.myfoundation.school.hero;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HeroSlideRepository extends JpaRepository<HeroSlide, UUID> {
    
    /**
     * Find all enabled, non-deleted slides ordered by sort order
     */
    List<HeroSlide> findByEnabledTrueAndDeletedFalseOrderBySortOrder();
    
    /**
     * Find all non-deleted slides ordered by sort order (for admin)
     */
    List<HeroSlide> findByDeletedFalseOrderBySortOrder();
    
    /**
     * Find non-deleted slide by ID
     */
    Optional<HeroSlide> findByIdAndDeletedFalse(UUID id);
}

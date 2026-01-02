package com.myfoundation.school.hero;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface HeroSlideRepository extends JpaRepository<HeroSlide, UUID> {
    
    /**
     * Find all enabled slides ordered by sort order
     */
    List<HeroSlide> findByEnabledTrueOrderBySortOrder();
    
    /**
     * Find all slides ordered by sort order (for admin)
     */
    List<HeroSlide> findAllByOrderBySortOrder();
}

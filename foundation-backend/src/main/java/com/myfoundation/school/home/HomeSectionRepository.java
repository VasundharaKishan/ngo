package com.myfoundation.school.home;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface HomeSectionRepository extends JpaRepository<HomeSection, UUID> {
    
    /**
     * Find all enabled sections ordered by sort_order
     */
    List<HomeSection> findByEnabledTrueOrderBySortOrderAsc();
    
    /**
     * Find all sections ordered by sort_order (for admin)
     */
    List<HomeSection> findAllByOrderBySortOrderAsc();
}

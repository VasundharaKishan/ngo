package com.myfoundation.school.campaign;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CampaignRepository extends JpaRepository<Campaign, String> {
    
    List<Campaign> findByActiveTrue();
    Page<Campaign> findByActiveTrue(Pageable pageable);

    List<Campaign> findByActiveTrueAndCategoryId(String categoryId);
    Page<Campaign> findByActiveTrueAndCategoryId(String categoryId, Pageable pageable);

    List<Campaign> findByActiveTrueAndFeaturedTrue();
    Page<Campaign> findByActiveTrueAndFeaturedTrue(Pageable pageable);

    List<Campaign> findByActiveTrueAndUrgentTrue();
    Page<Campaign> findByActiveTrueAndUrgentTrue(Pageable pageable);
    
    Optional<Campaign> findBySlug(String slug);
    
    @Query("SELECT c FROM Campaign c WHERE c.active = true ORDER BY c.featured DESC, c.urgent DESC, c.updatedAt DESC")
    List<Campaign> findActiveCampaignsForPopup(Pageable pageable);
}

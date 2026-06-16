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
    long countByActiveTrue();

    List<Campaign> findByActiveTrueAndCategoryId(String categoryId);
    Page<Campaign> findByActiveTrueAndCategoryId(String categoryId, Pageable pageable);

    List<Campaign> findByActiveTrueAndFeaturedTrue();
    Page<Campaign> findByActiveTrueAndFeaturedTrue(Pageable pageable);

    List<Campaign> findByActiveTrueAndUrgentTrue();
    Page<Campaign> findByActiveTrueAndUrgentTrue(Pageable pageable);
    
    Optional<Campaign> findBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, String id);

    @Query("SELECT c FROM Campaign c WHERE c.active = true " +
           "AND (LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(c.shortDescription) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Campaign> searchActiveByKeyword(@org.springframework.data.repository.query.Param("search") String search);

    @Query("SELECT c FROM Campaign c WHERE c.active = true " +
           "AND (LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(c.shortDescription) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Campaign> searchActiveByKeyword(@org.springframework.data.repository.query.Param("search") String search, Pageable pageable);

    @Query("SELECT c FROM Campaign c WHERE c.active = true ORDER BY c.featured DESC, c.urgent DESC, c.updatedAt DESC")
    List<Campaign> findActiveCampaignsForPopup(Pageable pageable);
}

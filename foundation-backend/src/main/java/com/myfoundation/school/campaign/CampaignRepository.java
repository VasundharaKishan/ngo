package com.myfoundation.school.campaign;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CampaignRepository extends JpaRepository<Campaign, String> {
    
    List<Campaign> findByActiveTrue();
    
    List<Campaign> findByActiveTrueAndCategoryId(String categoryId);
    
    List<Campaign> findByActiveTrueAndFeaturedTrue();
    
    List<Campaign> findByActiveTrueAndUrgentTrue();
    
    Optional<Campaign> findBySlug(String slug);
}

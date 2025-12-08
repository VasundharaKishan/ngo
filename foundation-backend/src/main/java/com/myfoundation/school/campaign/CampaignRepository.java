package com.myfoundation.school.campaign;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CampaignRepository extends JpaRepository<Campaign, String> {
    
    List<Campaign> findByActiveTrue();
    
    Optional<Campaign> findBySlug(String slug);
}

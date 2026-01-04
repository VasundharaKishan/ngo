package com.myfoundation.school.footer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for FooterSettings entity.
 * Provides database access operations for footer configuration.
 */
@Repository
public interface FooterSettingsRepository extends JpaRepository<FooterSettings, UUID> {
    
    /**
     * Find the first footer settings record.
     * Since we only maintain one configuration, this returns the active config.
     */
    Optional<FooterSettings> findFirstByOrderByCreatedAtAsc();
}

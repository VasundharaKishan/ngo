package com.myfoundation.school.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditLogRepository extends JpaRepository<AuditLog, String> {
    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:action IS NULL OR a.action = :action) AND " +
           "(:actor IS NULL OR a.actorUsername = :actor) AND " +
           "(:entityType IS NULL OR a.entityType = :entityType) " +
           "ORDER BY a.timestamp DESC")
    Page<AuditLog> findFiltered(
        @Param("action") AuditAction action,
        @Param("actor") String actor,
        @Param("entityType") String entityType,
        Pageable pageable
    );
}

package com.myfoundation.school.contact;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;

public interface ContactSubmissionRepository extends JpaRepository<ContactSubmission, Long> {

    /** Admin listing — newest first. */
    List<ContactSubmission> findAllByOrderByCreatedAtDesc();

    /** Admin listing filtered by status. */
    List<ContactSubmission> findByStatusOrderByCreatedAtDesc(String status);

    /** Per-IP flood check: how many submissions from this IP since the given instant? */
    @Query("SELECT COUNT(c) FROM ContactSubmission c WHERE c.clientIp = :ip AND c.createdAt >= :since")
    long countByClientIpSince(String ip, Instant since);
}

package com.myfoundation.school.webhook;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StripeEventRecordRepository extends JpaRepository<StripeEventRecord, String> {
    boolean existsByEventId(String eventId);
    void deleteByReceivedAtBefore(java.time.Instant cutoff);
}

package com.myfoundation.school.webhook;

import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StripeEventRecordService {

    private static final long TTL_SECONDS = 48 * 60 * 60;

    private final StripeEventRecordRepository repository;

    @Transactional
    public boolean isReplayAndRecord(String eventId) {
        if (eventId == null || eventId.isBlank()) {
            return false;
        }
        if (repository.existsByEventId(eventId)) {
            return true;
        }
        StripeEventRecord record = new StripeEventRecord();
        record.setEventId(eventId);
        record.setReceivedAt(Instant.now());
        repository.save(record);

        cleanupOld();
        return false;
    }

    private void cleanupOld() {
        Instant cutoff = Instant.now().minusSeconds(TTL_SECONDS);
        repository.deleteByReceivedAtBefore(cutoff);
    }
}

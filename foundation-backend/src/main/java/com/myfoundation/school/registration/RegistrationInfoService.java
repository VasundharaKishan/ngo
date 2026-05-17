package com.myfoundation.school.registration;

import com.myfoundation.school.audit.AuditAction;
import com.myfoundation.school.audit.AuditLogService;
import com.myfoundation.school.registration.dto.RegistrationInfoUpdateRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Reads and writes the single-row {@link RegistrationInfo} record.
 *
 * <p>All writes are audit-logged. Reads are cheap and go direct to the repository; if this
 * becomes a hot path (public endpoint), add a {@code @Cacheable} or in-memory cache with
 * invalidation on update.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RegistrationInfoService {

    private final RegistrationInfoRepository repository;
    private final AuditLogService auditLogService;

    /**
     * Returns the single registration-info row. If it is somehow missing (e.g. the seed
     * migration has not run yet in dev), a transient default in UNREGISTERED is returned so
     * the public site can still render — but no row is persisted here.
     */
    @Transactional(readOnly = true)
    public RegistrationInfo getCurrent() {
        return repository.findById(RegistrationInfo.SINGLETON_ID)
                .orElseGet(() -> RegistrationInfo.builder()
                        .id(RegistrationInfo.SINGLETON_ID)
                        .status(RegistrationStatus.UNREGISTERED)
                        .updatedAt(Instant.now())
                        .updatedBy("system")
                        .build());
    }

    /**
     * Apply an admin update. Values for certificate-bound fields (80G, FCRA, Section 8) are
     * cleared when {@code status != APPROVED} to keep the public API honest.
     */
    @Transactional
    public RegistrationInfo update(RegistrationInfoUpdateRequest request) {
        String updatedBy = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("Updating registration info: status={} by user={}", request.status(), updatedBy);

        RegistrationInfo current = repository.findById(RegistrationInfo.SINGLETON_ID)
                .orElseGet(() -> RegistrationInfo.builder()
                        .id(RegistrationInfo.SINGLETON_ID)
                        .status(RegistrationStatus.UNREGISTERED)
                        .build());

        RegistrationStatus previousStatus = current.getStatus();

        current.setStatus(request.status());
        current.setRegistrationNumber(trimToNull(request.registrationNumber()));
        current.setPanNumber(trimToNull(request.panNumber()));
        current.setAppliedDate(request.appliedDate());
        current.setApprovedDate(request.approvedDate());
        current.setDisclosureOverride(trimToNull(request.disclosureOverride()));

        // Certificate-bound fields are only meaningful when APPROVED.
        // Silently clear them otherwise — defence in depth against stale numbers leaking to public.
        if (request.status() == RegistrationStatus.APPROVED) {
            current.setSection8Number(trimToNull(request.section8Number()));
            current.setEightyGNumber(trimToNull(request.eightyGNumber()));
            current.setFcraNumber(trimToNull(request.fcraNumber()));
        } else {
            current.setSection8Number(null);
            current.setEightyGNumber(null);
            current.setFcraNumber(null);
        }

        current.setUpdatedAt(Instant.now());
        current.setUpdatedBy(updatedBy);

        RegistrationInfo saved = repository.save(current);

        auditLogService.log(
                AuditAction.SETTINGS_UPDATED,
                "RegistrationInfo",
                String.valueOf(saved.getId()),
                updatedBy,
                String.format("status %s -> %s",
                        previousStatus != null ? previousStatus.name() : "NONE",
                        saved.getStatus().name())
        );

        return saved;
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}

package com.myfoundation.school.trustbadge;

import com.myfoundation.school.audit.AuditAction;
import com.myfoundation.school.audit.AuditLogService;
import com.myfoundation.school.registration.RegistrationInfoService;
import com.myfoundation.school.registration.RegistrationStatus;
import com.myfoundation.school.trustbadge.dto.TrustBadgeReorderRequest;
import com.myfoundation.school.trustbadge.dto.TrustBadgeUpsertRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Admin CRUD + public read for {@link TrustBadge}.
 *
 * <p>Public reads strip disabled rows AND any rows marked {@code registrationGated} whenever
 * the RegistrationInfo singleton is not {@link RegistrationStatus#APPROVED}. This is
 * defence-in-depth: the admin UI also surfaces the gate, but the server is the source of
 * truth so callers can never receive a "Registered NGO" card while the org is still
 * UNREGISTERED or APPLIED.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TrustBadgeService {

    private final TrustBadgeRepository repository;
    private final RegistrationInfoService registrationInfoService;
    private final AuditLogService auditLogService;

    // --- reads -----------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<TrustBadge> listAll() {
        return repository.findAllByOrderBySortOrderAscIdAsc();
    }

    /**
     * Public list with enabled + registration-gating applied. Safe to render directly.
     */
    @Transactional(readOnly = true)
    public List<TrustBadge> listForPublic() {
        boolean approved = registrationInfoService.getCurrent().getStatus() == RegistrationStatus.APPROVED;
        return repository.findAllByOrderBySortOrderAscIdAsc().stream()
                .filter(TrustBadge::isEnabled)
                .filter(b -> !b.isRegistrationGated() || approved)
                .toList();
    }

    // --- writes ----------------------------------------------------------------

    @Transactional
    public TrustBadge create(TrustBadgeUpsertRequest request) {
        String actor = currentUser();
        if (request.slotKey() == null || request.slotKey().isBlank()) {
            throw new IllegalArgumentException("slotKey is required on create");
        }
        repository.findBySlotKey(request.slotKey()).ifPresent(existing -> {
            throw new IllegalArgumentException("Trust badge with slot_key '" + request.slotKey() + "' already exists");
        });

        TrustBadge badge = TrustBadge.builder()
                .slotKey(request.slotKey().trim())
                .iconEmoji(request.iconEmoji().trim())
                .title(request.title().trim())
                .description(request.description().trim())
                .enabled(request.enabled())
                .showInStrip(request.showInStrip())
                .showInGrid(request.showInGrid())
                .registrationGated(request.registrationGated())
                .sortOrder(request.sortOrder())
                .updatedAt(Instant.now())
                .updatedBy(actor)
                .build();

        TrustBadge saved = repository.save(badge);
        auditLogService.log(AuditAction.SETTINGS_UPDATED, "TrustBadge",
                String.valueOf(saved.getId()), actor,
                "created trust badge '" + saved.getSlotKey() + "'");
        return saved;
    }

    @Transactional
    public TrustBadge update(Long id, TrustBadgeUpsertRequest request) {
        String actor = currentUser();
        TrustBadge badge = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Trust badge not found: " + id));

        // slotKey is immutable after creation — we ignore request.slotKey() here.
        badge.setIconEmoji(request.iconEmoji().trim());
        badge.setTitle(request.title().trim());
        badge.setDescription(request.description().trim());
        badge.setEnabled(request.enabled());
        badge.setShowInStrip(request.showInStrip());
        badge.setShowInGrid(request.showInGrid());
        badge.setRegistrationGated(request.registrationGated());
        badge.setSortOrder(request.sortOrder());
        badge.setUpdatedAt(Instant.now());
        badge.setUpdatedBy(actor);

        TrustBadge saved = repository.save(badge);
        auditLogService.log(AuditAction.SETTINGS_UPDATED, "TrustBadge",
                String.valueOf(saved.getId()), actor,
                "updated trust badge '" + saved.getSlotKey() + "' (enabled=" + saved.isEnabled() + ")");
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        String actor = currentUser();
        TrustBadge badge = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Trust badge not found: " + id));
        repository.delete(badge);
        auditLogService.log(AuditAction.SETTINGS_UPDATED, "TrustBadge",
                String.valueOf(id), actor,
                "deleted trust badge '" + badge.getSlotKey() + "'");
    }

    /**
     * Assigns contiguous 10-step {@code sort_order} values based on the order of IDs in
     * the request. IDs missing from {@code orderedIds} keep their previous sort_order —
     * which is fine because they sort after the reordered items numerically.
     */
    @Transactional
    public List<TrustBadge> reorder(TrustBadgeReorderRequest request) {
        String actor = currentUser();
        List<TrustBadge> all = repository.findAll();
        Map<Long, TrustBadge> byId = new HashMap<>();
        for (TrustBadge b : all) {
            byId.put(b.getId(), b);
        }
        int pos = 10;
        for (Long id : request.orderedIds()) {
            TrustBadge b = byId.get(id);
            if (b == null) {
                throw new EntityNotFoundException("Trust badge not found: " + id);
            }
            b.setSortOrder(pos);
            b.setUpdatedAt(Instant.now());
            b.setUpdatedBy(actor);
            pos += 10;
        }
        List<TrustBadge> saved = repository.saveAll(all);
        auditLogService.log(AuditAction.SETTINGS_UPDATED, "TrustBadge",
                "reorder", actor,
                "reordered trust badges: " + request.orderedIds());
        return saved.stream()
                .sorted((a, b) -> Integer.compare(a.getSortOrder(), b.getSortOrder()))
                .toList();
    }

    private static String currentUser() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}

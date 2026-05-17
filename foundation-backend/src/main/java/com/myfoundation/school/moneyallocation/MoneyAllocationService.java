package com.myfoundation.school.moneyallocation;

import com.myfoundation.school.audit.AuditAction;
import com.myfoundation.school.audit.AuditLogService;
import com.myfoundation.school.moneyallocation.dto.MoneyAllocationReorderRequest;
import com.myfoundation.school.moneyallocation.dto.MoneyAllocationUpsertRequest;
import com.myfoundation.school.registration.RegistrationInfoService;
import com.myfoundation.school.registration.RegistrationStatus;
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
 * Admin CRUD + gated public read for {@link MoneyAllocation}.
 *
 * <p>The "Where your money goes" block is a financial disclosure, so the public read
 * path returns an empty list whenever registration is not {@link RegistrationStatus#APPROVED}
 * — defence-in-depth, regardless of whether the admin happened to toggle the
 * home-section on. Admin reads are always unfiltered so operators can stage content
 * before the foundation is registered.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MoneyAllocationService {

    private final MoneyAllocationRepository repository;
    private final RegistrationInfoService registrationInfoService;
    private final AuditLogService auditLogService;

    // --- reads -----------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<MoneyAllocation> listAll() {
        return repository.findAllByOrderBySortOrderAscIdAsc();
    }

    /**
     * Public list — enabled rows only, AND only when registration is APPROVED.
     * Returns an empty list for visitors whenever the foundation is UNREGISTERED
     * or APPLIED, so allocation percentages can never leak pre-approval.
     */
    @Transactional(readOnly = true)
    public List<MoneyAllocation> listForPublic() {
        boolean approved = registrationInfoService.getCurrent().getStatus() == RegistrationStatus.APPROVED;
        if (!approved) return List.of();
        return repository.findByEnabledTrueOrderBySortOrderAscIdAsc();
    }

    /** True if visitors would currently see the disclosure (used for 204 shortcut in controller). */
    @Transactional(readOnly = true)
    public boolean isDisclosed() {
        return registrationInfoService.getCurrent().getStatus() == RegistrationStatus.APPROVED;
    }

    // --- writes ----------------------------------------------------------------

    @Transactional
    public MoneyAllocation create(MoneyAllocationUpsertRequest request) {
        String actor = currentUser();
        MoneyAllocation row = MoneyAllocation.builder()
                .iconEmoji(request.iconEmoji().trim())
                .label(request.label().trim())
                .percentage(request.percentage())
                .description(normaliseDescription(request.description()))
                .colorHex(request.colorHex().trim())
                .enabled(request.enabled())
                .sortOrder(request.sortOrder())
                .updatedAt(Instant.now())
                .updatedBy(actor)
                .build();

        MoneyAllocation saved = repository.save(row);
        auditLogService.log(AuditAction.SETTINGS_UPDATED, "MoneyAllocation",
                String.valueOf(saved.getId()), actor,
                "created money allocation '" + saved.getLabel() + "' at " + saved.getPercentage() + "%");
        return saved;
    }

    @Transactional
    public MoneyAllocation update(Long id, MoneyAllocationUpsertRequest request) {
        String actor = currentUser();
        MoneyAllocation row = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Money allocation not found: " + id));

        row.setIconEmoji(request.iconEmoji().trim());
        row.setLabel(request.label().trim());
        row.setPercentage(request.percentage());
        row.setDescription(normaliseDescription(request.description()));
        row.setColorHex(request.colorHex().trim());
        row.setEnabled(request.enabled());
        row.setSortOrder(request.sortOrder());
        row.setUpdatedAt(Instant.now());
        row.setUpdatedBy(actor);

        MoneyAllocation saved = repository.save(row);
        auditLogService.log(AuditAction.SETTINGS_UPDATED, "MoneyAllocation",
                String.valueOf(saved.getId()), actor,
                "updated money allocation '" + saved.getLabel() + "' to " + saved.getPercentage()
                        + "% (enabled=" + saved.isEnabled() + ")");
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        String actor = currentUser();
        MoneyAllocation row = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Money allocation not found: " + id));
        repository.delete(row);
        auditLogService.log(AuditAction.SETTINGS_UPDATED, "MoneyAllocation",
                String.valueOf(id), actor,
                "deleted money allocation '" + row.getLabel() + "'");
    }

    /** See {@code TrustBadgeService.reorder} for the positional sort_order strategy. */
    @Transactional
    public List<MoneyAllocation> reorder(MoneyAllocationReorderRequest request) {
        String actor = currentUser();
        List<MoneyAllocation> all = repository.findAll();
        Map<Long, MoneyAllocation> byId = new HashMap<>();
        for (MoneyAllocation m : all) {
            byId.put(m.getId(), m);
        }
        int pos = 10;
        for (Long id : request.orderedIds()) {
            MoneyAllocation m = byId.get(id);
            if (m == null) {
                throw new EntityNotFoundException("Money allocation not found: " + id);
            }
            m.setSortOrder(pos);
            m.setUpdatedAt(Instant.now());
            m.setUpdatedBy(actor);
            pos += 10;
        }
        List<MoneyAllocation> saved = repository.saveAll(all);
        auditLogService.log(AuditAction.SETTINGS_UPDATED, "MoneyAllocation",
                "reorder", actor,
                "reordered money allocations: " + request.orderedIds());
        return saved.stream()
                .sorted((a, b) -> Integer.compare(a.getSortOrder(), b.getSortOrder()))
                .toList();
    }

    private static String normaliseDescription(String description) {
        if (description == null) return null;
        String trimmed = description.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String currentUser() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}

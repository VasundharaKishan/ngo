package com.myfoundation.school.donationpreset;

import com.myfoundation.school.audit.AuditAction;
import com.myfoundation.school.audit.AuditLogService;
import com.myfoundation.school.donationpreset.dto.DonationPresetReorderRequest;
import com.myfoundation.school.donationpreset.dto.DonationPresetUpsertRequest;
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
 * Admin CRUD + public read for {@link DonationPreset}.
 *
 * <p>The public list returns enabled rows only. The "default" designation is promoted
 * through a dedicated {@link #setDefault(Long)} method which clears any existing default
 * in the same transaction — the single-default invariant is a server-enforced rule rather
 * than a DB constraint, so all mutating paths route through here.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DonationPresetService {

    private final DonationPresetRepository repository;
    private final AuditLogService auditLogService;

    // --- reads -----------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<DonationPreset> listAll() {
        return repository.findAllByOrderBySortOrderAscIdAsc();
    }

    /** Public list — enabled rows only, already sorted. */
    @Transactional(readOnly = true)
    public List<DonationPreset> listForPublic() {
        return repository.findByEnabledTrueOrderBySortOrderAscIdAsc();
    }

    // --- writes ----------------------------------------------------------------

    @Transactional
    public DonationPreset create(DonationPresetUpsertRequest request) {
        String actor = currentUser();
        DonationPreset preset = DonationPreset.builder()
                .amountMinorUnits(request.amountMinorUnits())
                .label(normaliseLabel(request.label()))
                .enabled(request.enabled())
                .isDefault(false) // defaults are promoted via setDefault()
                .sortOrder(request.sortOrder())
                .updatedAt(Instant.now())
                .updatedBy(actor)
                .build();

        DonationPreset saved = repository.save(preset);
        auditLogService.log(AuditAction.SETTINGS_UPDATED, "DonationPreset",
                String.valueOf(saved.getId()), actor,
                "created donation preset amount=" + saved.getAmountMinorUnits() + " paise");
        return saved;
    }

    @Transactional
    public DonationPreset update(Long id, DonationPresetUpsertRequest request) {
        String actor = currentUser();
        DonationPreset preset = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Donation preset not found: " + id));

        preset.setAmountMinorUnits(request.amountMinorUnits());
        preset.setLabel(normaliseLabel(request.label()));
        preset.setEnabled(request.enabled());
        preset.setSortOrder(request.sortOrder());
        preset.setUpdatedAt(Instant.now());
        preset.setUpdatedBy(actor);

        // If the admin disables the current default, clear it — we don't want a
        // hidden default still winning on the public form.
        if (!preset.isEnabled() && preset.isDefault()) {
            preset.setDefault(false);
        }

        DonationPreset saved = repository.save(preset);
        auditLogService.log(AuditAction.SETTINGS_UPDATED, "DonationPreset",
                String.valueOf(saved.getId()), actor,
                "updated donation preset amount=" + saved.getAmountMinorUnits()
                        + " paise enabled=" + saved.isEnabled());
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        String actor = currentUser();
        DonationPreset preset = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Donation preset not found: " + id));
        repository.delete(preset);
        auditLogService.log(AuditAction.SETTINGS_UPDATED, "DonationPreset",
                String.valueOf(id), actor,
                "deleted donation preset amount=" + preset.getAmountMinorUnits() + " paise");
    }

    /**
     * Promote a single preset to default, clearing any previous default row in the
     * same transaction. Enforces the "at most one default" invariant. The chosen
     * preset must be enabled — otherwise the default would be invisible on the public
     * form and we'd silently revert to first-enabled at render time.
     */
    @Transactional
    public DonationPreset setDefault(Long id) {
        String actor = currentUser();
        DonationPreset preset = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Donation preset not found: " + id));
        if (!preset.isEnabled()) {
            throw new IllegalArgumentException(
                    "Cannot set a disabled preset as default — enable it first");
        }

        repository.clearOtherDefaults(id);
        preset.setDefault(true);
        preset.setUpdatedAt(Instant.now());
        preset.setUpdatedBy(actor);
        DonationPreset saved = repository.save(preset);

        auditLogService.log(AuditAction.SETTINGS_UPDATED, "DonationPreset",
                String.valueOf(saved.getId()), actor,
                "promoted donation preset amount=" + saved.getAmountMinorUnits()
                        + " paise to default");
        return saved;
    }

    /** Remove the default flag from all presets — the public form will fall back to first-enabled. */
    @Transactional
    public void clearDefault() {
        String actor = currentUser();
        int affected = repository.clearAllDefaults();
        auditLogService.log(AuditAction.SETTINGS_UPDATED, "DonationPreset",
                "default", actor,
                "cleared donation preset default (" + affected + " rows affected)");
    }

    /**
     * Assigns contiguous 10-step {@code sort_order} values based on the order of IDs in
     * the request. IDs missing from {@code orderedIds} keep their previous sort_order —
     * they sort after the reordered items numerically.
     */
    @Transactional
    public List<DonationPreset> reorder(DonationPresetReorderRequest request) {
        String actor = currentUser();
        List<DonationPreset> all = repository.findAll();
        Map<Long, DonationPreset> byId = new HashMap<>();
        for (DonationPreset p : all) {
            byId.put(p.getId(), p);
        }
        int pos = 10;
        for (Long id : request.orderedIds()) {
            DonationPreset p = byId.get(id);
            if (p == null) {
                throw new EntityNotFoundException("Donation preset not found: " + id);
            }
            p.setSortOrder(pos);
            p.setUpdatedAt(Instant.now());
            p.setUpdatedBy(actor);
            pos += 10;
        }
        List<DonationPreset> saved = repository.saveAll(all);
        auditLogService.log(AuditAction.SETTINGS_UPDATED, "DonationPreset",
                "reorder", actor,
                "reordered donation presets: " + request.orderedIds());
        return saved.stream()
                .sorted((a, b) -> Integer.compare(a.getSortOrder(), b.getSortOrder()))
                .toList();
    }

    private static String normaliseLabel(String label) {
        if (label == null) return null;
        String trimmed = label.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String currentUser() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}

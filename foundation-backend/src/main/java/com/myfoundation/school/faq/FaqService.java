package com.myfoundation.school.faq;

import com.myfoundation.school.audit.AuditAction;
import com.myfoundation.school.audit.AuditLogService;
import com.myfoundation.school.faq.dto.FaqReorderRequest;
import com.myfoundation.school.faq.dto.FaqUpsertRequest;
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
 * Admin CRUD + public read for {@link Faq}.
 *
 * <p>Unlike {@code StoryService}, FAQ reads are not registration-gated. Most FAQ content
 * is appropriate for an unregistered foundation; sensitive questions (tax-deductibility,
 * regulatory recognition) should be left {@code disabled} in the admin UI until the
 * underlying registrations are in place. Per-row {@code enabled} is the only filter.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FaqService {

    private final FaqRepository repository;
    private final AuditLogService auditLogService;

    // --- reads -----------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<Faq> listAll() {
        return repository.findAllByOrderBySortOrderAscIdAsc();
    }

    /** Public list — enabled rows only, in admin-defined order. */
    @Transactional(readOnly = true)
    public List<Faq> listForPublic() {
        return repository.findByEnabledTrueOrderBySortOrderAscIdAsc();
    }

    // --- writes ----------------------------------------------------------------

    @Transactional
    public Faq create(FaqUpsertRequest request) {
        String actor = currentUser();
        Faq row = Faq.builder()
                .question(request.question().trim())
                .answer(request.answer().trim())
                .category(trimToNull(request.category()))
                .enabled(request.enabled())
                .sortOrder(request.sortOrder())
                .updatedAt(Instant.now())
                .updatedBy(actor)
                .build();

        Faq saved = repository.save(row);
        auditLogService.log(AuditAction.SETTINGS_UPDATED, "Faq",
                String.valueOf(saved.getId()), actor,
                "created FAQ '" + saved.getQuestion() + "'");
        return saved;
    }

    @Transactional
    public Faq update(Long id, FaqUpsertRequest request) {
        String actor = currentUser();
        Faq row = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("FAQ not found: " + id));

        row.setQuestion(request.question().trim());
        row.setAnswer(request.answer().trim());
        row.setCategory(trimToNull(request.category()));
        row.setEnabled(request.enabled());
        row.setSortOrder(request.sortOrder());
        row.setUpdatedAt(Instant.now());
        row.setUpdatedBy(actor);

        Faq saved = repository.save(row);
        auditLogService.log(AuditAction.SETTINGS_UPDATED, "Faq",
                String.valueOf(saved.getId()), actor,
                "updated FAQ '" + saved.getQuestion() + "' (enabled=" + saved.isEnabled() + ")");
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        String actor = currentUser();
        Faq row = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("FAQ not found: " + id));
        repository.delete(row);
        auditLogService.log(AuditAction.SETTINGS_UPDATED, "Faq",
                String.valueOf(id), actor,
                "deleted FAQ '" + row.getQuestion() + "'");
    }

    /** See {@code MoneyAllocationService.reorder} for the positional sort_order strategy. */
    @Transactional
    public List<Faq> reorder(FaqReorderRequest request) {
        String actor = currentUser();
        List<Faq> all = repository.findAll();
        Map<Long, Faq> byId = new HashMap<>();
        for (Faq f : all) {
            byId.put(f.getId(), f);
        }
        int pos = 10;
        for (Long id : request.orderedIds()) {
            Faq f = byId.get(id);
            if (f == null) {
                throw new EntityNotFoundException("FAQ not found: " + id);
            }
            f.setSortOrder(pos);
            f.setUpdatedAt(Instant.now());
            f.setUpdatedBy(actor);
            pos += 10;
        }
        List<Faq> saved = repository.saveAll(all);
        auditLogService.log(AuditAction.SETTINGS_UPDATED, "Faq",
                "reorder", actor,
                "reordered FAQs: " + request.orderedIds());
        return saved.stream()
                .sorted((a, b) -> Integer.compare(a.getSortOrder(), b.getSortOrder()))
                .toList();
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String currentUser() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}

package com.myfoundation.school.transparency;

import com.myfoundation.school.audit.AuditAction;
import com.myfoundation.school.audit.AuditLogService;
import com.myfoundation.school.transparency.dto.TransparencyDocumentReorderRequest;
import com.myfoundation.school.transparency.dto.TransparencyDocumentUpsertRequest;
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
 * Admin CRUD + public read for {@link TransparencyDocument}.
 *
 * <p>No registration gate — every transparency document is governed by its own
 * {@code enabled} flag, so admins control disclosure per-row. The Transparency page
 * itself is meaningful at every registration stage (it's where the foundation is
 * accountable about what does and does not yet exist).</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TransparencyDocumentService {

    private final TransparencyDocumentRepository repository;
    private final AuditLogService auditLogService;

    // --- reads -----------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<TransparencyDocument> listAll() {
        return repository.findAllByOrderBySortOrderAscIdAsc();
    }

    @Transactional(readOnly = true)
    public List<TransparencyDocument> listForPublic() {
        return repository.findByEnabledTrueOrderBySortOrderAscIdAsc();
    }

    // --- writes ----------------------------------------------------------------

    @Transactional
    public TransparencyDocument create(TransparencyDocumentUpsertRequest request) {
        String actor = currentUser();
        TransparencyDocument row = TransparencyDocument.builder()
                .title(request.title().trim())
                .description(trimToNull(request.description()))
                .category(trimToNull(request.category()))
                .linkUrl(request.linkUrl().trim())
                .issuedDate(request.issuedDate())
                .periodLabel(trimToNull(request.periodLabel()))
                .enabled(request.enabled())
                .sortOrder(request.sortOrder())
                .updatedAt(Instant.now())
                .updatedBy(actor)
                .build();

        TransparencyDocument saved = repository.save(row);
        auditLogService.log(AuditAction.SETTINGS_UPDATED, "TransparencyDocument",
                String.valueOf(saved.getId()), actor,
                "created transparency document '" + saved.getTitle() + "'");
        return saved;
    }

    @Transactional
    public TransparencyDocument update(Long id, TransparencyDocumentUpsertRequest request) {
        String actor = currentUser();
        TransparencyDocument row = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("TransparencyDocument not found: " + id));

        row.setTitle(request.title().trim());
        row.setDescription(trimToNull(request.description()));
        row.setCategory(trimToNull(request.category()));
        row.setLinkUrl(request.linkUrl().trim());
        row.setIssuedDate(request.issuedDate());
        row.setPeriodLabel(trimToNull(request.periodLabel()));
        row.setEnabled(request.enabled());
        row.setSortOrder(request.sortOrder());
        row.setUpdatedAt(Instant.now());
        row.setUpdatedBy(actor);

        TransparencyDocument saved = repository.save(row);
        auditLogService.log(AuditAction.SETTINGS_UPDATED, "TransparencyDocument",
                String.valueOf(saved.getId()), actor,
                "updated transparency document '" + saved.getTitle() + "' (enabled=" + saved.isEnabled() + ")");
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        String actor = currentUser();
        TransparencyDocument row = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("TransparencyDocument not found: " + id));
        repository.delete(row);
        auditLogService.log(AuditAction.SETTINGS_UPDATED, "TransparencyDocument",
                String.valueOf(id), actor,
                "deleted transparency document '" + row.getTitle() + "'");
    }

    @Transactional
    public List<TransparencyDocument> reorder(TransparencyDocumentReorderRequest request) {
        String actor = currentUser();
        List<TransparencyDocument> all = repository.findAll();
        Map<Long, TransparencyDocument> byId = new HashMap<>();
        for (TransparencyDocument d : all) {
            byId.put(d.getId(), d);
        }
        int pos = 10;
        for (Long id : request.orderedIds()) {
            TransparencyDocument d = byId.get(id);
            if (d == null) {
                throw new EntityNotFoundException("TransparencyDocument not found: " + id);
            }
            d.setSortOrder(pos);
            d.setUpdatedAt(Instant.now());
            d.setUpdatedBy(actor);
            pos += 10;
        }
        List<TransparencyDocument> saved = repository.saveAll(all);
        auditLogService.log(AuditAction.SETTINGS_UPDATED, "TransparencyDocument",
                "reorder", actor,
                "reordered transparency documents: " + request.orderedIds());
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

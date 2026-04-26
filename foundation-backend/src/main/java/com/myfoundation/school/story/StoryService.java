package com.myfoundation.school.story;

import com.myfoundation.school.audit.AuditAction;
import com.myfoundation.school.audit.AuditLogService;
import com.myfoundation.school.registration.RegistrationInfoService;
import com.myfoundation.school.registration.RegistrationStatus;
import com.myfoundation.school.story.dto.StoryReorderRequest;
import com.myfoundation.school.story.dto.StoryUpsertRequest;
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
 * Admin CRUD + registration-gated public read for {@link Story}.
 *
 * <p>Mirrors the gating model used by {@code MoneyAllocationService}: public reads return
 * an empty list whenever {@link RegistrationStatus} is not APPROVED, regardless of how
 * the admin has toggled individual stories or the home-section row. Defence-in-depth so
 * pre-registration the foundation can never display fabricated or implied beneficiary
 * outcomes to visitors. Admin reads remain unfiltered so operators can author content
 * before approval.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StoryService {

    private final StoryRepository repository;
    private final RegistrationInfoService registrationInfoService;
    private final AuditLogService auditLogService;

    // --- reads -----------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<Story> listAll() {
        return repository.findAllByOrderBySortOrderAscIdAsc();
    }

    /**
     * Public list — enabled rows only, AND only when registration is APPROVED.
     */
    @Transactional(readOnly = true)
    public List<Story> listForPublic() {
        if (!isDisclosed()) return List.of();
        return repository.findByEnabledTrueOrderBySortOrderAscIdAsc();
    }

    /** True when stories may currently be shown to visitors. */
    @Transactional(readOnly = true)
    public boolean isDisclosed() {
        return registrationInfoService.getCurrent().getStatus() == RegistrationStatus.APPROVED;
    }

    // --- writes ----------------------------------------------------------------

    @Transactional
    public Story create(StoryUpsertRequest request) {
        String actor = currentUser();
        Story row = Story.builder()
                .title(request.title().trim())
                .quote(request.quote().trim())
                .attribution(request.attribution().trim())
                .imageUrl(trimToNull(request.imageUrl()))
                .programTag(trimToNull(request.programTag()))
                .location(trimToNull(request.location()))
                .enabled(request.enabled())
                .sortOrder(request.sortOrder())
                .updatedAt(Instant.now())
                .updatedBy(actor)
                .build();

        Story saved = repository.save(row);
        auditLogService.log(AuditAction.SETTINGS_UPDATED, "Story",
                String.valueOf(saved.getId()), actor,
                "created story '" + saved.getTitle() + "'");
        return saved;
    }

    @Transactional
    public Story update(Long id, StoryUpsertRequest request) {
        String actor = currentUser();
        Story row = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Story not found: " + id));

        row.setTitle(request.title().trim());
        row.setQuote(request.quote().trim());
        row.setAttribution(request.attribution().trim());
        row.setImageUrl(trimToNull(request.imageUrl()));
        row.setProgramTag(trimToNull(request.programTag()));
        row.setLocation(trimToNull(request.location()));
        row.setEnabled(request.enabled());
        row.setSortOrder(request.sortOrder());
        row.setUpdatedAt(Instant.now());
        row.setUpdatedBy(actor);

        Story saved = repository.save(row);
        auditLogService.log(AuditAction.SETTINGS_UPDATED, "Story",
                String.valueOf(saved.getId()), actor,
                "updated story '" + saved.getTitle() + "' (enabled=" + saved.isEnabled() + ")");
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        String actor = currentUser();
        Story row = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Story not found: " + id));
        repository.delete(row);
        auditLogService.log(AuditAction.SETTINGS_UPDATED, "Story",
                String.valueOf(id), actor,
                "deleted story '" + row.getTitle() + "'");
    }

    /** See {@code MoneyAllocationService.reorder} for the positional sort_order strategy. */
    @Transactional
    public List<Story> reorder(StoryReorderRequest request) {
        String actor = currentUser();
        List<Story> all = repository.findAll();
        Map<Long, Story> byId = new HashMap<>();
        for (Story s : all) {
            byId.put(s.getId(), s);
        }
        int pos = 10;
        for (Long id : request.orderedIds()) {
            Story s = byId.get(id);
            if (s == null) {
                throw new EntityNotFoundException("Story not found: " + id);
            }
            s.setSortOrder(pos);
            s.setUpdatedAt(Instant.now());
            s.setUpdatedBy(actor);
            pos += 10;
        }
        List<Story> saved = repository.saveAll(all);
        auditLogService.log(AuditAction.SETTINGS_UPDATED, "Story",
                "reorder", actor,
                "reordered stories: " + request.orderedIds());
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

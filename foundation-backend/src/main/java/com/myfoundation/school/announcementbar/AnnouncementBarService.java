package com.myfoundation.school.announcementbar;

import com.myfoundation.school.announcementbar.dto.AnnouncementBarUpdateRequest;
import com.myfoundation.school.audit.AuditAction;
import com.myfoundation.school.audit.AuditLogService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

/**
 * Reads and writes the single-row {@link AnnouncementBar} record. Mirrors
 * {@code HeroPanelService} — audit-logged writes, transient fallback on the remote chance
 * the seeded row is missing, and a public-view wrapper that applies the enabled + time-window
 * filter so callers don't have to duplicate that logic.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AnnouncementBarService {

    private final AnnouncementBarRepository repository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public AnnouncementBar getCurrent() {
        return repository.findById(AnnouncementBar.SINGLETON_ID)
                .orElseGet(AnnouncementBarService::transientDefault);
    }

    /**
     * Returns the current bar only when it is <em>live right now</em> — enabled and within
     * the optional {@code startsAt}/{@code endsAt} window. Returns empty otherwise so the
     * public controller can emit 204 No Content.
     */
    @Transactional(readOnly = true)
    public Optional<AnnouncementBar> getCurrentForPublic() {
        AnnouncementBar current = getCurrent();
        return current.isWithinWindow(Instant.now()) ? Optional.of(current) : Optional.empty();
    }

    @Transactional
    public AnnouncementBar update(AnnouncementBarUpdateRequest request) {
        String updatedBy = SecurityContextHolder.getContext().getAuthentication().getName();
        validateWindow(request.startsAt(), request.endsAt());

        AnnouncementBar current = repository.findById(AnnouncementBar.SINGLETON_ID)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Announcement bar seed row missing — check V28 migration"));

        current.setEnabled(request.enabled());
        current.setIconEmoji(trimToNull(request.iconEmoji()));
        current.setMessage(request.message().trim());
        current.setLinkUrl(trimToNull(request.linkUrl()));
        current.setLinkLabel(trimToNull(request.linkLabel()));
        current.setStyle(request.style());
        current.setDismissible(request.dismissible());
        current.setStartsAt(request.startsAt());
        current.setEndsAt(request.endsAt());
        current.setUpdatedAt(Instant.now());
        current.setUpdatedBy(updatedBy);

        AnnouncementBar saved = repository.save(current);

        auditLogService.log(
                AuditAction.SETTINGS_UPDATED,
                "AnnouncementBar",
                String.valueOf(saved.getId()),
                updatedBy,
                String.format("announcement bar updated (enabled=%s, style=%s)",
                        saved.isEnabled(), saved.getStyle())
        );

        log.info("Announcement bar updated: enabled={} style={} by={}",
                saved.isEnabled(), saved.getStyle(), updatedBy);
        return saved;
    }

    private static void validateWindow(Instant startsAt, Instant endsAt) {
        if (startsAt != null && endsAt != null && !endsAt.isAfter(startsAt)) {
            throw new IllegalArgumentException("endsAt must be after startsAt");
        }
    }

    private static AnnouncementBar transientDefault() {
        Instant now = Instant.now();
        return AnnouncementBar.builder()
                .id(AnnouncementBar.SINGLETON_ID)
                .enabled(false)
                .message("Welcome — our latest update will appear here.")
                .style(AnnouncementStyle.INFO)
                .dismissible(true)
                .updatedAt(now)
                .updatedBy("system")
                .build();
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}

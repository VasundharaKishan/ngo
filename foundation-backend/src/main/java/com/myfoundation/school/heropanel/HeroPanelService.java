package com.myfoundation.school.heropanel;

import com.myfoundation.school.audit.AuditAction;
import com.myfoundation.school.audit.AuditLogService;
import com.myfoundation.school.heropanel.dto.HeroPanelUpdateRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

/**
 * Reads and writes the single-row {@link HeroPanel} record. Follows the same pattern as
 * {@code RegistrationInfoService} — singleton read with UNREGISTERED-style fallback and
 * audit-logged writes.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class HeroPanelService {

    private final HeroPanelRepository repository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public HeroPanel getCurrent() {
        return repository.findById(HeroPanel.SINGLETON_ID)
                .orElseGet(HeroPanelService::transientDefault);
    }

    /**
     * Returns the current panel when enabled, or {@link Optional#empty()} when it is disabled
     * (frontend renders a fallback in that case).
     */
    @Transactional(readOnly = true)
    public Optional<HeroPanel> getCurrentForPublic() {
        HeroPanel current = getCurrent();
        return current.isEnabled() ? Optional.of(current) : Optional.empty();
    }

    @Transactional
    public HeroPanel update(HeroPanelUpdateRequest request) {
        String updatedBy = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("Updating hero panel: enabled={} by user={}", request.enabled(), updatedBy);

        HeroPanel current = repository.findById(HeroPanel.SINGLETON_ID)
                .orElseGet(HeroPanelService::transientDefault);

        current.setEyebrow(trimToNull(request.eyebrow()));
        current.setHeadline(request.headline().trim());
        current.setSubtitle(trimToNull(request.subtitle()));
        current.setPrimaryCtaLabel(trimToNull(request.primaryCtaLabel()));
        current.setPrimaryCtaHref(trimToNull(request.primaryCtaHref()));
        current.setBackgroundImageUrl(trimToNull(request.backgroundImageUrl()));
        current.setBackgroundFocus(request.backgroundFocus());
        current.setEnabled(request.enabled());
        current.setUpdatedAt(Instant.now());
        current.setUpdatedBy(updatedBy);

        HeroPanel saved = repository.save(current);

        auditLogService.log(
                AuditAction.SETTINGS_UPDATED,
                "HeroPanel",
                String.valueOf(saved.getId()),
                updatedBy,
                String.format("hero panel updated (enabled=%s)", saved.isEnabled())
        );

        return saved;
    }

    private static HeroPanel transientDefault() {
        return HeroPanel.builder()
                .id(HeroPanel.SINGLETON_ID)
                .headline("Support our mission.")
                .backgroundFocus(BackgroundFocus.CENTER)
                .enabled(true)
                .updatedAt(Instant.now())
                .updatedBy("system")
                .build();
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}

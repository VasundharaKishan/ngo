package com.myfoundation.school.contact;

import com.myfoundation.school.audit.AuditAction;
import com.myfoundation.school.audit.AuditLogService;
import com.myfoundation.school.auth.EmailService;
import com.myfoundation.school.contact.dto.ContactSubmissionRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Contact-form submissions: public create (CAPTCHA-gated) and admin reads.
 *
 * <p>Per-IP flood protection: at most 5 submissions per hour from a single IP,
 * independent of the global rate-limiting filter/interceptor. This is defence-in-
 * depth — the outer rate limiter catches broad abuse; this inner check stops a
 * determined bot that stays just under the rate limit.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ContactSubmissionService {

    private static final int MAX_SUBMISSIONS_PER_IP_PER_HOUR = 5;

    private final ContactSubmissionRepository repository;
    private final TurnstileVerificationService turnstileService;
    private final AuditLogService auditLogService;
    private final EmailService emailService;

    // --- public create -------------------------------------------------------

    /**
     * Validates CAPTCHA, enforces per-IP flood check, and persists the submission.
     *
     * @throws IllegalStateException if CAPTCHA fails or flood limit exceeded
     */
    @Transactional
    public ContactSubmission submit(ContactSubmissionRequest request, String clientIp) {
        // 1. Verify Turnstile CAPTCHA
        if (!turnstileService.verify(request.turnstileToken(), clientIp)) {
            log.warn("CAPTCHA verification failed for contact submission from IP={}", clientIp);
            throw new IllegalStateException("CAPTCHA verification failed. Please try again.");
        }

        // 2. Per-IP flood check
        Instant oneHourAgo = Instant.now().minus(1, ChronoUnit.HOURS);
        long recentCount = repository.countByClientIpSince(clientIp, oneHourAgo);
        if (recentCount >= MAX_SUBMISSIONS_PER_IP_PER_HOUR) {
            log.warn("Contact form flood: IP={} has {} submissions in the last hour", clientIp, recentCount);
            throw new IllegalStateException(
                    "Too many submissions from your network. Please try again in an hour.");
        }

        // 3. Persist
        ContactSubmission row = ContactSubmission.builder()
                .name(request.name().trim())
                .email(request.email().trim().toLowerCase())
                .subject(request.subject().trim())
                .message(request.message().trim())
                .clientIp(clientIp)
                .build();

        ContactSubmission saved = repository.save(row);
        log.info("Contact submission saved: id={}, email={}, subject='{}'",
                saved.getId(), saved.getEmail(), saved.getSubject());

        // Notify admin via email — fire-and-forget, never blocks the response
        try {
            emailService.sendContactNotificationToAdmin(
                    saved.getName(),
                    saved.getEmail(),
                    saved.getSubject(),
                    saved.getMessage(),
                    saved.getId());
        } catch (Exception e) {
            log.warn("Failed to send admin notification for contact submission id={}", saved.getId(), e);
        }

        return saved;
    }

    // --- admin reads ---------------------------------------------------------

    @Transactional(readOnly = true)
    public List<ContactSubmission> listAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<ContactSubmission> listByStatus(String status) {
        return repository.findByStatusOrderByCreatedAtDesc(status.toUpperCase());
    }

    @Transactional
    public ContactSubmission markRead(Long id) {
        String actor = currentUser();
        ContactSubmission row = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ContactSubmission not found: " + id));
        row.setStatus("READ");
        row.setReadAt(Instant.now());
        row.setReadBy(actor);
        ContactSubmission saved = repository.save(row);
        auditLogService.log(AuditAction.SETTINGS_UPDATED, "ContactSubmission",
                String.valueOf(id), actor, "marked contact submission as read");
        return saved;
    }

    @Transactional
    public ContactSubmission archive(Long id) {
        String actor = currentUser();
        ContactSubmission row = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ContactSubmission not found: " + id));
        row.setStatus("ARCHIVED");
        ContactSubmission saved = repository.save(row);
        auditLogService.log(AuditAction.SETTINGS_UPDATED, "ContactSubmission",
                String.valueOf(id), actor, "archived contact submission");
        return saved;
    }

    @Transactional
    public ContactSubmission addNote(Long id, String note) {
        String actor = currentUser();
        ContactSubmission row = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ContactSubmission not found: " + id));
        row.setAdminNote(note != null && !note.isBlank() ? note.trim() : null);
        ContactSubmission saved = repository.save(row);
        auditLogService.log(AuditAction.SETTINGS_UPDATED, "ContactSubmission",
                String.valueOf(id), actor, "updated admin note on contact submission");
        return saved;
    }

    private static String currentUser() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}

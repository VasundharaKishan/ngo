package com.myfoundation.school.contact;

import com.myfoundation.school.audit.AuditAction;
import com.myfoundation.school.audit.AuditLogService;
import com.myfoundation.school.auth.EmailService;
import com.myfoundation.school.contact.dto.ContactSubmissionRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link ContactSubmissionService}.
 *
 * <p>Covers the full public submit flow (CAPTCHA → flood check → persist → email)
 * and the admin operations (list, markRead, archive, addNote).</p>
 */
@ExtendWith(MockitoExtension.class)
class ContactSubmissionServiceTest {

    @Mock
    private ContactSubmissionRepository repository;

    @Mock
    private TurnstileVerificationService turnstileService;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private ContactSubmissionService service;

    private static final String CLIENT_IP = "203.0.113.42";

    private ContactSubmissionRequest validRequest() {
        return new ContactSubmissionRequest(
                "Ravi Kumar",
                "ravi@example.com",
                "Volunteer inquiry",
                "I would like to volunteer for the upcoming education campaign in my area.",
                "turnstile-token-abc"
        );
    }

    private ContactSubmission savedRow() {
        return ContactSubmission.builder()
                .id(1L)
                .name("Ravi Kumar")
                .email("ravi@example.com")
                .subject("Volunteer inquiry")
                .message("I would like to volunteer for the upcoming education campaign in my area.")
                .clientIp(CLIENT_IP)
                .status("NEW")
                .createdAt(Instant.now())
                .build();
    }

    // ===================== public submit flow =====================

    @Nested
    class SubmitTests {

        @Test
        void happyPath_captchaPass_noFlood_persists() {
            when(turnstileService.verify("turnstile-token-abc", CLIENT_IP)).thenReturn(true);
            when(repository.countByClientIpSince(eq(CLIENT_IP), any(Instant.class))).thenReturn(0L);
            ContactSubmission row = savedRow();
            when(repository.save(any(ContactSubmission.class))).thenReturn(row);

            ContactSubmission result = service.submit(validRequest(), CLIENT_IP);

            assertNotNull(result);
            assertEquals(1L, result.getId());
            verify(repository).save(any(ContactSubmission.class));
        }

        @Test
        void persistedEntity_trimmed_and_lowercased() {
            when(turnstileService.verify(anyString(), anyString())).thenReturn(true);
            when(repository.countByClientIpSince(anyString(), any())).thenReturn(0L);
            when(repository.save(any(ContactSubmission.class))).thenAnswer(inv -> {
                ContactSubmission c = inv.getArgument(0);
                c.setId(1L);
                return c;
            });

            ContactSubmissionRequest req = new ContactSubmissionRequest(
                    "  Ravi Kumar  ",
                    "  Ravi@Example.COM  ",
                    "  Subject  ",
                    "  A message long enough to pass the 20-char validation requirement.  ",
                    "token"
            );
            service.submit(req, CLIENT_IP);

            ArgumentCaptor<ContactSubmission> captor = ArgumentCaptor.forClass(ContactSubmission.class);
            verify(repository).save(captor.capture());
            ContactSubmission persisted = captor.getValue();
            assertEquals("Ravi Kumar", persisted.getName());
            assertEquals("ravi@example.com", persisted.getEmail());
            assertEquals("Subject", persisted.getSubject());
            assertEquals(CLIENT_IP, persisted.getClientIp());
        }

        @Test
        void captchaFails_throwsIllegalState() {
            when(turnstileService.verify(anyString(), anyString())).thenReturn(false);

            IllegalStateException ex = assertThrows(IllegalStateException.class,
                    () -> service.submit(validRequest(), CLIENT_IP));

            assertTrue(ex.getMessage().contains("CAPTCHA"));
            verify(repository, never()).save(any());
        }

        @Test
        void floodLimitExceeded_throwsIllegalState() {
            when(turnstileService.verify(anyString(), anyString())).thenReturn(true);
            when(repository.countByClientIpSince(eq(CLIENT_IP), any(Instant.class))).thenReturn(5L);

            IllegalStateException ex = assertThrows(IllegalStateException.class,
                    () -> service.submit(validRequest(), CLIENT_IP));

            assertTrue(ex.getMessage().contains("Too many submissions"));
            verify(repository, never()).save(any());
        }

        @Test
        void floodLimitAtThreshold_allowed() {
            when(turnstileService.verify(anyString(), anyString())).thenReturn(true);
            // 4 submissions — still under the limit of 5
            when(repository.countByClientIpSince(eq(CLIENT_IP), any(Instant.class))).thenReturn(4L);
            when(repository.save(any(ContactSubmission.class))).thenReturn(savedRow());

            assertDoesNotThrow(() -> service.submit(validRequest(), CLIENT_IP));
            verify(repository).save(any());
        }

        @Test
        void floodCheck_usesOneHourWindow() {
            when(turnstileService.verify(anyString(), anyString())).thenReturn(true);
            when(repository.countByClientIpSince(anyString(), any())).thenReturn(0L);
            when(repository.save(any())).thenReturn(savedRow());

            service.submit(validRequest(), CLIENT_IP);

            ArgumentCaptor<Instant> instantCaptor = ArgumentCaptor.forClass(Instant.class);
            verify(repository).countByClientIpSince(eq(CLIENT_IP), instantCaptor.capture());
            Instant capturedSince = instantCaptor.getValue();
            // Should be approximately 1 hour ago (within a few seconds tolerance)
            long minutesAgo = Instant.now().until(capturedSince, ChronoUnit.MINUTES);
            assertTrue(minutesAgo >= -61 && minutesAgo <= -59,
                    "Flood-check window should be ~1 hour; was " + minutesAgo + " min");
        }

        @Test
        void emailNotification_sentAfterPersist() {
            when(turnstileService.verify(anyString(), anyString())).thenReturn(true);
            when(repository.countByClientIpSince(anyString(), any())).thenReturn(0L);
            ContactSubmission row = savedRow();
            when(repository.save(any())).thenReturn(row);

            service.submit(validRequest(), CLIENT_IP);

            verify(emailService).sendContactNotificationToAdmin(
                    row.getName(), row.getEmail(), row.getSubject(),
                    row.getMessage(), row.getId());
        }

        @Test
        void emailFailure_doesNotBreakSubmission() {
            when(turnstileService.verify(anyString(), anyString())).thenReturn(true);
            when(repository.countByClientIpSince(anyString(), any())).thenReturn(0L);
            when(repository.save(any())).thenReturn(savedRow());

            doThrow(new RuntimeException("SMTP down"))
                    .when(emailService).sendContactNotificationToAdmin(
                            anyString(), anyString(), anyString(), anyString(), anyLong());

            // Should still return successfully — fire-and-forget
            ContactSubmission result = service.submit(validRequest(), CLIENT_IP);
            assertNotNull(result);
        }
    }

    // ===================== admin reads =====================

    @Nested
    class AdminReadTests {

        @Test
        void listAll_delegatesToRepository() {
            List<ContactSubmission> rows = List.of(savedRow());
            when(repository.findAllByOrderByCreatedAtDesc()).thenReturn(rows);

            List<ContactSubmission> result = service.listAll();

            assertEquals(1, result.size());
            verify(repository).findAllByOrderByCreatedAtDesc();
        }

        @Test
        void listByStatus_uppercases() {
            when(repository.findByStatusOrderByCreatedAtDesc("NEW")).thenReturn(List.of());

            service.listByStatus("new");

            verify(repository).findByStatusOrderByCreatedAtDesc("NEW");
        }
    }

    // ===================== admin actions =====================

    @Nested
    class AdminActionTests {

        @BeforeEach
        void setSecurityContext() {
            SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(
                            "admin_test",
                            null,
                            List.of(new SimpleGrantedAuthority("ADMIN"))
                    ));
        }

        @Test
        void markRead_setsStatusAndTimestamp() {
            ContactSubmission row = savedRow();
            when(repository.findById(1L)).thenReturn(Optional.of(row));
            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ContactSubmission result = service.markRead(1L);

            assertEquals("READ", result.getStatus());
            assertNotNull(result.getReadAt());
            assertEquals("admin_test", result.getReadBy());
            verify(auditLogService).log(eq(AuditAction.SETTINGS_UPDATED),
                    eq("ContactSubmission"), eq("1"), eq("admin_test"), contains("read"));
        }

        @Test
        void markRead_notFound_throwsEntityNotFound() {
            when(repository.findById(99L)).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class, () -> service.markRead(99L));
        }

        @Test
        void archive_setsStatus() {
            ContactSubmission row = savedRow();
            when(repository.findById(1L)).thenReturn(Optional.of(row));
            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ContactSubmission result = service.archive(1L);

            assertEquals("ARCHIVED", result.getStatus());
            verify(auditLogService).log(eq(AuditAction.SETTINGS_UPDATED),
                    eq("ContactSubmission"), eq("1"), eq("admin_test"), contains("archived"));
        }

        @Test
        void addNote_setsNote() {
            ContactSubmission row = savedRow();
            when(repository.findById(1L)).thenReturn(Optional.of(row));
            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ContactSubmission result = service.addNote(1L, "  Follow up tomorrow  ");

            assertEquals("Follow up tomorrow", result.getAdminNote());
            verify(auditLogService).log(eq(AuditAction.SETTINGS_UPDATED),
                    eq("ContactSubmission"), eq("1"), eq("admin_test"), contains("note"));
        }

        @Test
        void addNote_blankClears() {
            ContactSubmission row = savedRow();
            row.setAdminNote("old note");
            when(repository.findById(1L)).thenReturn(Optional.of(row));
            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ContactSubmission result = service.addNote(1L, "   ");

            assertNull(result.getAdminNote());
        }

        @Test
        void addNote_nullClears() {
            ContactSubmission row = savedRow();
            row.setAdminNote("old note");
            when(repository.findById(1L)).thenReturn(Optional.of(row));
            when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ContactSubmission result = service.addNote(1L, null);

            assertNull(result.getAdminNote());
        }
    }
}

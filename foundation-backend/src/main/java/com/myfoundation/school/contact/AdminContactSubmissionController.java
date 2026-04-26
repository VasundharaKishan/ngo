package com.myfoundation.school.contact;

import com.myfoundation.school.contact.dto.ContactSubmissionNoteRequest;
import com.myfoundation.school.contact.dto.ContactSubmissionResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Admin endpoints for reviewing contact-form submissions.
 *
 * <p>Submissions flow through three statuses: NEW → READ → ARCHIVED.
 * The list endpoint supports an optional {@code status} query parameter
 * to filter; omitting it returns all submissions (newest first).</p>
 */
@RestController
@RequestMapping("/api/admin/contact-submissions")
@PreAuthorize("hasAuthority('ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class AdminContactSubmissionController {

    private final ContactSubmissionService service;

    @GetMapping
    public ResponseEntity<List<ContactSubmissionResponse>> list(
            @RequestParam(required = false) String status) {
        List<ContactSubmission> rows = (status != null && !status.isBlank())
                ? service.listByStatus(status)
                : service.listAll();
        List<ContactSubmissionResponse> body = rows.stream()
                .map(ContactSubmissionResponse::from)
                .toList();
        return ResponseEntity.ok(body);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<ContactSubmissionResponse> markRead(@PathVariable Long id) {
        log.info("Admin marking contact submission read: id={}", id);
        return ResponseEntity.ok(ContactSubmissionResponse.from(service.markRead(id)));
    }

    @PostMapping("/{id}/archive")
    public ResponseEntity<ContactSubmissionResponse> archive(@PathVariable Long id) {
        log.info("Admin archiving contact submission: id={}", id);
        return ResponseEntity.ok(ContactSubmissionResponse.from(service.archive(id)));
    }

    @PostMapping("/{id}/note")
    public ResponseEntity<ContactSubmissionResponse> addNote(
            @PathVariable Long id,
            @Valid @RequestBody ContactSubmissionNoteRequest request) {
        log.info("Admin adding note to contact submission: id={}", id);
        return ResponseEntity.ok(ContactSubmissionResponse.from(service.addNote(id, request.note())));
    }
}

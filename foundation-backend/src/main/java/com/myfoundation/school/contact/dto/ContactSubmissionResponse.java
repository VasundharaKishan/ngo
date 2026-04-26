package com.myfoundation.school.contact.dto;

import com.myfoundation.school.contact.ContactSubmission;

import java.time.Instant;

/** Admin-facing response — full submission including status and admin note. */
public record ContactSubmissionResponse(
        Long id,
        String name,
        String email,
        String subject,
        String message,
        String clientIp,
        String status,
        String adminNote,
        Instant createdAt,
        Instant readAt,
        String readBy
) {
    public static ContactSubmissionResponse from(ContactSubmission c) {
        return new ContactSubmissionResponse(
                c.getId(),
                c.getName(),
                c.getEmail(),
                c.getSubject(),
                c.getMessage(),
                c.getClientIp(),
                c.getStatus(),
                c.getAdminNote(),
                c.getCreatedAt(),
                c.getReadAt(),
                c.getReadBy()
        );
    }
}

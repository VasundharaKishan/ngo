package com.myfoundation.school.contact;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * One contact-form submission from a visitor. Created only after Turnstile
 * CAPTCHA verification succeeds.
 *
 * <p>Status lifecycle: {@code NEW → READ → ARCHIVED}. Admins progress status
 * manually from the admin panel.</p>
 */
@Entity
@Table(name = "contact_submissions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "email", nullable = false, length = 320)
    private String email;

    @Column(name = "subject", nullable = false, length = 200)
    private String subject;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "client_ip", length = 45)
    private String clientIp;

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "NEW";

    @Column(name = "admin_note", columnDefinition = "TEXT")
    private String adminNote;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "read_by", length = 120)
    private String readBy;
}

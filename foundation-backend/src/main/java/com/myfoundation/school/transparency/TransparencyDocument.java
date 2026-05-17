package com.myfoundation.school.transparency;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

/**
 * One transparency document — a published artefact (registration certificate, annual
 * report, audit, policy document, board resolution) that the foundation makes available
 * for public scrutiny.
 *
 * <p>{@code linkUrl} points to the document host; we do not store binary content. See
 * {@code V31__create_transparency_documents_table.sql} for the rationale on why this
 * is intentional (storage/security simplicity, host flexibility for the foundation).</p>
 *
 * <p>Like FAQs, transparency documents are NOT registration-gated at the service layer.
 * Each document is published only when its row is {@code enabled} — admins can stage
 * draft entries with placeholder URLs and flip them on once the real document exists.</p>
 */
@Entity
@Table(name = "transparency_documents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransparencyDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /** Free-text grouping label (e.g. "Annual reports", "Registration", "Policies"). */
    @Column(name = "category", length = 80)
    private String category;

    @Column(name = "link_url", nullable = false, length = 2000)
    private String linkUrl;

    /** Date the document was issued or the period it covers ended. Null when not applicable. */
    @Column(name = "issued_date")
    private LocalDate issuedDate;

    /** Free-text period label (e.g. "FY 2024-25") shown alongside or instead of issuedDate. */
    @Column(name = "period_label", length = 80)
    private String periodLabel;

    @Column(name = "enabled", nullable = false)
    private boolean enabled;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "updated_by", length = 120)
    private String updatedBy;

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}

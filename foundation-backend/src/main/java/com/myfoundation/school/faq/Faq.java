package com.myfoundation.school.faq;

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

/**
 * One FAQ entry — a question and its answer, with an optional category for client-side
 * grouping on the public FAQ page.
 *
 * <p>Unlike {@code Story} or {@code MoneyAllocation}, FAQs are NOT registration-gated at
 * the service layer. Most FAQ content (who we are, how to volunteer, where to find
 * accounts) is appropriate to publish before official registration. Editorial caution
 * around tax-deductibility and similar claims is left to the admin via the per-row
 * {@code enabled} flag — see {@code V30__create_faqs_table.sql} for rationale.</p>
 */
@Entity
@Table(name = "faqs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Faq {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "question", nullable = false, length = 500)
    private String question;

    /** Multi-paragraph allowed; backend trims surrounding whitespace but preserves line breaks. */
    @Column(name = "answer", nullable = false, columnDefinition = "TEXT")
    private String answer;

    /** Free-text grouping label, e.g. "Donations", "About us". Null = ungrouped. */
    @Column(name = "category", length = 80)
    private String category;

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

package com.myfoundation.school.trustbadge;

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
 * Ordered list of public-facing trust markers rendered in the footer strip and the
 * About-page grid. See {@code V25__create_trust_badges_table.sql} for column semantics.
 *
 * <p>Badges flagged {@code registrationGated = true} are hidden at the service layer
 * whenever the {@code RegistrationInfo} singleton is not {@code APPROVED} — this is
 * defence-in-depth against claiming "Registered NGO" while the org is still awaiting
 * approval.</p>
 */
@Entity
@Table(name = "trust_badges")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrustBadge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "slot_key", nullable = false, unique = true, length = 64)
    private String slotKey;

    @Column(name = "icon_emoji", nullable = false, length = 16)
    private String iconEmoji;

    @Column(name = "title", nullable = false, length = 120)
    private String title;

    @Column(name = "description", nullable = false, length = 500)
    private String description;

    @Column(name = "enabled", nullable = false)
    private boolean enabled;

    @Column(name = "show_in_strip", nullable = false)
    private boolean showInStrip;

    @Column(name = "show_in_grid", nullable = false)
    private boolean showInGrid;

    @Column(name = "registration_gated", nullable = false)
    private boolean registrationGated;

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

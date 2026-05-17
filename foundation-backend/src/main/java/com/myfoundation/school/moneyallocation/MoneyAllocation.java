package com.myfoundation.school.moneyallocation;

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
 * One row of the "Where your money goes" disclosure — a program bucket with an emoji
 * icon, short label, percentage of total spend, and a one-line description.
 *
 * <p>See {@code V27__create_money_allocations_table.sql} for column semantics and the
 * rationale for gating public access behind registration status.</p>
 */
@Entity
@Table(name = "money_allocations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MoneyAllocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "icon_emoji", nullable = false, length = 16)
    private String iconEmoji;

    @Column(name = "label", nullable = false, length = 120)
    private String label;

    @Column(name = "percentage", nullable = false)
    private Integer percentage;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "color_hex", nullable = false, length = 9)
    private String colorHex;

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

package com.myfoundation.school.donationpreset;

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
 * A single quick-select donation amount shown on the public donation form. See
 * {@code V26__create_donation_presets_table.sql} for column semantics.
 *
 * <p>Amounts are stored in the currency's minor unit (paise for INR) — the same
 * contract Stripe uses. Exactly one row may have {@code isDefault = true}; the
 * service enforces this invariant.</p>
 */
@Entity
@Table(name = "donation_presets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonationPreset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "amount_minor_units", nullable = false)
    private Integer amountMinorUnits;

    @Column(name = "label", length = 40)
    private String label;

    @Column(name = "enabled", nullable = false)
    private boolean enabled;

    @Column(name = "is_default", nullable = false)
    private boolean isDefault;

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

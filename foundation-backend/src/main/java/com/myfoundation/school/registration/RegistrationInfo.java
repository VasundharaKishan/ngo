package com.myfoundation.school.registration;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
 * Single-row entity representing the foundation's legal registration state.
 *
 * <p>Exactly one row exists in the backing table ({@code id = 1}). Updates mutate the
 * existing row; inserts are not performed by application code.</p>
 */
@Entity
@Table(name = "registration_info")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistrationInfo {

    /** Fixed primary key. Always {@code 1L}. */
    public static final long SINGLETON_ID = 1L;

    @Id
    @Column(name = "id", nullable = false)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private RegistrationStatus status;

    @Column(name = "registration_number", length = 128)
    private String registrationNumber;

    @Column(name = "section8_number", length = 128)
    private String section8Number;

    @Column(name = "eighty_g_number", length = 128)
    private String eightyGNumber;

    @Column(name = "fcra_number", length = 128)
    private String fcraNumber;

    @Column(name = "pan_number", length = 32)
    private String panNumber;

    @Column(name = "applied_date")
    private LocalDate appliedDate;

    @Column(name = "approved_date")
    private LocalDate approvedDate;

    /** Admin override for footer disclosure text; when null, frontend renders a default by status. */
    @Column(name = "disclosure_override", columnDefinition = "TEXT")
    private String disclosureOverride;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "updated_by", length = 255)
    private String updatedBy;

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    /** True when 80G tax-deduction claims may be made publicly. */
    public boolean isEightyGActive() {
        return status == RegistrationStatus.APPROVED
                && eightyGNumber != null
                && !eightyGNumber.isBlank();
    }

    /** True when FCRA-gated (foreign-donation) flows should be enabled. */
    public boolean isFcraActive() {
        return status == RegistrationStatus.APPROVED
                && fcraNumber != null
                && !fcraNumber.isBlank();
    }
}

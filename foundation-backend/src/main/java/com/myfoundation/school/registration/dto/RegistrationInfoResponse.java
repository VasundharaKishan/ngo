package com.myfoundation.school.registration.dto;

import com.myfoundation.school.registration.RegistrationInfo;
import com.myfoundation.school.registration.RegistrationStatus;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Admin-facing view of {@link RegistrationInfo}. Exposes every field, including identifiers,
 * which are sensitive and must never be sent to the public API.
 */
public record RegistrationInfoResponse(
        RegistrationStatus status,
        String registrationNumber,
        String section8Number,
        String eightyGNumber,
        String fcraNumber,
        String panNumber,
        LocalDate appliedDate,
        LocalDate approvedDate,
        String disclosureOverride,
        boolean eightyGActive,
        boolean fcraActive,
        Instant updatedAt,
        String updatedBy
) {
    public static RegistrationInfoResponse from(RegistrationInfo r) {
        return new RegistrationInfoResponse(
                r.getStatus(),
                r.getRegistrationNumber(),
                r.getSection8Number(),
                r.getEightyGNumber(),
                r.getFcraNumber(),
                r.getPanNumber(),
                r.getAppliedDate(),
                r.getApprovedDate(),
                r.getDisclosureOverride(),
                r.isEightyGActive(),
                r.isFcraActive(),
                r.getUpdatedAt(),
                r.getUpdatedBy()
        );
    }
}

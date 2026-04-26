package com.myfoundation.school.registration.dto;

import com.myfoundation.school.registration.RegistrationStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Admin update payload. All fields except {@link #status()} are optional. Certificate-bound
 * fields (section8Number, eightyGNumber, fcraNumber) are silently cleared by the service
 * when {@code status != APPROVED} so the public API cannot leak stale identifiers.
 */
public record RegistrationInfoUpdateRequest(
        @NotNull(message = "status is required")
        RegistrationStatus status,

        @Size(max = 128)
        String registrationNumber,

        @Size(max = 128)
        String section8Number,

        @Size(max = 128)
        String eightyGNumber,

        @Size(max = 128)
        String fcraNumber,

        @Pattern(regexp = "^$|^[A-Z]{5}[0-9]{4}[A-Z]$", message = "PAN must match 5 letters, 4 digits, 1 letter")
        @Size(max = 32)
        String panNumber,

        LocalDate appliedDate,

        LocalDate approvedDate,

        @Size(max = 2000)
        String disclosureOverride
) {}

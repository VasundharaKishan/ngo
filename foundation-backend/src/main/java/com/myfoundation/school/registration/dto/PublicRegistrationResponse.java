package com.myfoundation.school.registration.dto;

import com.myfoundation.school.registration.RegistrationInfo;
import com.myfoundation.school.registration.RegistrationStatus;

/**
 * Public projection of {@link RegistrationInfo}. Exposes only what the public site needs
 * to render conditional content — never internal numbers until status is APPROVED.
 *
 * <p>When {@link #status()} is not APPROVED, {@link #registrationNumber()} is always {@code null}
 * regardless of database state (defence in depth).</p>
 */
public record PublicRegistrationResponse(
        RegistrationStatus status,
        /** Primary registered identifier, only present when status is APPROVED. */
        String registrationNumber,
        /** True when 80G tax-deduction claims may be displayed. */
        boolean eightyGActive,
        /** True when FCRA-gated foreign-donation flows may be enabled. */
        boolean fcraActive,
        /** Optional admin-authored disclosure text; frontend falls back to defaults when null. */
        String disclosureOverride
) {
    public static PublicRegistrationResponse from(RegistrationInfo r) {
        boolean approved = r.getStatus() == RegistrationStatus.APPROVED;
        return new PublicRegistrationResponse(
                r.getStatus(),
                approved ? r.getRegistrationNumber() : null,
                r.isEightyGActive(),
                r.isFcraActive(),
                r.getDisclosureOverride()
        );
    }
}

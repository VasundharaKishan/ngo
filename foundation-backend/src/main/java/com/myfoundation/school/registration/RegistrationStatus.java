package com.myfoundation.school.registration;

/**
 * Legal registration state of the foundation.
 *
 * <p>Drives conditional content on the public site:
 * when {@link #UNREGISTERED} or {@link #APPLIED}, the footer shows a "registration in progress"
 * disclosure and 80G tax-deduction claims are hidden everywhere. When {@link #APPROVED},
 * registration numbers are surfaced and 80G receipts may be issued.</p>
 */
public enum RegistrationStatus {
    /** No registration filed yet. Public site must not claim registered status or 80G. */
    UNREGISTERED,

    /** Registration application filed; awaiting approval. Numbers may be unknown. */
    APPLIED,

    /** Fully registered (Section 8). 80G / FCRA numbers may be populated. */
    APPROVED
}

-- V33__seed_legal_site_settings.sql
--
-- Seed site_settings rows consumed by the frontend legal pages
-- (currently RefundPage.tsx; Terms/Privacy/etc. can read the same keys
--  when their prose is upgraded to the admin-editable variable pattern).
--
-- Design notes:
--   * All legal.* keys are is_public = TRUE because they render on public
--     policy pages that must be reachable without authentication.
--   * Values are intentionally generic / India-friendly placeholders that
--     an admin is expected to replace before first launch.
--   * setting_value is TEXT NOT NULL, so empty-optional keys are seeded
--     with an empty string rather than NULL (matches V4's convention for
--     social.* and footer.text).
--   * ON CONFLICT (setting_key) DO NOTHING means if the admin has already
--     set a value, this migration will not clobber it on re-apply.
--   * Integer-ish values (refund windows) are stored as STRING because
--     the frontend parses them with parseInt and applies its own default.
--     This matches how the existing RefundPage consumer reads them.
--     If you want stricter validation, change setting_type to INTEGER and
--     add a server-side parser; the frontend will continue to work.

INSERT INTO site_settings (setting_key, setting_value, setting_type, is_public, description, updated_by, created_at, updated_at)
VALUES
    ('legal.org_name',               '',                                               'STRING', TRUE, 'Legal/registered name of the organisation (falls back to site.name if empty). Used across legal pages.', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('legal.registered_address',     'Registered office address to be updated by admin.', 'STRING', TRUE, 'Full postal address of the registered office, shown in the Contact Us block of legal pages.', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('legal.80g_number',             '',                                               'STRING', TRUE, 'Section 80G registration number issued by the Income Tax Department of India. Shown next to 80G receipt clauses when non-empty.', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('legal.jurisdiction',           'India',                                          'STRING', TRUE, 'Governing jurisdiction for legal policies (country or city, India). Used in governing-law clauses.', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('legal.contact_email',          '',                                               'STRING', TRUE, 'Email address for legal, refund and privacy enquiries. Falls back to contact.email if empty.', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('legal.contact_phone',          '',                                               'STRING', TRUE, 'Phone number for legal enquiries. Falls back to contact.phone if empty. Leave blank to omit from the policy.', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('legal.refund_window_days',     '7',                                              'STRING', TRUE, 'Number of days after a donation during which a refund may be requested. Integer as string; frontend parses with parseInt.', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('legal.refund_processing_days', '7',                                              'STRING', TRUE, 'Number of business days after approval during which an approved refund is credited back. Integer as string.', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('legal.effective_date',         'April 2026',                                     'STRING', TRUE, 'Effective/last-updated date printed on legal pages. Update whenever counsel re-reviews the policies.', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    -- Registration numbers. All empty by default; admin fills from their
    -- statutory documents. The footer badge strip renders only the badges
    -- whose value is non-empty, so unset keys simply don't appear.
    -- NOTE: the existing `useRegistrationInfo` hook surfaces a separate
    -- FCRA-style disclosure line. These keys are for the quick-glance
    -- badge strip and are independent of that hook's data source.
    ('legal.registration_80g',       '',                                               'STRING', TRUE, 'Section 80G registration number issued by the Income Tax Department. Rendered in the footer badge strip if set. (Same semantic as legal.80g_number; keep both in sync or alias one in the admin UI.)', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('legal.registration_12a',       '',                                               'STRING', TRUE, 'Section 12A registration number issued by the Income Tax Department. Establishes the trust''s tax-exempt status. Rendered in the footer badge strip if set.', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('legal.registration_fcra',      '',                                               'STRING', TRUE, 'FCRA (Foreign Contribution Regulation Act) registration number issued by the Ministry of Home Affairs. Required to accept foreign donations. Leave empty if the trust is not FCRA-registered.', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('legal.registration_csr1',      '',                                               'STRING', TRUE, 'MCA Form CSR-1 registration number. Required for companies to count contributions as CSR spend under Section 135 of the Companies Act. Leave empty if not registered on CSR-1.', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('legal.registration_pan',       '',                                               'STRING', TRUE, 'PAN of the trust. Useful alongside 12A/80G numbers; shown in the footer badge strip if set. PANs are considered public identifiers and safe to display.', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (setting_key) DO NOTHING;

-- Usage (frontend):
--   RefundPage.tsx:
--     legal.org_name               -> <strong>{orgName}</strong> in every clause
--     legal.registered_address     -> Contact Us section
--     legal.80g_number             -> "under 80G registration number {n}" in Section 7
--     legal.jurisdiction           -> Section 10 Governing Law
--     legal.contact_email          -> mailto: links in Sections 4, 6, Contact, footnote
--     legal.contact_phone          -> optional "(or call us at ...)" in Section 4
--     legal.refund_window_days     -> Section 3 window
--     legal.refund_processing_days -> Section 5 processing SLA
--     legal.effective_date         -> "Last Updated" header
--
--   Layout.tsx footer:
--     legal.registered_address     -> under tagline in brand column
--     legal.registration_80g       -> badge strip above copyright
--     legal.registration_12a       -> badge strip above copyright
--     legal.registration_fcra      -> badge strip above copyright (if set)
--     legal.registration_csr1      -> badge strip above copyright (if set)
--     legal.registration_pan       -> badge strip above copyright (if set)

-- V31: transparency_documents
--
-- Documents the foundation publishes for accountability: registration certificates,
-- annual reports, audit statements, board resolutions, policy documents (privacy,
-- child protection, complaints), funding disclosures, and so on.
--
-- The Transparency page composes these rows with the existing single-row
-- registration_info to render the public /transparency view. Honesty about what
-- doesn't yet exist is left to the admin: rows are simply omitted when there's
-- nothing to publish, and the page falls back to a "we'll publish these as soon
-- as they exist" note (see TransparencyPage.tsx).
--
-- link_url is intentionally a free-form string. We do NOT host file uploads in this
-- slice — admins point to documents already hosted elsewhere (Drive, Dropbox,
-- a static site), which keeps the storage/security surface minimal and lets the
-- foundation pick whichever document host they're comfortable with.
CREATE TABLE transparency_documents (
    id              BIGSERIAL    PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    -- Free-text grouping label for client-side sectioning (e.g. "Annual reports",
    -- "Registration", "Policies"). Same model as faqs.category — admins can rename
    -- categories freely without a migration.
    category        VARCHAR(80),
    link_url        VARCHAR(2000) NOT NULL,
    -- Period/date the document covers or was issued. Null when not applicable.
    issued_date     DATE,
    -- Free-text label for non-date period info, e.g. "FY 2024-25", "Q2 2026".
    -- Renders alongside or instead of issued_date depending on what's set.
    period_label    VARCHAR(80),
    enabled         BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order      INTEGER      NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_by      VARCHAR(120)
);

CREATE INDEX idx_transparency_documents_sort ON transparency_documents (sort_order, id);
CREATE INDEX idx_transparency_documents_enabled ON transparency_documents (enabled) WHERE enabled = TRUE;

-- Three DISABLED seed rows showing the shape of common categories. They never
-- go live until an admin (a) replaces the placeholder URL with a real document
-- and (b) flips enabled to TRUE. Keeping them disabled preserves the page's
-- core promise: nothing here unless it's a real, publishable document.
INSERT INTO transparency_documents
    (title, description, category, link_url, period_label, enabled, sort_order, updated_by)
VALUES
    ('Society / Section 8 registration certificate',
     'Official incorporation document issued by the Registrar. Will be posted here as soon as registration is complete.',
     'Registration',
     'https://example.com/replace-with-real-document',
     NULL,
     FALSE,
     10,
     'system'),
    ('Annual report — first year',
     'Programme summary, beneficiary numbers, and audited financials for our first full reporting year.',
     'Annual reports',
     'https://example.com/replace-with-real-document',
     'FY ending after first full year',
     FALSE,
     20,
     'system'),
    ('Child protection policy',
     'How the foundation safeguards minors in any programme it runs, with a clear complaints route.',
     'Policies',
     'https://example.com/replace-with-real-document',
     NULL,
     FALSE,
     30,
     'system');

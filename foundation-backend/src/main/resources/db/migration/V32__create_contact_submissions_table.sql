-- =========================================================================
-- V32: contact_submissions — stores visitor messages from /contact form
-- =========================================================================
-- Each row is one form submission. CAPTCHA verification happens at the
-- controller layer (Cloudflare Turnstile) before a row is created.
--
-- Submissions are stored so admins can review them from the admin panel.
-- An optional email notification is also sent when mail is configured.
--
-- No foreign keys — visitors are anonymous. IP is stored for abuse
-- investigation but can be cleared on request (GDPR / data-hygiene).
-- =========================================================================

CREATE TABLE contact_submissions (
    id              BIGSERIAL       PRIMARY KEY,
    name            VARCHAR(200)    NOT NULL,
    email           VARCHAR(320)    NOT NULL,
    subject         VARCHAR(200)    NOT NULL,
    message         TEXT            NOT NULL,
    client_ip       VARCHAR(45),        -- IPv4 or IPv6
    status          VARCHAR(20)     NOT NULL DEFAULT 'NEW',  -- NEW / READ / ARCHIVED
    admin_note      TEXT,                -- optional admin response / note
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    read_at         TIMESTAMPTZ,
    read_by         VARCHAR(120)
);

-- Admins typically view newest first and filter by status
CREATE INDEX idx_contact_submissions_status_created
    ON contact_submissions (status, created_at DESC);

-- Rate-limit queries: "how many submissions from this IP in the last hour?"
CREATE INDEX idx_contact_submissions_ip_created
    ON contact_submissions (client_ip, created_at DESC);

-- V23__create_registration_info_table.sql
-- Single-row table holding the foundation's legal registration status.
-- Drives conditional content on the public site (footer disclosure, 80G claims, etc.).

CREATE TABLE registration_info (
    id                   BIGINT       NOT NULL PRIMARY KEY,
    status               VARCHAR(32)  NOT NULL CHECK (status IN ('UNREGISTERED', 'APPLIED', 'APPROVED')),

    -- Identifiers (nullable; populated progressively as registration advances)
    registration_number  VARCHAR(128),
    section8_number      VARCHAR(128),
    eighty_g_number      VARCHAR(128),
    fcra_number          VARCHAR(128),
    pan_number           VARCHAR(32),

    -- Dates
    applied_date         DATE,
    approved_date        DATE,

    -- Optional override for the public disclosure line shown in the footer.
    -- When NULL the frontend renders the default disclosure appropriate for `status`.
    disclosure_override  TEXT,

    -- Audit
    updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by           VARCHAR(255),

    -- Enforce single-row invariant. id is always 1.
    CONSTRAINT chk_registration_info_single_row CHECK (id = 1)
);

-- Seed the single row in UNREGISTERED state.
INSERT INTO registration_info (id, status, updated_by, updated_at)
VALUES (1, 'UNREGISTERED', 'system', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE registration_info IS 'Foundation legal registration state. Exactly one row (id=1). Drives public-site conditional content.';
COMMENT ON COLUMN registration_info.status IS 'UNREGISTERED = no filing; APPLIED = filed, awaiting approval; APPROVED = Section 8 registered';
COMMENT ON COLUMN registration_info.eighty_g_number IS '80G certificate number. Only populated when status=APPROVED and 80G is granted.';
COMMENT ON COLUMN registration_info.fcra_number IS 'FCRA registration for accepting foreign donations. Optional.';
COMMENT ON COLUMN registration_info.disclosure_override IS 'Admin-overridden footer disclosure text. When NULL, frontend picks a default by status.';

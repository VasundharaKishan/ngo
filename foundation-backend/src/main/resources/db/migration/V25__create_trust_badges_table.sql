-- V25: trust_badges
--
-- Ordered list of public-facing trust markers (icon + short title + description).
-- Rendered in two places: the AboutPage trust grid and the site footer trust strip.
--
-- Badges with registration_gated = TRUE are hidden at the service layer unless the
-- RegistrationInfo singleton is in APPROVED status. This is defence-in-depth against
-- accidentally claiming registered status while the NGO is still UNREGISTERED / APPLIED.
--
-- Seeded with the 4 defaults that currently live as hardcoded i18n keys
-- (footer.trust.* and about.trust*). Admins can freely edit, reorder, or disable them.
CREATE TABLE trust_badges (
    id              BIGSERIAL PRIMARY KEY,
    slot_key        VARCHAR(64)  NOT NULL UNIQUE,          -- stable id usable by tests / fallbacks
    icon_emoji      VARCHAR(16)  NOT NULL,
    title           VARCHAR(120) NOT NULL,
    description     VARCHAR(500) NOT NULL,
    enabled         BOOLEAN      NOT NULL DEFAULT TRUE,
    show_in_strip   BOOLEAN      NOT NULL DEFAULT TRUE,    -- surfaces in the compact footer strip
    show_in_grid    BOOLEAN      NOT NULL DEFAULT TRUE,    -- surfaces in the About-page grid
    registration_gated BOOLEAN   NOT NULL DEFAULT FALSE,   -- hidden unless RegistrationInfo = APPROVED
    sort_order      INTEGER      NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_by      VARCHAR(120)
);

CREATE INDEX idx_trust_badges_sort ON trust_badges (sort_order, id);

INSERT INTO trust_badges (slot_key, icon_emoji, title, description, show_in_strip, show_in_grid, registration_gated, sort_order, updated_by)
VALUES
    ('secure',          '🔒',  'Secure Payments',
        'All donations processed via Stripe — PCI-DSS compliant and fully encrypted.',
        TRUE, TRUE, FALSE, 10, 'system'),
    ('registered_ngo',  '🏛️',  'Registered NGO',
        'Legally registered non-governmental organisation with full statutory compliance.',
        TRUE, TRUE, TRUE,  20, 'system'),
    ('zero_fees',       '💯',  'Zero Admin Fees',
        '100% of your donation reaches the campaign. We are volunteer-driven at the core.',
        TRUE, TRUE, FALSE, 30, 'system'),
    ('annual_reports',  '📋',  'Annual Reports',
        'We publish annual impact reports detailing where every rupee went and the outcomes achieved.',
        FALSE, TRUE, FALSE, 40, 'system');

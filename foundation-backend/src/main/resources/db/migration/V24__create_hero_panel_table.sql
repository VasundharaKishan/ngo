-- V24__create_hero_panel_table.sql
-- Singleton editorial hero block for the public home page.
-- Replaces the hero_slides carousel as the primary hero; carousel table is left in place
-- for now (kept off the public Home) to avoid data loss and allow future re-use.

CREATE TABLE hero_panel (
    id                      BIGINT       NOT NULL PRIMARY KEY,

    -- Copy
    eyebrow                 VARCHAR(120),
    headline                VARCHAR(240) NOT NULL,
    subtitle                VARCHAR(500),

    -- Primary call-to-action
    primary_cta_label       VARCHAR(64),
    primary_cta_href        VARCHAR(500),

    -- Optional background image. focus drives object-position on the public render.
    background_image_url    VARCHAR(1000),
    background_focus        VARCHAR(16)  NOT NULL DEFAULT 'CENTER'
                            CHECK (background_focus IN ('CENTER','LEFT','RIGHT','TOP','BOTTOM')),

    -- Visibility toggle. When false, the public page falls back to a static default hero.
    enabled                 BOOLEAN      NOT NULL DEFAULT TRUE,

    -- Audit
    updated_at              TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by              VARCHAR(255),

    -- Single-row invariant
    CONSTRAINT chk_hero_panel_single_row CHECK (id = 1)
);

-- Seed the single row with registration-status-neutral copy.
INSERT INTO hero_panel (
    id, eyebrow, headline, subtitle,
    primary_cta_label, primary_cta_href,
    background_image_url, background_focus, enabled,
    updated_by, updated_at
) VALUES (
    1,
    'Community-led foundation',
    'Support families building their way out of poverty.',
    'Every rupee funds school supplies, meals, and skill training — tracked and reported back every quarter.',
    'Donate now',
    '/campaigns',
    NULL,
    'CENTER',
    TRUE,
    'system',
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE hero_panel IS 'Singleton editorial hero block shown at the top of the public home page.';
COMMENT ON COLUMN hero_panel.background_focus IS 'object-position hint for the background image on the public render.';
COMMENT ON COLUMN hero_panel.enabled IS 'When FALSE the public home page renders a default static hero instead.';

-- V27: money_allocations
--
-- "Where the money goes" — ordered list of program buckets with percentages the
-- foundation discloses to donors. Seeded with placeholder values that match the
-- programs the foundation plans to run; admin will tune these once books open.
--
-- This section is a financial disclosure: the public endpoint returns 204 No Content
-- whenever registration_status is not APPROVED, so visitors never see percentage
-- claims from an unregistered NGO. Admins can still preview and edit at any time.
--
-- Percentages are stored as INTEGER (0-100). We intentionally allow enabled rows
-- to sum to less than or more than 100 — the admin UI surfaces a sum-to-100 warning
-- but does not hard-block, so operators can stage edits without a transactional
-- all-at-once save.
CREATE TABLE money_allocations (
    id              BIGSERIAL    PRIMARY KEY,
    icon_emoji      VARCHAR(16)  NOT NULL,
    label           VARCHAR(120) NOT NULL,
    percentage      INTEGER      NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    description     VARCHAR(500),
    color_hex       VARCHAR(9)   NOT NULL DEFAULT '#0ea5e9',
    enabled         BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order      INTEGER      NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_by      VARCHAR(120)
);

CREATE INDEX idx_money_allocations_sort ON money_allocations (sort_order, id);

-- Seeded with the foundation's stated program mix. Admin will confirm/tune once
-- the first audited year closes. Sums to 100.
INSERT INTO money_allocations
    (icon_emoji, label, percentage, description, color_hex, enabled, sort_order, updated_by)
VALUES
    ('📚', 'Education programs',  60, 'School fees, books, uniforms, and tuition for children from low-income families.',  '#2563eb', TRUE, 10, 'system'),
    ('🏥', 'Healthcare support',   20, 'Medical camps, emergency treatment funds, and maternal care outreach.',           '#16a34a', TRUE, 20, 'system'),
    ('🏘️', 'Community projects',  15, 'Skills training, women''s self-help groups, and rural infrastructure.',           '#f59e0b', TRUE, 30, 'system'),
    ('⚙️', 'Operations & admin',    5, 'Compliance, auditing, technology, and the small core team keeping programs running.', '#64748b', TRUE, 40, 'system');

-- Seed the home_sections row so admin can toggle it on from the homepage manager
-- without another migration. Disabled by default — admin should review the seeded
-- percentages and registration status before enabling.
INSERT INTO home_sections (id, type, enabled, sort_order, config_json, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'money_allocation',
    FALSE,
    55, -- sits between why_donate/stats (typically 40-50) and campaign_carousel (typically 60+)
    '{"title":"Where your donation goes","subtitle":"A transparent breakdown of how we deploy every rupee you give."}',
    NOW(),
    NOW()
);

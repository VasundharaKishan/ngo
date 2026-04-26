-- V28: announcement_bar
--
-- Single-row "announcement bar" that renders at the very top of the public Layout,
-- above the site header. Intended for short, time-boxed messages (campaign goal hit,
-- office closure, matching gift window, policy update) — not for evergreen content.
--
-- Singleton pattern (id = 1 via CHECK constraint) mirrors hero_panel. If we ever need
-- multiple concurrent bars or scheduled rotations, promote to a list table in a later
-- migration — the public endpoint already returns a single envelope so that upgrade
-- would be transparent to the frontend.
--
-- Visibility on the public endpoint requires ALL of:
--   enabled = TRUE
--   NOW() >= COALESCE(starts_at, -infinity)
--   NOW() <= COALESCE(ends_at, +infinity)
-- Outside those conditions the public endpoint returns 204 No Content (short-cached).
-- Admin reads are NOT gated so operators can author messages in advance.
CREATE TABLE announcement_bar (
    id              BIGINT       PRIMARY KEY CHECK (id = 1),
    enabled         BOOLEAN      NOT NULL DEFAULT FALSE,
    icon_emoji      VARCHAR(16),
    message         VARCHAR(500) NOT NULL,
    link_url        VARCHAR(500),
    link_label      VARCHAR(64),
    style           VARCHAR(16)  NOT NULL DEFAULT 'INFO'
                    CHECK (style IN ('INFO', 'SUCCESS', 'WARNING', 'CRITICAL')),
    dismissible     BOOLEAN      NOT NULL DEFAULT TRUE,
    starts_at       TIMESTAMPTZ,
    ends_at         TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_by      VARCHAR(120)
);

-- Seed a disabled placeholder row so the singleton always exists and PUT is a pure
-- update (never an insert). Admin edits and enables it when ready.
INSERT INTO announcement_bar
    (id, enabled, icon_emoji, message, style, dismissible, updated_by)
VALUES
    (1, FALSE, '📣', 'Welcome — our latest update will appear here.', 'INFO', TRUE, 'system');

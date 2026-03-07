-- V21: Fix schema differences between local and production discovered via
--      direct DB comparison. Three issues found:
--
--  1. admin_users.locked_until is TIMESTAMP WITHOUT TIME ZONE on prod but
--     WITH TIME ZONE on local — Spring maps this to Instant/ZonedDateTime
--     which expects timezone-aware timestamps. Incorrect timezone handling
--     could cause account lockouts to expire at the wrong time.
--
--  2. hero_slides.deleted has no DEFAULT on prod (V6 which defined DEFAULT FALSE
--     was skipped via baseline-version=14). Every INSERT must supply it
--     explicitly until this DEFAULT is set.
--
--  3. Performance indexes from V6 and V13 are missing on both local and prod
--     because both DBs were originally set up via Hibernate DDL, not Flyway.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Fix locked_until timezone type
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE admin_users
    ALTER COLUMN locked_until TYPE TIMESTAMP WITH TIME ZONE
    USING locked_until AT TIME ZONE 'UTC';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Set DEFAULT false on hero_slides.deleted
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE hero_slides
    ALTER COLUMN deleted SET DEFAULT FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Add missing performance indexes (IF NOT EXISTS = safe to re-run)
-- ─────────────────────────────────────────────────────────────────────────────

-- From V6: hero_slides query optimisation
CREATE INDEX IF NOT EXISTS idx_hero_slides_enabled_order
    ON hero_slides(enabled, sort_order);

-- From V13: campaigns query optimisation
CREATE INDEX IF NOT EXISTS idx_campaigns_active
    ON campaigns(active);

CREATE INDEX IF NOT EXISTS idx_campaigns_featured
    ON campaigns(featured);

CREATE INDEX IF NOT EXISTS idx_campaigns_category
    ON campaigns(category_id);

-- V13: Add performance indexes for common query patterns
-- These indexes improve pagination, filtering, and donation sum lookups.

-- ─── Campaigns ────────────────────────────────────────────────────────────────

-- Speed up the default campaign list sort (ORDER BY created_at DESC)
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at
    ON campaigns (created_at DESC);

-- Composite index for active campaigns sorted by creation date
-- (used by most public list endpoints: WHERE active = true ORDER BY created_at DESC)
CREATE INDEX IF NOT EXISTS idx_campaigns_active_created
    ON campaigns (active, created_at DESC);

-- ─── Donations ────────────────────────────────────────────────────────────────

-- The N+1 batch query groups by campaign_id and filters by status:
--   SELECT campaign_id, SUM(amount) FROM donations
--   WHERE campaign_id IN (...) AND status = 'SUCCESS'
--   GROUP BY campaign_id
CREATE INDEX IF NOT EXISTS idx_donations_campaign_status
    ON donations (campaign_id, status);

-- Speed up admin donation list (ORDER BY created_at DESC)
CREATE INDEX IF NOT EXISTS idx_donations_created_at
    ON donations (created_at DESC);

-- Stripe webhook lookup by session ID
CREATE INDEX IF NOT EXISTS idx_donations_stripe_session
    ON donations (stripe_session_id);

-- ─── Admin Users ──────────────────────────────────────────────────────────────

-- Enforce uniqueness and speed up login queries on email / username
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_email
    ON admin_users (email);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_username
    ON admin_users (username);

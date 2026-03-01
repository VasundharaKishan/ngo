-- V15: Backfill columns that were added in V7, V8, V9, V11 but may be
--      missing from databases that were created before Flyway was enabled.
--      All statements use IF NOT EXISTS / nullable columns so they are
--      safe to run even if the column already exists.

-- V7: soft-delete flag on hero_slides
ALTER TABLE hero_slides
    ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- V8: account-lockout columns on admin_users
ALTER TABLE admin_users
    ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE admin_users
    ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;

-- V9: image URL on categories
ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS image_url VARCHAR(1024);

-- V11: title and subtitle on hero_slides
ALTER TABLE hero_slides
    ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE hero_slides
    ADD COLUMN IF NOT EXISTS subtitle VARCHAR(500);

-- V14: audit_logs table (safe no-op if already created)
CREATE TABLE IF NOT EXISTS audit_logs (
    id            VARCHAR(36)              PRIMARY KEY,
    action        VARCHAR(50)              NOT NULL,
    entity_type   VARCHAR(100),
    entity_id     VARCHAR(255),
    actor_username VARCHAR(100)            NOT NULL,
    details       TEXT,
    ip_address    VARCHAR(45),
    timestamp     TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_action    ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_actor     ON audit_logs (actor_username);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity    ON audit_logs (entity_type, entity_id);

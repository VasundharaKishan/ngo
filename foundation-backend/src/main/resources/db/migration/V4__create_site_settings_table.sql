-- V4__create_site_settings_table.sql
-- Create site_settings table with type validation and audit tracking

CREATE TABLE site_settings (
    setting_key VARCHAR(255) NOT NULL PRIMARY KEY,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(20) NOT NULL CHECK (setting_type IN ('STRING', 'INTEGER', 'BOOLEAN', 'JSON')),
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255)
);

-- Create index for public settings lookup
CREATE INDEX idx_site_settings_public ON site_settings(is_public);

-- Seed default settings
INSERT INTO site_settings (setting_key, setting_value, setting_type, is_public, description, updated_by, created_at, updated_at)
VALUES
    ('homepage.featured_campaigns_count', '3', 'INTEGER', TRUE, 'Number of featured campaigns to show on homepage', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('campaigns_page.items_per_page', '12', 'INTEGER', TRUE, 'Number of campaigns per page in campaign list', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('site.name', 'Yugal Savitri Seva', 'STRING', TRUE, 'Site name displayed in header and footer', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('site.tagline', 'Empowering communities worldwide', 'STRING', TRUE, 'Site tagline or slogan', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('site.logo_url', '/logo.png', 'STRING', TRUE, 'URL or path to site logo image', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('theme.primary_color', '#667eea', 'STRING', TRUE, 'Primary theme color (hex)', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('theme.secondary_color', '#764ba2', 'STRING', TRUE, 'Secondary theme color (hex)', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('theme.header_height', '76px', 'STRING', TRUE, 'Header height with unit', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('footer.text', '', 'STRING', TRUE, 'Footer copyright or custom text', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('social.facebook', '', 'STRING', TRUE, 'Facebook profile URL', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('social.linkedin', '', 'STRING', TRUE, 'LinkedIn profile URL', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('social.twitter', '', 'STRING', TRUE, 'Twitter/X profile URL', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('maintenance.mode', 'false', 'BOOLEAN', FALSE, 'Enable maintenance mode to block non-admin access', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('donate_popup.spotlight_campaign_id', '', 'STRING', FALSE, 'Campaign ID to feature in Donate Now popup (empty for automatic selection)', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('contact.email', 'info@yugalsavitriseva.org', 'STRING', TRUE, 'Primary contact email address', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('contact.phone', '+977-1-1234567', 'STRING', TRUE, 'Primary contact phone number', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (setting_key) DO NOTHING;

-- Add comments
COMMENT ON TABLE site_settings IS 'Global site configuration settings with type validation';
COMMENT ON COLUMN site_settings.setting_key IS 'Unique identifier for the setting (Primary Key)';
COMMENT ON COLUMN site_settings.setting_value IS 'String representation of the setting value';
COMMENT ON COLUMN site_settings.setting_type IS 'Data type of the value: STRING, INTEGER, BOOLEAN, or JSON';
COMMENT ON COLUMN site_settings.is_public IS 'Whether this setting should be exposed via public API';
COMMENT ON COLUMN site_settings.updated_by IS 'Username of the admin who last updated this setting';

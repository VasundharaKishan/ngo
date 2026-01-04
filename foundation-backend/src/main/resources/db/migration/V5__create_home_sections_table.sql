-- V5__create_home_sections_table.sql
-- Create home_sections table for configurable homepage layout

CREATE TABLE home_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL,
    config_json TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for efficient querying of enabled sections
CREATE INDEX idx_home_sections_enabled_order ON home_sections(enabled, sort_order);

-- Seed default home page sections
INSERT INTO home_sections (id, type, enabled, sort_order, config_json, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'hero_carousel', TRUE, 1, '{"autoplay":true,"interval":5000,"showArrows":true}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'hero_content', TRUE, 2, '{"title":"Make a Difference Today","subtitle":"Your donation can change lives","ctaText":"Donate Now","ctaLink":"/campaigns"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'featured_campaigns', TRUE, 3, '{"title":"Featured Campaigns","limit":3,"showProgress":true}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'stats', TRUE, 4, '{"title":"Our Impact","animated":true}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'why_donate', TRUE, 5, '{"title":"Why Donate","items":[{"icon":"🎯","title":"Direct Impact","description":"100% of donations go directly to those in need"},{"icon":"🌍","title":"Global Reach","description":"Supporting communities across the world"},{"icon":"💝","title":"Transparent","description":"Full transparency on how funds are used"}]}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'testimonials', FALSE, 6, '{"title":"What People Say","autoScroll":true}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add comments
COMMENT ON TABLE home_sections IS 'Configurable homepage sections with ordering and JSON configuration';
COMMENT ON COLUMN home_sections.type IS 'Section type: hero_carousel, hero_content, featured_campaigns, stats, why_donate, testimonials, etc.';
COMMENT ON COLUMN home_sections.enabled IS 'Whether this section is currently displayed on homepage';
COMMENT ON COLUMN home_sections.sort_order IS 'Display order (lower numbers appear first)';
COMMENT ON COLUMN home_sections.config_json IS 'JSON configuration specific to section type';

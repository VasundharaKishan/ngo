-- V6__create_hero_slides_table.sql
-- Create hero_slides table for carousel slides with focus positioning

CREATE TABLE hero_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255) NOT NULL,
    focus VARCHAR(20) NOT NULL DEFAULT 'CENTER',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for efficient querying of enabled slides
CREATE INDEX idx_hero_slides_enabled_order ON hero_slides(enabled, sort_order);

-- Add constraint for focus enum values
ALTER TABLE hero_slides ADD CONSTRAINT chk_hero_slides_focus 
    CHECK (focus IN ('CENTER', 'LEFT', 'RIGHT', 'TOP', 'BOTTOM'));

-- Seed default hero slides (from existing carousel images)
INSERT INTO hero_slides (id, image_url, alt_text, focus, enabled, sort_order, created_at, updated_at)
VALUES
    (gen_random_uuid(), '/disaster_relief.png', 'Disaster Relief', 'RIGHT', TRUE, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), '/community_empower.png', 'Community Empowerment', 'CENTER', TRUE, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), '/santitation_hygiene.png', 'Sanitation & Hygiene', 'RIGHT', TRUE, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), '/women_self_help_groups.png', 'Women Self Help Groups', 'RIGHT', TRUE, 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), '/skill_development.png', 'Skill Development', 'CENTER', TRUE, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), '/rural_development.png', 'Rural Development', 'RIGHT', TRUE, 60, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), '/child_nutrition.png', 'Child Nutrition', 'CENTER', TRUE, 70, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), '/elderly_care.png', 'Elderly Care', 'RIGHT', TRUE, 80, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), '/health_care.png', 'Health Care', 'CENTER', TRUE, 90, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), '/children_education.png', 'Children Education', 'RIGHT', TRUE, 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), '/clean_water.png', 'Clean Water', 'CENTER', TRUE, 110, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), '/empowering_women.png', 'Empowering Women', 'RIGHT', TRUE, 120, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), '/hunger.png', 'Fighting Hunger', 'CENTER', TRUE, 130, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add comments
COMMENT ON TABLE hero_slides IS 'Hero carousel slides with focus positioning for image display';
COMMENT ON COLUMN hero_slides.image_url IS 'URL or path to slide image';
COMMENT ON COLUMN hero_slides.alt_text IS 'Accessibility text for image';
COMMENT ON COLUMN hero_slides.focus IS 'Image focus position: CENTER, LEFT, RIGHT, TOP, BOTTOM';
COMMENT ON COLUMN hero_slides.enabled IS 'Whether this slide is currently displayed in carousel';
COMMENT ON COLUMN hero_slides.sort_order IS 'Display order (lower numbers appear first)';

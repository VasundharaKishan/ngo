-- V10: Add campaign carousel section to home page layout
-- This adds the 'campaign_carousel' section which renders all active campaigns
-- as a full-width image slideshow with title + subtitle overlay on the Home page.

INSERT INTO home_sections (id, type, enabled, sort_order, config_json, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'campaign_carousel',
    TRUE,
    15,
    '{"title":"Our Campaigns","limit":18,"featured":false}',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

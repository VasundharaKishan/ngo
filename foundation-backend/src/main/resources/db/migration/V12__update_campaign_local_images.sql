-- Replace Unsplash URLs with dedicated local images for 4 campaigns
-- Images are served from the frontend /public folder (Vite static assets)
UPDATE campaigns SET image_url = '/food_bank.png',           updated_at = CURRENT_TIMESTAMP WHERE id = 'camp-food-003';
UPDATE campaigns SET image_url = '/tailoring_training.png',  updated_at = CURRENT_TIMESTAMP WHERE id = 'camp-skill-002';
UPDATE campaigns SET image_url = '/village_water_wells.png', updated_at = CURRENT_TIMESTAMP WHERE id = 'camp-water-001';
UPDATE campaigns SET image_url = '/water_purifiers.png',     updated_at = CURRENT_TIMESTAMP WHERE id = 'camp-water-002';

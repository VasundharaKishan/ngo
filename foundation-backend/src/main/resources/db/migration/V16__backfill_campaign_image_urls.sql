-- V16: Apply image URL updates from V12 that were skipped on production
--      because baseline-version=14 causes Flyway to skip V1–V14.
--      Only updates rows where image_url is null or still pointing to an
--      old broken path so re-running is safe.

UPDATE campaigns
SET    image_url  = '/food_bank.png',
       updated_at = CURRENT_TIMESTAMP
WHERE  id = 'camp-food-003'
  AND  (image_url IS NULL OR image_url NOT LIKE '%food_bank%');

UPDATE campaigns
SET    image_url  = '/tailoring_training.png',
       updated_at = CURRENT_TIMESTAMP
WHERE  id = 'camp-skill-002'
  AND  (image_url IS NULL OR image_url NOT LIKE '%tailoring%');

UPDATE campaigns
SET    image_url  = '/village_water_wells.png',
       updated_at = CURRENT_TIMESTAMP
WHERE  id = 'camp-water-001'
  AND  (image_url IS NULL OR image_url NOT LIKE '%village_water%');

UPDATE campaigns
SET    image_url  = '/water_purifiers.png',
       updated_at = CURRENT_TIMESTAMP
WHERE  id = 'camp-water-002'
  AND  (image_url IS NULL OR image_url NOT LIKE '%water_purifiers%');

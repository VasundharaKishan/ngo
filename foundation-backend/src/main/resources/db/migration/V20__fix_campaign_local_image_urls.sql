-- V20: Replace local image paths set by V16 with Unsplash CDN URLs.
--      V16 set these campaigns to local PNG paths (e.g. /food_bank.png)
--      which do not exist on the production server. Replace with Unsplash URLs.
--      WHERE guards on LIKE '%unsplash%' make this idempotent.

UPDATE campaigns
SET    image_url  = 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&auto=format&q=80',
       updated_at = CURRENT_TIMESTAMP
WHERE  id = 'camp-food-003'
  AND  image_url NOT LIKE '%unsplash%';

UPDATE campaigns
SET    image_url  = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&q=80',
       updated_at = CURRENT_TIMESTAMP
WHERE  id = 'camp-skill-002'
  AND  image_url NOT LIKE '%unsplash%';

UPDATE campaigns
SET    image_url  = 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?w=800&auto=format&q=80',
       updated_at = CURRENT_TIMESTAMP
WHERE  id = 'camp-water-001'
  AND  image_url NOT LIKE '%unsplash%';

UPDATE campaigns
SET    image_url  = 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&auto=format&q=80',
       updated_at = CURRENT_TIMESTAMP
WHERE  id = 'camp-water-002'
  AND  image_url NOT LIKE '%unsplash%';

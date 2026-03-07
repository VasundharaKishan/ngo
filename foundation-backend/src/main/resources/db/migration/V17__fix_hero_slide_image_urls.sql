-- V17: Replace old local hero slide image URLs with Unsplash URLs.
--      The original PNG files (disaster_relief.png, community_empower.png, etc.)
--      were removed from the frontend public/ folder during a refactor.
--      Those local paths now 404, making the hero carousel appear completely black.

UPDATE hero_slides SET image_url = 'https://images.unsplash.com/photo-1587093336587-eeca6cb17cf8?w=1600&auto=format&q=80'
WHERE alt_text = 'Disaster Relief'         AND deleted = FALSE;

UPDATE hero_slides SET image_url = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&auto=format&q=80'
WHERE alt_text = 'Community Empowerment'   AND deleted = FALSE;

UPDATE hero_slides SET image_url = 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=1600&auto=format&q=80'
WHERE alt_text = 'Sanitation & Hygiene'    AND deleted = FALSE;

UPDATE hero_slides SET image_url = 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1600&auto=format&q=80'
WHERE alt_text = 'Women Self Help Groups'  AND deleted = FALSE;

UPDATE hero_slides SET image_url = 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1600&auto=format&q=80'
WHERE alt_text = 'Skill Development'       AND deleted = FALSE;

UPDATE hero_slides SET image_url = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1600&auto=format&q=80'
WHERE alt_text = 'Rural Development'       AND deleted = FALSE;

UPDATE hero_slides SET image_url = 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1600&auto=format&q=80'
WHERE alt_text = 'Child Nutrition'         AND deleted = FALSE;

UPDATE hero_slides SET image_url = 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1600&auto=format&q=80'
WHERE alt_text = 'Elderly Care'            AND deleted = FALSE;

UPDATE hero_slides SET image_url = 'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=1600&auto=format&q=80'
WHERE alt_text = 'Health Care'             AND deleted = FALSE;

UPDATE hero_slides SET image_url = 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1600&auto=format&q=80'
WHERE alt_text = 'Children Education'      AND deleted = FALSE;

UPDATE hero_slides SET image_url = 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=1600&auto=format&q=80'
WHERE alt_text = 'Clean Water'             AND deleted = FALSE;

UPDATE hero_slides SET image_url = 'https://images.unsplash.com/photo-1509099652299-30938b0aeb63?w=1600&auto=format&q=80'
WHERE alt_text = 'Empowering Women'        AND deleted = FALSE;

UPDATE hero_slides SET image_url = 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1600&auto=format&q=80'
WHERE alt_text = 'Fighting Hunger'         AND deleted = FALSE;

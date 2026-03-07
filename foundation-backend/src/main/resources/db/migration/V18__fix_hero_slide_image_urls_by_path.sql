-- V18: Fix broken hero slide images by matching on the old local image path.
--      V17 used alt_text matching but those rows had different alt_text in
--      production (V6 seed data never ran since it is below baseline-version 14).
--      Matching on image_url path is more reliable — we know exactly what the
--      deleted filenames were.

UPDATE hero_slides SET image_url = 'https://images.unsplash.com/photo-1587093336587-eeca6cb17cf8?w=1600&auto=format&q=80'
WHERE image_url = '/disaster_relief.png';

UPDATE hero_slides SET image_url = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&auto=format&q=80'
WHERE image_url = '/community_empower.png';

UPDATE hero_slides SET image_url = 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=1600&auto=format&q=80'
WHERE image_url = '/santitation_hygiene.png';

UPDATE hero_slides SET image_url = 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1600&auto=format&q=80'
WHERE image_url = '/women_self_help_groups.png';

UPDATE hero_slides SET image_url = 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1600&auto=format&q=80'
WHERE image_url = '/skill_development.png';

UPDATE hero_slides SET image_url = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1600&auto=format&q=80'
WHERE image_url = '/rural_development.png';

UPDATE hero_slides SET image_url = 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1600&auto=format&q=80'
WHERE image_url = '/child_nutrition.png';

UPDATE hero_slides SET image_url = 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1600&auto=format&q=80'
WHERE image_url = '/elderly_care.png';

UPDATE hero_slides SET image_url = 'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=1600&auto=format&q=80'
WHERE image_url = '/health_care.png';

UPDATE hero_slides SET image_url = 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1600&auto=format&q=80'
WHERE image_url = '/children_education.png';

UPDATE hero_slides SET image_url = 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=1600&auto=format&q=80'
WHERE image_url = '/clean_water.png';

UPDATE hero_slides SET image_url = 'https://images.unsplash.com/photo-1509099652299-30938b0aeb63?w=1600&auto=format&q=80'
WHERE image_url = '/empowering_women.png';

UPDATE hero_slides SET image_url = 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1600&auto=format&q=80'
WHERE image_url = '/hunger.png';

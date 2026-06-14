-- V34: Fix campaign images that were broken, wrong, or mismatched
-- Replaces 9 Unsplash images that didn't align with their campaign content

-- #1  Build School in Rural Village — was: generic book stack → now: Indian classroom
UPDATE campaigns SET image_url = 'https://images.unsplash.com/photo-1688789029020-6c5b8b22305a?w=800'
WHERE id = 'camp-edu-001';

-- #2  Scholarship Fund for Girls — was: apple on books → now: Indian schoolgirls in uniform
UPDATE campaigns SET image_url = 'https://images.unsplash.com/flagged/photo-1574097656146-0b43b7660cb6?w=800'
WHERE id = 'camp-edu-002';

-- #6  Food Bank — was: duplicate of Community Kitchen image → now: volunteers sorting canned food
UPDATE campaigns SET image_url = 'https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?w=800'
WHERE id = 'camp-food-003';

-- #7  Irrigation for Farmers — was: crop seedlings (no irrigation) → now: sprinkler irrigation on field
UPDATE campaigns SET image_url = 'https://images.unsplash.com/photo-1743742566156-f1745850281a?w=800'
WHERE id = 'camp-agri-001';

-- #11 Maternity Care — was: generic clasped hands → now: pregnant woman
UPDATE campaigns SET image_url = 'https://images.unsplash.com/photo-1457342813143-a1ae27448a82?w=800'
WHERE id = 'camp-health-003';

-- #13 Tailoring Training — was: metalworking/crafting → now: sewing machine with fabric
UPDATE campaigns SET image_url = 'https://plus.unsplash.com/premium_photo-1664195857591-968c2a9f2c03?w=800'
WHERE id = 'camp-skill-002';

-- #15 Self Defense Training — was: battle ropes fitness → now: woman doing karate kick
UPDATE campaigns SET image_url = 'https://plus.unsplash.com/premium_photo-1667941272772-70243b7b4f63?w=800'
WHERE id = 'camp-women-002';

-- #17 Village Water Wells — was: BROKEN 404 link → now: hand water pump
UPDATE campaigns SET image_url = 'https://images.unsplash.com/photo-1771619643236-5f710672c3be?w=800'
WHERE id = 'camp-water-001';

-- #18 Water Purifiers for Schools — was: boxing gym (completely wrong) → now: people at water taps
UPDATE campaigns SET image_url = 'https://images.unsplash.com/photo-1629805019342-9acdfabfc990?w=800'
WHERE id = 'camp-water-002';

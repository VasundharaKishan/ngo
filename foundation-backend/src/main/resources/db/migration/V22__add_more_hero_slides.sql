-- V22: Add 10 more hero slides to bring total from 8 → 18.
--      All NOT NULL columns supplied explicitly (prod table has no column
--      defaults — V6 which defined them was skipped via baseline-version=14).

INSERT INTO hero_slides (id, image_url, alt_text, focus, enabled, deleted, sort_order, title, subtitle, created_at, updated_at)
VALUES
    (gen_random_uuid(),
     'https://images.unsplash.com/photo-1587093336587-eeca6cb17cf8?w=1600&auto=format&q=80',
     'Disaster Relief', 'CENTER', TRUE, FALSE, 90,
     'Standing Together in Crisis',
     'Rapid response to natural disasters and emergencies', NOW(), NOW()),

    (gen_random_uuid(),
     'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&auto=format&q=80',
     'Community Empowerment', 'CENTER', TRUE, FALSE, 100,
     'Stronger Communities Together',
     'Building resilient local communities from the ground up', NOW(), NOW()),

    (gen_random_uuid(),
     'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=1600&auto=format&q=80',
     'Sanitation and Hygiene', 'CENTER', TRUE, FALSE, 110,
     'Clean Sanitation, Healthy Lives',
     'Bringing safe sanitation and hygiene education to rural areas', NOW(), NOW()),

    (gen_random_uuid(),
     'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1600&auto=format&q=80',
     'Women Self Help Groups', 'CENTER', TRUE, FALSE, 120,
     'Women Leading Change',
     'Empowering women through self-help groups and micro-finance', NOW(), NOW()),

    (gen_random_uuid(),
     'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1600&auto=format&q=80',
     'Elderly Care', 'CENTER', TRUE, FALSE, 130,
     'Caring for Our Elders',
     'Providing dignity and support to senior citizens in need', NOW(), NOW()),

    (gen_random_uuid(),
     'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1600&auto=format&q=80',
     'Fighting Hunger', 'CENTER', TRUE, FALSE, 140,
     'No One Should Go Hungry',
     'Distributing nutritious meals to families facing food insecurity', NOW(), NOW()),

    (gen_random_uuid(),
     'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=1600&auto=format&q=80',
     'Child Rights', 'CENTER', TRUE, FALSE, 150,
     'Every Child Has Rights',
     'Protecting children from exploitation and ensuring their future', NOW(), NOW()),

    (gen_random_uuid(),
     'https://images.unsplash.com/photo-1509099652299-30938b0aeb63?w=1600&auto=format&q=80',
     'Empowering Women', 'CENTER', TRUE, FALSE, 160,
     'Invest in Women, Invest in the Future',
     'Skill development and economic inclusion for women', NOW(), NOW()),

    (gen_random_uuid(),
     'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1600&auto=format&q=80',
     'Rural Development', 'CENTER', TRUE, FALSE, 170,
     'Transforming Rural Lives',
     'Infrastructure, livelihoods, and opportunity for rural communities', NOW(), NOW()),

    (gen_random_uuid(),
     'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1600&auto=format&q=80',
     'Skill Development', 'CENTER', TRUE, FALSE, 180,
     'Skills for a Better Tomorrow',
     'Vocational training and digital literacy for youth', NOW(), NOW());

-- Add optional title and subtitle overlay text to hero slides
-- Both columns are nullable for backward compatibility with existing slides
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS subtitle VARCHAR(500);

-- Pre-populate seeded slides with descriptive text (matches V6 alt_text values)
UPDATE hero_slides SET
  title = 'Disaster Relief',
  subtitle = 'Emergency support for communities in crisis'
WHERE alt_text = 'Disaster Relief' AND deleted = FALSE;

UPDATE hero_slides SET
  title = 'Community Empowerment',
  subtitle = 'Building stronger communities together'
WHERE alt_text = 'Community Empowerment' AND deleted = FALSE;

UPDATE hero_slides SET
  title = 'Sanitation & Hygiene',
  subtitle = 'Clean water and sanitation for every family'
WHERE alt_text = 'Sanitation & Hygiene' AND deleted = FALSE;

UPDATE hero_slides SET
  title = 'Women Self Help Groups',
  subtitle = 'Empowering women through financial independence'
WHERE alt_text = 'Women Self Help Groups' AND deleted = FALSE;

UPDATE hero_slides SET
  title = 'Skill Development',
  subtitle = 'Vocational training for a better livelihood'
WHERE alt_text = 'Skill Development' AND deleted = FALSE;

UPDATE hero_slides SET
  title = 'Rural Development',
  subtitle = 'Transforming villages one step at a time'
WHERE alt_text = 'Rural Development' AND deleted = FALSE;

UPDATE hero_slides SET
  title = 'Child Nutrition',
  subtitle = 'Ensuring every child grows up healthy and strong'
WHERE alt_text = 'Child Nutrition' AND deleted = FALSE;

UPDATE hero_slides SET
  title = 'Elderly Care',
  subtitle = 'Dignity and care for our senior community members'
WHERE alt_text = 'Elderly Care' AND deleted = FALSE;

UPDATE hero_slides SET
  title = 'Health Care',
  subtitle = 'Quality healthcare accessible to all'
WHERE alt_text = 'Health Care' AND deleted = FALSE;

UPDATE hero_slides SET
  title = 'Children Education',
  subtitle = 'Every child deserves the right to learn'
WHERE alt_text = 'Children Education' AND deleted = FALSE;

UPDATE hero_slides SET
  title = 'Clean Water',
  subtitle = 'Safe drinking water for rural communities'
WHERE alt_text = 'Clean Water' AND deleted = FALSE;

UPDATE hero_slides SET
  title = 'Empowering Women',
  subtitle = 'Helping women lead, thrive and inspire'
WHERE alt_text = 'Empowering Women' AND deleted = FALSE;

UPDATE hero_slides SET
  title = 'Fighting Hunger',
  subtitle = 'No one should go to bed hungry'
WHERE alt_text = 'Fighting Hunger' AND deleted = FALSE;

-- Disable the campaign_carousel home section (superseded by hero carousel with text overlay)
UPDATE home_sections SET enabled = FALSE WHERE type = 'campaign_carousel';

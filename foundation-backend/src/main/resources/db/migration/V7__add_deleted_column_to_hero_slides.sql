-- V7__add_deleted_column_to_hero_slides.sql
-- Add missing deleted column to hero_slides table for soft delete functionality

ALTER TABLE hero_slides 
ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- Add comment
COMMENT ON COLUMN hero_slides.deleted IS 'Soft delete flag - true if slide is deleted';

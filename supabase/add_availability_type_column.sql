-- Add availability_type column to coach_availability table
-- This allows coaches to specify what type of availability each slot is for

-- Add the column with a default value
ALTER TABLE coach_availability
  ADD COLUMN IF NOT EXISTS availability_type text DEFAULT 'GENERAL'
  CHECK (availability_type IN ('GENERAL', 'CLASS', 'PRIVATE', 'GROUP'));

-- Update existing records to have 'GENERAL' as the default (if they're null)
UPDATE coach_availability
SET availability_type = 'GENERAL'
WHERE availability_type IS NULL;

-- Add a comment to explain the column
COMMENT ON COLUMN coach_availability.availability_type IS 'Type of availability: GENERAL (any booking type), CLASS (for group classes), PRIVATE (1-on-1 sessions), GROUP (small group sessions)';

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_coach_availability_type ON coach_availability(availability_type);


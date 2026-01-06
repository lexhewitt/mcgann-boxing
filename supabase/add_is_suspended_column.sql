-- Add is_suspended column to coaches table
-- This allows admins to suspend/pause other admins

ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_coaches_is_suspended ON coaches(is_suspended);

-- Verify the column was added
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'coaches' 
  AND column_name = 'is_suspended';


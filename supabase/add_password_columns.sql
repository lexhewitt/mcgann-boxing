-- Add password columns to members and coaches tables
-- Run this in Supabase SQL Editor

-- Add password column to members table
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS password_hash text;

-- Add password column to coaches table
ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS password_hash text;

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_coaches_email ON coaches(email);

-- Note: Existing users will have NULL password_hash
-- They will need to set a password on first login or via admin reset



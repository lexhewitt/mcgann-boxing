-- Check if whatsapp_auto_reply_enabled column exists in coaches table
-- Run this in Supabase SQL Editor to verify the column exists

-- Method 1: Check column exists
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'coaches' 
  AND column_name = 'whatsapp_auto_reply_enabled';

-- Method 2: Check all columns in coaches table
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'coaches'
ORDER BY ordinal_position;

-- Method 3: If column doesn't exist, add it manually:
-- ALTER TABLE coaches 
--   ADD COLUMN IF NOT EXISTS whatsapp_auto_reply_enabled boolean DEFAULT true;

-- Method 4: Check current values for all coaches
SELECT 
    id, 
    name, 
    whatsapp_auto_reply_enabled,
    mobile_number
FROM coaches;



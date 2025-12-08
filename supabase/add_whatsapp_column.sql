-- Add whatsapp_auto_reply_enabled column to coaches table
-- Run this in Supabase SQL Editor

ALTER TABLE coaches 
  ADD COLUMN IF NOT EXISTS whatsapp_auto_reply_enabled boolean DEFAULT true;

-- Verify it was added
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'coaches' 
  AND column_name = 'whatsapp_auto_reply_enabled';

-- Update all existing coaches to have auto-reply enabled by default (if needed)
UPDATE coaches 
SET whatsapp_auto_reply_enabled = true 
WHERE whatsapp_auto_reply_enabled IS NULL;


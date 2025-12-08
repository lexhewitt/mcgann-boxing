-- Add whatsapp_auto_reply_message column to coaches table
-- Run this in Supabase SQL Editor

ALTER TABLE coaches 
  ADD COLUMN IF NOT EXISTS whatsapp_auto_reply_message text;

-- Verify it was added
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'coaches' 
  AND column_name = 'whatsapp_auto_reply_message';


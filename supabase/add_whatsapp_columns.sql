-- Add WhatsApp-related columns to coaches table if they don't exist
-- Run this in Supabase SQL Editor

ALTER TABLE coaches
  ADD COLUMN IF NOT EXISTS whatsapp_auto_reply_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS whatsapp_auto_reply_message text,
  ADD COLUMN IF NOT EXISTS mobile_number text,
  ADD COLUMN IF NOT EXISTS image_url text;

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'coaches' 
  AND column_name IN ('whatsapp_auto_reply_enabled', 'whatsapp_auto_reply_message', 'mobile_number', 'image_url')
ORDER BY column_name;




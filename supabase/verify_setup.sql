-- Verify database setup is complete
-- Run this to check everything is in place

-- 1. Check coaches table exists
SELECT 'coaches table exists' as status, COUNT(*) as count
FROM information_schema.tables 
WHERE table_name = 'coaches';

-- 2. Check whatsapp_auto_reply_enabled column exists
SELECT 
    'whatsapp_auto_reply_enabled column' as status,
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'coaches' 
  AND column_name = 'whatsapp_auto_reply_enabled';

-- 3. Check all coaches and their auto-reply settings
SELECT 
    id,
    name,
    whatsapp_auto_reply_enabled,
    mobile_number
FROM coaches
ORDER BY name;

-- 4. Count total coaches
SELECT COUNT(*) as total_coaches FROM coaches;


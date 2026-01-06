-- Quick fix to set Lex as SUPERADMIN
-- Run this in Supabase SQL Editor

-- Update Lex's admin level to SUPERADMIN
UPDATE coaches 
SET 
  role = 'ADMIN', 
  admin_level = 'SUPERADMIN'
WHERE email = 'lexhewitt@gmail.com';

-- Verify the update
SELECT 
  id,
  name,
  email,
  role,
  admin_level,
  CASE 
    WHEN admin_level = 'SUPERADMIN' THEN '✓ SUPERADMIN'
    WHEN admin_level IS NULL THEN '✗ Not set'
    ELSE admin_level
  END as status
FROM coaches
WHERE email = 'lexhewitt@gmail.com';


-- Set both Sean McGann and Lex Hewitt as SUPERADMIN
-- Run this in Supabase SQL Editor
-- This ensures both admins have the correct admin level

-- Update Sean to SUPERADMIN
UPDATE coaches 
SET 
  role = 'ADMIN', 
  admin_level = 'SUPERADMIN'
WHERE email = 'sean@fleetwoodboxing.co.uk';

-- Update Lex to SUPERADMIN
UPDATE coaches 
SET 
  role = 'ADMIN', 
  admin_level = 'SUPERADMIN'
WHERE email = 'lexhewitt@gmail.com';

-- Verify both are set correctly
SELECT 
  name,
  email,
  role,
  admin_level,
  CASE 
    WHEN admin_level = 'SUPERADMIN' THEN '✓ SUPERADMIN'
    WHEN admin_level IS NULL THEN '✗ Not Set'
    ELSE admin_level
  END as status,
  CASE 
    WHEN password_hash IS NOT NULL THEN '✓ Password Set'
    ELSE '✗ No Password'
  END as password_status
FROM coaches
WHERE email IN ('sean@fleetwoodboxing.co.uk', 'lexhewitt@gmail.com')
ORDER BY name;

-- Show summary
SELECT 
  COUNT(*) FILTER (WHERE admin_level = 'SUPERADMIN') as superadmins_count,
  COUNT(*) FILTER (WHERE role = 'ADMIN' AND admin_level IS NULL) as admins_without_level,
  COUNT(*) FILTER (WHERE role = 'ADMIN') as total_admins
FROM coaches;


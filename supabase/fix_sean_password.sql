-- Fix Sean McGann's password in Supabase
-- Run this in Supabase SQL Editor
-- This will check both coaches and members tables and set the password

-- First, check if Sean exists in coaches table
SELECT 
  'coaches' as table_name,
  id,
  name,
  email,
  role,
  CASE 
    WHEN password_hash IS NOT NULL THEN 'Password set'
    ELSE 'No password'
  END as password_status,
  password_hash
FROM coaches
WHERE email = 'sean@fleetwoodboxing.co.uk' OR email = 'sean@fleetwoodboxing.co.uk';

-- Update Sean's password in coaches table (if he exists there)
UPDATE coaches
SET password_hash = '$2b$10$gWWN0MRUMu8Ypz3t50aWx.N3ng9LH3qkpqWFCBKJH4NLstXdjK3wK'
WHERE email = 'sean@fleetwoodboxing.co.uk';

-- Also check members table (just in case)
SELECT 
  'members' as table_name,
  id,
  name,
  email,
  CASE 
    WHEN password_hash IS NOT NULL THEN 'Password set'
    ELSE 'No password'
  END as password_status,
  password_hash
FROM members
WHERE email = 'sean@fleetwoodboxing.co.uk';

-- Update Sean's password in members table (if he exists there)
UPDATE members
SET password_hash = '$2b$10$gWWN0MRUMu8Ypz3t50aWx.N3ng9LH3qkpqWFCBKJH4NLstXdjK3wK'
WHERE email = 'sean@fleetwoodboxing.co.uk';

-- Final verification - show Sean's status from both tables
SELECT 
  'coaches' as table_name,
  id,
  name,
  email,
  role,
  CASE 
    WHEN password_hash IS NOT NULL THEN 'Password set ✓'
    ELSE 'No password ✗'
  END as password_status
FROM coaches
WHERE email = 'sean@fleetwoodboxing.co.uk'
UNION ALL
SELECT 
  'members' as table_name,
  id,
  name,
  email,
  role,
  CASE 
    WHEN password_hash IS NOT NULL THEN 'Password set ✓'
    ELSE 'No password ✗'
  END as password_status
FROM members
WHERE email = 'sean@fleetwoodboxing.co.uk';


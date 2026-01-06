-- Set Lex Hewitt's password and ensure they're configured as SUPERADMIN
-- Run this in Supabase SQL Editor
-- Password: Gabr1el

-- First, check if Lex exists in coaches table
SELECT 
  'coaches' as table_name,
  id,
  name,
  email,
  role,
  admin_level,
  CASE 
    WHEN password_hash IS NOT NULL THEN 'Password set'
    ELSE 'No password'
  END as password_status
FROM coaches
WHERE email = 'lexhewitt@gmail.com';

-- Ensure Lex exists in coaches table as SUPERADMIN
-- First, check if they exist as a coach
INSERT INTO coaches (id, name, email, role, admin_level, password_hash, created_at)
SELECT 
  'coach_lex_hewitt',
  'Lex Hewitt',
  'lexhewitt@gmail.com',
  'ADMIN',
  'SUPERADMIN',
  '$2b$10$GwmRNZZTGVQZuh8OYY4mvurWLQeL8ydv3uNY0/HJClIFxBe8yqltK',
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM coaches WHERE email = 'lexhewitt@gmail.com'
);

-- Update Lex's password and ensure they're SUPERADMIN
UPDATE coaches 
SET 
  role = 'ADMIN', 
  admin_level = 'SUPERADMIN',
  name = 'Lex Hewitt',
  password_hash = '$2b$10$GwmRNZZTGVQZuh8OYY4mvurWLQeL8ydv3uNY0/HJClIFxBe8yqltK'
WHERE email = 'lexhewitt@gmail.com';

-- Remove Lex from members table if they exist there
DELETE FROM members 
WHERE email = 'lexhewitt@gmail.com';

-- Final verification - show Lex's status
SELECT 
  'coaches' as table_name,
  id,
  name,
  email,
  role,
  admin_level,
  CASE 
    WHEN password_hash IS NOT NULL THEN 'Password set ✓'
    ELSE 'No password ✗'
  END as password_status,
  created_at
FROM coaches
WHERE email = 'lexhewitt@gmail.com';

-- Verify Lex is NOT in members table
SELECT 
  'members' as table_name,
  COUNT(*) as lex_count,
  CASE 
    WHEN COUNT(*) = 0 THEN 'Lex removed from members ✓'
    ELSE 'Lex still in members ✗'
  END as status
FROM members
WHERE email = 'lexhewitt@gmail.com';


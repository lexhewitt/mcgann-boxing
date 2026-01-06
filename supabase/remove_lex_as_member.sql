-- Remove Lex Hewitt from members table
-- Lex should only exist as a Super Admin in the coaches table

-- Delete Lex from members table if they exist
DELETE FROM members 
WHERE email = 'lexhewitt@gmail.com';

-- Ensure Lex exists in coaches table as SUPERADMIN
-- First, check if they exist as a coach
INSERT INTO coaches (id, name, email, role, admin_level, created_at)
SELECT 
  'coach_lex_hewitt',
  'Lex Hewitt',
  'lexhewitt@gmail.com',
  'ADMIN',
  'SUPERADMIN',
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM coaches WHERE email = 'lexhewitt@gmail.com'
);

-- If they already exist, update them to SUPERADMIN
UPDATE coaches 
SET 
  role = 'ADMIN', 
  admin_level = 'SUPERADMIN',
  name = 'Lex Hewitt'
WHERE email = 'lexhewitt@gmail.com';

-- Verify the changes
SELECT 
  'Members table' as table_name,
  COUNT(*) as lex_count
FROM members 
WHERE email = 'lexhewitt@gmail.com'
UNION ALL
SELECT 
  'Coaches table' as table_name,
  COUNT(*) as lex_count
FROM coaches 
WHERE email = 'lexhewitt@gmail.com';

-- Show Lex's current status in coaches
SELECT 
  id,
  name,
  email,
  role,
  admin_level,
  created_at
FROM coaches 
WHERE email = 'lexhewitt@gmail.com';


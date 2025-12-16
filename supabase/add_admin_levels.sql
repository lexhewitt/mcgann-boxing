-- Add admin_level column to coaches table
-- SUPERADMIN: Full access, can create/manage other admins
-- FULL_ADMIN: Full access except cannot create/manage admins
-- STANDARD_ADMIN: Cannot delete members, coaches, classes, sessions
-- COACH: Regular coach, no admin access

ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS admin_level text DEFAULT NULL;

-- Update existing admins to SUPERADMIN (Sean should be SUPERADMIN)
-- Update this query to match Sean's email
UPDATE coaches 
SET admin_level = 'SUPERADMIN' 
WHERE role = 'ADMIN' AND email = 'sean@fleetwoodboxing.co.uk';

-- Create lexhewitt@gmail.com as SUPERADMIN if they don't exist
-- First check if they exist as a coach
INSERT INTO coaches (id, name, email, role, admin_level, created_at)
SELECT 
  'coach_' || substr(gen_random_uuid()::text, 1, 8),
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
SET role = 'ADMIN', admin_level = 'SUPERADMIN'
WHERE email = 'lexhewitt@gmail.com';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_coaches_admin_level ON coaches(admin_level);
CREATE INDEX IF NOT EXISTS idx_coaches_role_admin ON coaches(role, admin_level);


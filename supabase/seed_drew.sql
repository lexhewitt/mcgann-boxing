-- Seed Drew Austin as Assistant Head Coach
-- Run this in Supabase SQL Editor

-- Delete any existing Drew to avoid conflicts
DELETE FROM coaches WHERE email = 'drew@fleetwoodboxing.co.uk' OR id = 'c2';

-- Insert Drew Austin as Assistant Head Coach
INSERT INTO coaches (
  id,
  name,
  email,
  role,
  level,
  bio,
  image_url,
  mobile_number,
  bank_details,
  whatsapp_auto_reply_enabled,
  created_at
) VALUES (
  'c2',
  'Drew Austin',
  'drew@fleetwoodboxing.co.uk',
  'COACH',
  'Assistant Head Coach, Level 2',
  'Drew specializes in conditioning and development for all skill levels.',
  'https://picsum.photos/seed/drew/400/400',
  '07444555666',
  '20-30-40 87654321',
  true,
  now()
);

-- Verify Drew was inserted
SELECT 
  id,
  name,
  email,
  role,
  level,
  created_at
FROM coaches
WHERE id = 'c2';



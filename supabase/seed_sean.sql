-- Seed Sean McGann as Head Coach
-- Run this in Supabase SQL Editor

-- First, check if Sean exists by email and delete if needed (to avoid conflicts)
DELETE FROM coaches WHERE email = 'sean@fleetwoodboxing.co.uk';

-- Insert Sean McGann as Head Coach
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
  'c1',
  'Sean McGann',
  'sean@fleetwoodboxing.co.uk',
  'ADMIN',
  'Head Coach, Level 3',
  'With over 20 years of experience, Sean is the heart and soul of Fleetwood Boxing Gym.',
  'https://picsum.photos/seed/sean/400/400',
  '07111222333',
  '10-20-30 12345678',
  true,
  now()
);

-- Verify Sean was inserted
SELECT 
  id,
  name,
  email,
  role,
  level,
  created_at
FROM coaches
WHERE id = 'c1';


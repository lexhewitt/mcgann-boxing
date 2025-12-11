-- Seed Sean McGann as Head Coach
-- Run this in Supabase SQL Editor

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
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  level = EXCLUDED.level,
  bio = EXCLUDED.bio,
  image_url = EXCLUDED.image_url,
  mobile_number = EXCLUDED.mobile_number,
  bank_details = EXCLUDED.bank_details,
  whatsapp_auto_reply_enabled = EXCLUDED.whatsapp_auto_reply_enabled;

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


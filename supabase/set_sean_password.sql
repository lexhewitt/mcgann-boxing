-- Set Sean McGann's password to "Victoriaboxing!"
-- Run this in Supabase SQL Editor

-- Update Sean's password hash
UPDATE coaches
SET password_hash = '$2b$10$gWWN0MRUMu8Ypz3t50aWx.N3ng9LH3qkpqWFCBKJH4NLstXdjK3wK'
WHERE email = 'sean@fleetwoodboxing.co.uk';

-- Verify the update
SELECT 
  id,
  name,
  email,
  role,
  CASE 
    WHEN password_hash IS NOT NULL THEN 'Password set'
    ELSE 'No password'
  END as password_status
FROM coaches
WHERE email = 'sean@fleetwoodboxing.co.uk';


-- Safe deletion script for test members
-- This script deletes related data first to avoid foreign key constraint errors
-- Run this in Supabase SQL Editor

-- STEP 1: Review what will be deleted (run this first!)
SELECT 
  id, 
  name, 
  email,
  (SELECT COUNT(*) FROM bookings WHERE member_id = m.id) as booking_count,
  (SELECT COUNT(*) FROM transactions WHERE member_id = m.id) as transaction_count,
  (SELECT COUNT(*) FROM family_members WHERE parent_id = m.id) as family_count
FROM members m
WHERE 
  email LIKE '%@example.com' 
  OR email LIKE 'test%@%'
  OR name LIKE 'Test%' 
  OR name LIKE '%Test%'
  OR name = 'John Doe';

-- STEP 2: If the above looks correct, run the deletion below
-- This deletes in the correct order to avoid foreign key errors

BEGIN;

-- Delete bookings for test members
DELETE FROM bookings
WHERE member_id IN (
  SELECT id FROM members
  WHERE 
    email LIKE '%@example.com' 
    OR email LIKE 'test%@%'
    OR name LIKE 'Test%' 
    OR name LIKE '%Test%'
    OR name = 'John Doe'
);

-- Delete transactions for test members
DELETE FROM transactions
WHERE member_id IN (
  SELECT id FROM members
  WHERE 
    email LIKE '%@example.com' 
    OR email LIKE 'test%@%'
    OR name LIKE 'Test%' 
    OR name LIKE '%Test%'
    OR name = 'John Doe'
);

-- Delete family members for test members
DELETE FROM family_members
WHERE parent_id IN (
  SELECT id FROM members
  WHERE 
    email LIKE '%@example.com' 
    OR email LIKE 'test%@%'
    OR name LIKE 'Test%' 
    OR name LIKE '%Test%'
    OR name = 'John Doe'
);

-- Delete coach appointments for test members
DELETE FROM coach_appointments
WHERE member_id IN (
  SELECT id FROM members
  WHERE 
    email LIKE '%@example.com' 
    OR email LIKE 'test%@%'
    OR name LIKE 'Test%' 
    OR name LIKE '%Test%'
    OR name = 'John Doe'
);

-- Delete gym access logs for test members
DELETE FROM gym_access_logs
WHERE member_id IN (
  SELECT id FROM members
  WHERE 
    email LIKE '%@example.com' 
    OR email LIKE 'test%@%'
    OR name LIKE 'Test%' 
    OR name LIKE '%Test%'
    OR name = 'John Doe'
);

-- Finally, delete the test members themselves
DELETE FROM members
WHERE 
  email LIKE '%@example.com' 
  OR email LIKE 'test%@%'
  OR name LIKE 'Test%' 
  OR name LIKE '%Test%'
  OR name = 'John Doe';

-- Review the changes
-- If everything looks good, run: COMMIT;
-- If something went wrong, run: ROLLBACK;


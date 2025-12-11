-- NUCLEAR OPTION: Delete ALL test data in one go
-- This script handles ALL foreign key relationships
-- Use this if you want to completely wipe all test data
-- Run in Supabase SQL Editor

BEGIN;

-- Delete in dependency order (using subqueries instead of CTEs):

-- 1. Statement line items (references statements, transactions, bookings)
DELETE FROM statement_line_items
WHERE statement_id IN (
  SELECT id FROM monthly_statements 
  WHERE member_id IN (
    SELECT id FROM members
    WHERE email LIKE '%@example.com' 
       OR email LIKE 'test%@%'
       OR name LIKE 'Test%' 
       OR name LIKE '%Test%'
       OR name = 'John Doe'
  )
)
OR transaction_id IN (
  SELECT id FROM transactions 
  WHERE member_id IN (
    SELECT id FROM members
    WHERE email LIKE '%@example.com' 
       OR email LIKE 'test%@%'
       OR name LIKE 'Test%' 
       OR name LIKE '%Test%'
       OR name = 'John Doe'
  )
)
OR booking_id IN (
  SELECT id FROM bookings 
  WHERE member_id IN (
    SELECT id FROM members
    WHERE email LIKE '%@example.com' 
       OR email LIKE 'test%@%'
       OR name LIKE 'Test%' 
       OR name LIKE '%Test%'
       OR name = 'John Doe'
  )
);

-- 2. Transactions (references bookings, members, coaches, slots)
-- Delete transactions that reference test members OR test bookings
DELETE FROM transactions
WHERE member_id IN (
  SELECT id FROM members
  WHERE email LIKE '%@example.com' 
     OR email LIKE 'test%@%'
     OR name LIKE 'Test%' 
     OR name LIKE '%Test%'
     OR name = 'John Doe'
)
OR booking_id IN (
  SELECT id FROM bookings 
  WHERE member_id IN (
    SELECT id FROM members
    WHERE email LIKE '%@example.com' 
       OR email LIKE 'test%@%'
       OR name LIKE 'Test%' 
       OR name LIKE '%Test%'
       OR name = 'John Doe'
  )
);

-- 3. Monthly statements (references members)
DELETE FROM monthly_statements
WHERE member_id IN (
  SELECT id FROM members
  WHERE email LIKE '%@example.com' 
     OR email LIKE 'test%@%'
     OR name LIKE 'Test%' 
     OR name LIKE '%Test%'
     OR name = 'John Doe'
);

-- 4. Bookings (references members, classes)
DELETE FROM bookings
WHERE member_id IN (
  SELECT id FROM members
  WHERE email LIKE '%@example.com' 
     OR email LIKE 'test%@%'
     OR name LIKE 'Test%' 
     OR name LIKE '%Test%'
     OR name = 'John Doe'
);

-- 5. Coach appointments (references members, slots)
DELETE FROM coach_appointments
WHERE member_id IN (
  SELECT id FROM members
  WHERE email LIKE '%@example.com' 
     OR email LIKE 'test%@%'
     OR name LIKE 'Test%' 
     OR name LIKE '%Test%'
     OR name = 'John Doe'
);

-- 6. Family members (references members)
DELETE FROM family_members
WHERE parent_id IN (
  SELECT id FROM members
  WHERE email LIKE '%@example.com' 
     OR email LIKE 'test%@%'
     OR name LIKE 'Test%' 
     OR name LIKE '%Test%'
     OR name = 'John Doe'
);

-- 7. Gym access logs (references members)
DELETE FROM gym_access_logs
WHERE member_id IN (
  SELECT id FROM members
  WHERE email LIKE '%@example.com' 
     OR email LIKE 'test%@%'
     OR name LIKE 'Test%' 
     OR name LIKE '%Test%'
     OR name = 'John Doe'
);

-- 8. Guest bookings (if any test emails)
DELETE FROM guest_bookings
WHERE contact_email LIKE '%@example.com' 
   OR contact_email LIKE 'test%@%'
   OR contact_name LIKE 'Test%'
   OR contact_name LIKE '%Test%'
   OR contact_name = 'John Doe';

-- 9. Finally, delete the test members themselves
DELETE FROM members
WHERE email LIKE '%@example.com' 
   OR email LIKE 'test%@%'
   OR name LIKE 'Test%' 
   OR name LIKE '%Test%'
   OR name = 'John Doe';

-- Show what was deleted
SELECT 
  'Deletion complete!' as status,
  (SELECT COUNT(*) FROM members WHERE email LIKE '%@example.com' OR name = 'John Doe') as remaining_test_members;

-- Review the changes
-- If everything looks good, run: COMMIT;
-- If something went wrong, run: ROLLBACK;


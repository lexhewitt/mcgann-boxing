-- Cleanup script for test data in Fleetwood Boxing Gym database
-- Run this in Supabase SQL Editor to identify and optionally remove test data

-- 1. View all members with their details
SELECT 
  id,
  name,
  email,
  dob,
  sex,
  ability,
  membership_status,
  created_at,
  CASE 
    WHEN email LIKE '%@example.com' THEN 'Test Data (example.com)'
    WHEN email LIKE 'test%@%' THEN 'Test Data (test prefix)'
    WHEN name LIKE 'Test%' OR name LIKE '%Test%' THEN 'Test Data (test in name)'
    WHEN name = 'John Doe' THEN 'Test Data (John Doe)'
    ELSE 'Real Member'
  END as data_type
FROM members
ORDER BY created_at DESC;

-- 2. View members that look like test data
SELECT 
  id,
  name,
  email,
  dob,
  created_at
FROM members
WHERE 
  email LIKE '%@example.com' 
  OR email LIKE 'test%@%'
  OR name LIKE 'Test%' 
  OR name LIKE '%Test%'
  OR name = 'John Doe'
ORDER BY created_at DESC;

-- 3. Count members by type
SELECT 
  CASE 
    WHEN email LIKE '%@example.com' THEN 'Test Data (example.com)'
    WHEN email LIKE 'test%@%' THEN 'Test Data (test prefix)'
    WHEN name LIKE 'Test%' OR name LIKE '%Test%' THEN 'Test Data (test in name)'
    WHEN name = 'John Doe' THEN 'Test Data (John Doe)'
    ELSE 'Real Member'
  END as data_type,
  COUNT(*) as count
FROM members
GROUP BY data_type
ORDER BY count DESC;

-- 4. SAFE DELETE: Remove test members (uncomment to use)
-- WARNING: This will delete test members and all related data (bookings, transactions, etc.)
-- Review the SELECT queries above first to make sure you're deleting the right records!

/*
DELETE FROM members
WHERE 
  email LIKE '%@example.com' 
  OR email LIKE 'test%@%'
  OR name LIKE 'Test%' 
  OR name LIKE '%Test%'
  OR name = 'John Doe';
*/

-- 5. View all bookings for test members (before deleting)
SELECT 
  b.id as booking_id,
  m.name as member_name,
  m.email as member_email,
  b.booking_date,
  b.paid,
  b.confirmation_status
FROM bookings b
JOIN members m ON b.member_id = m.id
WHERE 
  m.email LIKE '%@example.com' 
  OR m.email LIKE 'test%@%'
  OR m.name LIKE 'Test%' 
  OR m.name LIKE '%Test%'
  OR m.name = 'John Doe'
ORDER BY b.booking_date DESC;

-- 6. View all transactions for test members (before deleting)
SELECT 
  t.id as transaction_id,
  m.name as member_name,
  m.email as member_email,
  t.amount,
  t.status,
  t.created_at
FROM transactions t
JOIN members m ON t.member_id = m.id
WHERE 
  m.email LIKE '%@example.com' 
  OR m.email LIKE 'test%@%'
  OR m.name LIKE 'Test%' 
  OR m.name LIKE '%Test%'
  OR m.name = 'John Doe'
ORDER BY t.created_at DESC;

-- 7. View duplicate emails (if any)
SELECT 
  email,
  COUNT(*) as count,
  STRING_AGG(id, ', ') as member_ids,
  STRING_AGG(name, ', ') as names
FROM members
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY count DESC;


-- Check Drew Austin's status in the database
-- Run this in Supabase SQL Editor

-- 1. Check if Drew exists as a coach
SELECT 
  id,
  name,
  email,
  role,
  level,
  created_at
FROM coaches
WHERE id = 'c2' OR email = 'drew@fleetwoodboxing.co.uk';

-- 2. Check classes assigned to Drew
SELECT 
  c.id,
  c.name,
  c.day,
  c.time,
  c.coach_id,
  c.capacity,
  (SELECT COUNT(*) FROM bookings WHERE class_id = c.id) as bookings_count
FROM classes c
WHERE c.coach_id = 'c2'
ORDER BY c.day, c.time;

-- 3. Check if Drew is in any class_coaches junction table (multiple coaches)
SELECT 
  cc.class_id,
  c.name as class_name,
  c.day,
  c.time,
  cc.coach_id,
  co.name as coach_name
FROM class_coaches cc
JOIN classes c ON cc.class_id = c.id
JOIN coaches co ON cc.coach_id = co.id
WHERE cc.coach_id = 'c2'
ORDER BY c.day, c.time;

-- 4. Check Drew's availability slots
SELECT 
  id,
  coach_id,
  type,
  title,
  start,
  "end",
  capacity,
  price
FROM coach_slots
WHERE coach_id = 'c2'
ORDER BY start;

-- 5. Check Drew's appointments
SELECT 
  ca.id,
  ca.slot_id,
  cs.title as slot_title,
  ca.participant_name,
  ca.status,
  ca.created_at
FROM coach_appointments ca
JOIN coach_slots cs ON ca.slot_id = cs.id
WHERE cs.coach_id = 'c2'
ORDER BY ca.created_at DESC;

-- 6. Summary: Drew's total classes and slots
SELECT 
  'Drew Austin Summary' as info,
  (SELECT COUNT(*) FROM classes WHERE coach_id = 'c2') as classes_as_primary_coach,
  (SELECT COUNT(*) FROM class_coaches WHERE coach_id = 'c2') as classes_in_multiple_coaches,
  (SELECT COUNT(*) FROM coach_slots WHERE coach_id = 'c2') as availability_slots,
  (SELECT COUNT(*) FROM coach_appointments ca 
   JOIN coach_slots cs ON ca.slot_id = cs.id 
   WHERE cs.coach_id = 'c2') as total_appointments;


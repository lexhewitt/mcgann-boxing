-- Fresh Database Setup for Fleetwood Boxing Gym
-- This creates all tables and seeds ONLY Sean McGann as Head Coach
-- No classes, sessions, or other coaches are created
-- Run this in Supabase SQL Editor to start fresh

BEGIN;

-- ============================================
-- CREATE ALL TABLES
-- ============================================

-- Create coaches table
CREATE TABLE IF NOT EXISTS coaches (
  id text primary key,
  name text not null,
  email text unique,
  role text not null,
  level text,
  bio text,
  image_url text,
  mobile_number text,
  bank_details text,
  whatsapp_auto_reply_enabled boolean default true,
  whatsapp_auto_reply_message text,
  created_at timestamptz default now()
);

-- Create members table
CREATE TABLE IF NOT EXISTS members (
  id text primary key,
  name text not null,
  email text unique,
  role text not null default 'MEMBER',
  dob date,
  sex text,
  ability text,
  bio text,
  coach_id text references coaches (id),
  is_carded boolean default false,
  membership_status text,
  membership_start_date date,
  membership_expiry date,
  is_rolling_monthly boolean default false,
  created_at timestamptz default now()
);

-- Create family_members table
CREATE TABLE IF NOT EXISTS family_members (
  id text primary key,
  parent_id text references members (id) on delete cascade,
  name text not null,
  dob date
);

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id text primary key,
  name text not null,
  description text,
  day text not null,
  time text not null,
  coach_id text references coaches (id),
  capacity int,
  price numeric,
  min_age int,
  max_age int,
  original_coach_id text references coaches (id),
  created_at timestamptz default now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id text primary key,
  member_id text references members (id),
  participant_id text,
  participant_family_id text,
  class_id text references classes (id),
  booking_date timestamptz default now(),
  paid boolean default false,
  attended boolean,
  confirmation_status text default 'PENDING',
  session_start timestamptz,
  payment_method text DEFAULT 'ONE_OFF',
  billing_frequency text,
  stripe_customer_id text,
  stripe_subscription_id text,
  next_billing_date date
);

-- Create coach_slots table
CREATE TABLE IF NOT EXISTS coach_slots (
  id text primary key,
  coach_id text references coaches (id),
  type text not null,
  title text not null,
  description text,
  start timestamptz not null,
  "end" timestamptz not null,
  capacity int not null,
  price numeric,
  location text,
  created_at timestamptz default now()
);

-- Create coach_appointments table
CREATE TABLE IF NOT EXISTS coach_appointments (
  id text primary key,
  slot_id text references coach_slots (id),
  member_id text references members (id),
  participant_name text,
  status text default 'CONFIRMED',
  created_at timestamptz default now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id text primary key,
  member_id text references members (id),
  coach_id text references coaches (id),
  booking_id text references bookings (id),
  slot_id text references coach_slots (id),
  amount numeric,
  currency text default 'GBP',
  source text,
  status text,
  description text,
  stripe_session_id text,
  confirmation_status text default 'CONFIRMED',
  created_at timestamptz default now(),
  settled_at timestamptz,
  payment_method text DEFAULT 'ONE_OFF',
  billing_frequency text,
  stripe_customer_id text,
  stripe_subscription_id text,
  invoice_sent_at timestamptz,
  reminder_sent_at timestamptz
);

-- Create guest_bookings table
CREATE TABLE IF NOT EXISTS guest_bookings (
  id text primary key,
  service_type text,
  reference_id text,
  title text,
  date timestamptz,
  participant_name text,
  contact_name text,
  contact_email text,
  contact_phone text,
  status text default 'PENDING',
  created_at timestamptz default now(),
  payment_method text DEFAULT 'ONE_OFF',
  billing_frequency text,
  stripe_customer_id text,
  stripe_subscription_id text,
  next_billing_date date
);

-- Create monthly_statements table
CREATE TABLE IF NOT EXISTS monthly_statements (
  id text primary key,
  member_id text references members (id),
  contact_email text not null,
  contact_name text,
  statement_period_start date not null,
  statement_period_end date not null,
  total_amount numeric not null,
  currency text default 'GBP',
  status text default 'PENDING',
  stripe_invoice_id text,
  sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- Create statement_line_items table
CREATE TABLE IF NOT EXISTS statement_line_items (
  id text primary key,
  statement_id text references monthly_statements (id) on delete cascade,
  transaction_id text references transactions (id),
  booking_id text references bookings (id),
  description text not null,
  amount numeric not null,
  service_type text,
  service_date date,
  created_at timestamptz default now()
);

-- Create class_coaches junction table (for multiple coaches per class)
CREATE TABLE IF NOT EXISTS class_coaches (
  class_id text references classes (id) on delete cascade,
  coach_id text references coaches (id) on delete cascade,
  primary key (class_id, coach_id)
);

-- Create slot_coaches junction table (for multiple coaches per slot)
CREATE TABLE IF NOT EXISTS slot_coaches (
  slot_id text references coach_slots (id) on delete cascade,
  coach_id text references coaches (id) on delete cascade,
  primary key (slot_id, coach_id)
);

-- ============================================
-- ADD COLUMNS TO EXISTING TABLES (if needed)
-- ============================================

-- Ensure all columns exist in coaches table
ALTER TABLE coaches
  ADD COLUMN IF NOT EXISTS role text default 'COACH',
  ADD COLUMN IF NOT EXISTS level text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS mobile_number text,
  ADD COLUMN IF NOT EXISTS bank_details text,
  ADD COLUMN IF NOT EXISTS whatsapp_auto_reply_enabled boolean default true,
  ADD COLUMN IF NOT EXISTS whatsapp_auto_reply_message text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz default now();

-- ============================================
-- CLEAR ALL EXISTING DATA (Optional - uncomment if you want to start completely fresh)
-- ============================================

-- WARNING: This will delete ALL data except the table structure
-- Uncomment the following section if you want to clear everything first

/*
-- Delete in dependency order
DELETE FROM statement_line_items;
DELETE FROM transactions;
DELETE FROM monthly_statements;
DELETE FROM bookings;
DELETE FROM coach_appointments;
DELETE FROM family_members;
DELETE FROM guest_bookings;
DELETE FROM coach_slots;
DELETE FROM classes;
DELETE FROM class_coaches;
DELETE FROM slot_coaches;
DELETE FROM members;
DELETE FROM coaches;
*/

-- ============================================
-- SEED SEAN MCGANN AS HEAD COACH
-- ============================================

-- Delete any existing Sean to avoid conflicts
DELETE FROM coaches WHERE email = 'sean@fleetwoodboxing.co.uk' OR id = 'c1';

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

-- ============================================
-- VERIFY SETUP
-- ============================================

-- Verify Sean was inserted
SELECT 
  'Setup Complete!' as status,
  (SELECT COUNT(*) FROM coaches) as total_coaches,
  (SELECT COUNT(*) FROM classes) as total_classes,
  (SELECT COUNT(*) FROM coach_slots) as total_slots,
  (SELECT COUNT(*) FROM members) as total_members;

-- Show Sean's details
SELECT 
  id,
  name,
  email,
  role,
  level,
  created_at
FROM coaches
WHERE id = 'c1';

COMMIT;


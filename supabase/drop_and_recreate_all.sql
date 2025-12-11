-- NUCLEAR OPTION: Drop ALL tables and recreate from scratch
-- This completely wipes the database and starts fresh
-- Run this in Supabase SQL Editor to get a completely clean database
-- WARNING: This will delete ALL data permanently!

BEGIN;

-- ============================================
-- DROP ALL TABLES (in dependency order)
-- ============================================

-- Drop tables that reference other tables first
DROP TABLE IF EXISTS statement_line_items CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS monthly_statements CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS coach_appointments CASCADE;
DROP TABLE IF EXISTS family_members CASCADE;
DROP TABLE IF EXISTS guest_bookings CASCADE;
DROP TABLE IF EXISTS coach_slots CASCADE;
DROP TABLE IF EXISTS class_coaches CASCADE;
DROP TABLE IF EXISTS slot_coaches CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS coaches CASCADE;

-- ============================================
-- CREATE ALL TABLES FRESH
-- ============================================

-- Create coaches table
CREATE TABLE coaches (
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
CREATE TABLE members (
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
CREATE TABLE family_members (
  id text primary key,
  parent_id text references members (id) on delete cascade,
  name text not null,
  dob date
);

-- Create classes table
CREATE TABLE classes (
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
CREATE TABLE bookings (
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
CREATE TABLE coach_slots (
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
CREATE TABLE coach_appointments (
  id text primary key,
  slot_id text references coach_slots (id),
  member_id text references members (id),
  participant_name text,
  status text default 'CONFIRMED',
  created_at timestamptz default now()
);

-- Create transactions table
CREATE TABLE transactions (
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
CREATE TABLE guest_bookings (
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
CREATE TABLE monthly_statements (
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
CREATE TABLE statement_line_items (
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
CREATE TABLE class_coaches (
  class_id text references classes (id) on delete cascade,
  coach_id text references coaches (id) on delete cascade,
  primary key (class_id, coach_id)
);

-- Create slot_coaches junction table (for multiple coaches per slot)
CREATE TABLE slot_coaches (
  slot_id text references coach_slots (id) on delete cascade,
  coach_id text references coaches (id) on delete cascade,
  primary key (slot_id, coach_id)
);

-- ============================================
-- SEED SEAN MCGANN AS HEAD COACH
-- ============================================

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

SELECT 
  'Database recreated successfully!' as status,
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


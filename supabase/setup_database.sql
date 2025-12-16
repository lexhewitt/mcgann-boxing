-- Complete database setup for Fleetwood Boxing Gym
-- Run this entire script in Supabase SQL Editor to create all tables

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
  created_at timestamptz default now()
);

-- Create other tables (if they don't exist)
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

CREATE TABLE IF NOT EXISTS family_members (
  id text primary key,
  parent_id text references members (id) on delete cascade,
  name text not null,
  dob date
);

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
  session_start timestamptz
);

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

CREATE TABLE IF NOT EXISTS coach_appointments (
  id text primary key,
  slot_id text references coach_slots (id),
  member_id text references members (id),
  participant_name text,
  status text default 'CONFIRMED',
  created_at timestamptz default now()
);

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
  settled_at timestamptz
);

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
  created_at timestamptz default now()
);

-- Ensure columns exist (for existing tables)
ALTER TABLE coaches
  ADD COLUMN IF NOT EXISTS role text default 'COACH',
  ADD COLUMN IF NOT EXISTS level text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS mobile_number text,
  ADD COLUMN IF NOT EXISTS bank_details text,
  ADD COLUMN IF NOT EXISTS whatsapp_auto_reply_enabled boolean default true,
  ADD COLUMN IF NOT EXISTS created_at timestamptz default now();

-- Verify coaches table was created
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'coaches'
ORDER BY ordinal_position;




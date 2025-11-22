-- Basic schema and seed data for local Supabase dev.
-- Safe to run multiple times via upserts on id.

create table if not exists coaches (
  id text primary key,
  name text not null,
  email text unique,
  role text not null,
  level text,
  bio text,
  image_url text,
  mobile_number text,
  bank_details text,
  created_at timestamptz default now()
);

create table if not exists members (
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

create table if not exists family_members (
  id text primary key,
  parent_id text references members (id) on delete cascade,
  name text not null,
  dob date
);

create table if not exists classes (
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

create table if not exists bookings (
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

create table if not exists coach_slots (
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

create table if not exists coach_appointments (
  id text primary key,
  slot_id text references coach_slots (id),
  member_id text references members (id),
  participant_name text,
  status text default 'CONFIRMED',
  created_at timestamptz default now()
);

create table if not exists transactions (
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

create table if not exists guest_bookings (
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

-- Ensure columns exist on already-created tables (makes the script idempotent on older schemas)
alter table coaches
  add column if not exists role text default 'COACH',
  add column if not exists level text,
  add column if not exists bio text,
  add column if not exists image_url text,
  add column if not exists mobile_number text,
  add column if not exists bank_details text,
  add column if not exists created_at timestamptz default now();

alter table members
  add column if not exists role text default 'MEMBER',
  add column if not exists dob date,
  add column if not exists sex text,
  add column if not exists ability text,
  add column if not exists bio text,
  add column if not exists coach_id text references coaches (id),
  add column if not exists is_carded boolean default false,
  add column if not exists membership_status text,
  add column if not exists membership_start_date date,
  add column if not exists membership_expiry date,
  add column if not exists is_rolling_monthly boolean default false,
  add column if not exists created_at timestamptz default now();

-- Seed data
insert into coaches (id, name, email, role, level, bio, image_url, mobile_number, bank_details)
values
  ('11111111-1111-1111-1111-111111111111', 'Sean McGann', 'sean@fleetwoodboxing.co.uk', 'ADMIN', 'Head Coach, Level 3', 'With over 20 years of experience, Sean is the heart and soul of Fleetwood Boxing Gym.', 'https://picsum.photos/seed/sean/400/400', '07111222333', '10-20-30 12345678'),
  ('22222222-2222-2222-2222-222222222222', 'Drew Austin', 'drew@fleetwoodboxing.co.uk', 'COACH', 'Assistant Head Coach, Level 2', 'Drew specializes in conditioning and development for all skill levels.', 'https://picsum.photos/seed/drew/400/400', '07444555666', '20-30-40 87654321'),
  ('33333333-3333-3333-3333-333333333333', 'Elle', 'elle@fleetwoodboxing.co.uk', 'COACH', 'Level 2 Coach', 'Elle is passionate about empowering women through boxing and fitness.', 'https://picsum.photos/seed/elle/400/400', '07777888999', '30-40-50 11223344'),
  ('44444444-4444-4444-4444-444444444444', 'Bex', 'bex@fleetwoodboxing.co.uk', 'COACH', 'Level 1 Coach', 'Bex brings infectious energy to her classes, focusing on fundamentals and fun.', 'https://picsum.photos/seed/bex/400/400', '07123123123', '40-50-60 55667788'),
  ('55555555-5555-5555-5555-555555555555', 'Rach', 'rach@fleetwoodboxing.co.uk', 'COACH', 'Fitness Instructor', 'Rach leads our HIITSTEP and Gentle Moves classes with expertise and enthusiasm.', 'https://picsum.photos/seed/rach/400/400', '07543543543', '50-60-70 99887766')
on conflict (email) do update set
  id = excluded.id,
  name = excluded.name,
  role = excluded.role,
  level = excluded.level,
  bio = excluded.bio,
  image_url = excluded.image_url,
  mobile_number = excluded.mobile_number,
  bank_details = excluded.bank_details;

insert into members (id, name, email, role, dob, sex, ability, bio, coach_id, is_carded, membership_status, membership_start_date, membership_expiry, is_rolling_monthly)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'John Doe', 'john@example.com', 'MEMBER', '1996-05-20', 'M', 'Intermediate', 'Aspiring amateur boxer looking to improve my footwork.', '22222222-2222-2222-2222-222222222222', false, 'Monthly', current_date - interval '50 days', current_date + interval '20 days', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Jane Smith', 'jane@example.com', 'MEMBER', '1990-11-10', 'F', 'Beginner', 'Just starting out, excited to learn and get fit!', '33333333-3333-3333-3333-333333333333', false, 'PAYG', current_date - interval '100 days', null, false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'Liam Johnson', 'liam@example.com', 'MEMBER', '2002-01-15', 'M', 'Competitive', 'Training for the golden gloves.', '11111111-1111-1111-1111-111111111111', true, 'Monthly', current_date - interval '300 days', current_date + interval '15 days', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'Chloe Davis', 'chloe@example.com', 'MEMBER', '1995-07-22', 'F', 'Intermediate', 'Love the high-energy classes.', '33333333-3333-3333-3333-333333333333', false, 'PAYG', current_date - interval '10 days', null, false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'Oscar Wilson', 'oscar@example.com', 'MEMBER', '1984-03-30', 'M', 'Beginner', 'Future world champ!', '44444444-4444-4444-4444-444444444444', false, 'None', current_date - interval '5 days', null, false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', 'Amelia Brown', 'amelia@example.com', 'MEMBER', '1993-09-05', 'F', 'Advanced', 'Focusing on technique and sparring.', '22222222-2222-2222-2222-222222222222', false, 'Monthly', current_date - interval '90 days', current_date - interval '5 days', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', 'Noah Garcia', 'noah@example.com', 'MEMBER', '1999-06-12', 'M', 'Beginner', 'Getting back into fitness.', null, false, 'PAYG', current_date - interval '25 days', null, false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8', 'Kaylee Ann Smith', 'kayleeannsmith@gmail.com', 'MEMBER', '1984-04-15', 'F', 'Beginner', '', null, false, 'PAYG', current_date - interval '1 days', null, false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9', 'Lex Hewitt', 'lexhewitt@gmail.com', 'MEMBER', '2010-02-20', 'M', 'Beginner', 'Lead developer, super admin for the system.', null, false, 'PAYG', current_date, null, false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa010', 'Timmy McKinney', 'timmy.mckinney@example.com', 'MEMBER', '2012-03-15', 'M', 'Beginner', '', '22222222-2222-2222-2222-222222222222', false, 'PAYG', current_date, null, false)
on conflict (email) do update set
  id = excluded.id,
  name = excluded.name,
  coach_id = excluded.coach_id,
  membership_status = excluded.membership_status,
  membership_start_date = excluded.membership_start_date,
  membership_expiry = excluded.membership_expiry,
  is_rolling_monthly = excluded.is_rolling_monthly,
  ability = excluded.ability,
  bio = excluded.bio,
  is_carded = excluded.is_carded,
  sex = excluded.sex,
  dob = excluded.dob;

insert into family_members (id, parent_id, name, dob)
values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Leo Smith', '2016-08-25'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'Mia Wilson', '2014-04-18'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8', 'Beau Hewitt', '2015-06-10'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8', 'Lex Hewitt', '2010-02-20')
on conflict (id) do update set
  parent_id = excluded.parent_id,
  name = excluded.name,
  dob = excluded.dob;

insert into classes (id, name, description, day, time, coach_id, capacity, price, min_age, max_age, original_coach_id)
values
  ('cccccccc-cccc-cccc-cccc-ccccccccccc1', 'HIITSTEP with Rach (RH Fitness)', 'High-intensity step workout', 'Monday', '06:30 - 07:00', '55555555-5555-5555-5555-555555555555', 15, 8, 16, null, null),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', 'Circuits with Sean', 'Circuit training', 'Tuesday', '06:30 - 07:00', '11111111-1111-1111-1111-111111111111', 20, 8, 16, null, null),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc3', 'Circuits with Drew', 'Circuit training', 'Thursday', '06:30 - 07:00', '22222222-2222-2222-2222-222222222222', 20, 8, 16, null, null),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc4', 'HIITSTEP with Rach (RH Fitness)', 'High-intensity step workout', 'Friday', '06:30 - 07:00', '55555555-5555-5555-5555-555555555555', 15, 8, 16, null, null),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc5', 'Fit Over 50', 'Fitness class for ages 50+', 'Monday', '11:00 - 12:00', '11111111-1111-1111-1111-111111111111', 10, 10, 50, null, null),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc6', 'Gentle Moves (RH Fitness)', 'Gentle fitness and mobility', 'Thursday', '11:00 - 12:00', '55555555-5555-5555-5555-555555555555', 10, 10, 16, null, null),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc7', 'Tiny Tysons', 'Children''s boxing class', 'Monday', '17:00 - 17:45', '44444444-4444-4444-4444-444444444444', 12, 7, 5, 9, null),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc8', 'Tiny Tysons', 'Children''s boxing class', 'Wednesday', '17:00 - 17:45', '44444444-4444-4444-4444-444444444444', 12, 7, 5, 9, null),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc9', 'Carded Boxers', 'Competitive boxer training', 'Monday', '18:00 - 19:00', '11111111-1111-1111-1111-111111111111', 8, 12, 16, null, null),
  ('cccccccc-cccc-cccc-cccc-cccccccccc10', 'Beginner / Development', 'Boxing fundamentals & skill building', 'Tuesday', '18:00 - 19:00', '22222222-2222-2222-2222-222222222222', 15, 10, 16, null, null),
  ('cccccccc-cccc-cccc-cccc-cccccccccc11', 'Carded Boxers', 'Competitive boxer training', 'Wednesday', '18:00 - 19:00', '11111111-1111-1111-1111-111111111111', 8, 12, 16, null, null),
  ('cccccccc-cccc-cccc-cccc-cccccccccc12', 'Beginner / Development', 'Boxing fundamentals & skill building', 'Thursday', '18:00 - 19:00', '22222222-2222-2222-2222-222222222222', 15, 10, 16, null, null),
  ('cccccccc-cccc-cccc-cccc-cccccccccc13', 'Seniors Class', 'Advanced boxing training', 'Tuesday', '19:00 - 20:15', '11111111-1111-1111-1111-111111111111', 10, 12, 16, null, null),
  ('cccccccc-cccc-cccc-cccc-cccccccccc14', 'Seniors Class', 'Advanced boxing training', 'Thursday', '19:00 - 20:15', '11111111-1111-1111-1111-111111111111', 10, 12, 16, null, null),
  ('cccccccc-cccc-cccc-cccc-cccccccccc15', 'Ladies Class', 'Boxing & fitness for women', 'Monday', '19:00 - 20:00', '33333333-3333-3333-3333-333333333333', 15, 10, 16, null, null)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  day = excluded.day,
  time = excluded.time,
  coach_id = excluded.coach_id,
  capacity = excluded.capacity,
  price = excluded.price,
  min_age = excluded.min_age,
  max_age = excluded.max_age,
  original_coach_id = excluded.original_coach_id;

insert into bookings (id, member_id, participant_id, participant_family_id, class_id, booking_date, paid, attended, confirmation_status, session_start)
values
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', null, 'cccccccc-cccc-cccc-cccc-cccccccccc10', now(), true, true, 'CONFIRMED', now()),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', null, 'cccccccc-cccc-cccc-cccc-cccccccccc15', now(), false, false, 'PENDING', now()),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', null, 'cccccccc-cccc-cccc-cccc-ccccccccccc9', now(), true, true, 'CONFIRMED', now()),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd4', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', null, 'cccccccc-cccc-cccc-cccc-cccccccccc11', now(), true, false, 'CONFIRMED', now()),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd5', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', null, 'cccccccc-cccc-cccc-cccc-cccccccccc13', now(), false, false, 'PENDING', now()),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd6', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', null, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'cccccccc-cccc-cccc-cccc-ccccccccccc7', now(), true, true, 'CONFIRMED', now()), -- child booking
  ('dddddddd-dddd-dddd-dddd-ddddddddddd7', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', null, 'cccccccc-cccc-cccc-cccc-cccccccccc14', now(), true, true, 'CONFIRMED', now()),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd8', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', null, 'cccccccc-cccc-cccc-cccc-cccccccccc12', now(), false, true, 'PENDING', now()),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd9', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', null, 'cccccccc-cccc-cccc-cccc-ccccccccccc2', now(), true, false, 'PENDING', now()),
  ('dddddddd-dddd-dddd-dddd-ddddddddd10', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', null, 'cccccccc-cccc-cccc-cccc-cccccccccc15', now(), true, true, 'CONFIRMED', now())
on conflict (id) do update set
  member_id = excluded.member_id,
  participant_id = excluded.participant_id,
  participant_family_id = excluded.participant_family_id,
  class_id = excluded.class_id,
  paid = excluded.paid,
  attended = excluded.attended,
  confirmation_status = excluded.confirmation_status,
  session_start = excluded.session_start;

insert into coach_slots (id, coach_id, type, title, description, start, "end", capacity, price, location)
values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', '11111111-1111-1111-1111-111111111111', 'PRIVATE', '1:1 With Sean', 'Technique tune-up focused on fundamentals', now() + interval '2 days 10 hours', now() + interval '2 days 11 hours', 1, 45, 'Ring 1'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', '11111111-1111-1111-1111-111111111111', 'PRIVATE', '1:1 With Sean', null, now() + interval '4 days 18 hours 30 minutes', now() + interval '4 days 19 hours 30 minutes', 1, 45, 'Technique Studio'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3', '22222222-2222-2222-2222-222222222222', 'GROUP', 'Small-Group Conditioning', 'Sweat-focused conditioning for up to four boxers', now() + interval '3 days 17 hours', now() + interval '3 days 18 hours', 4, 25, 'Conditioning Area'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee4', '33333333-3333-3333-3333-333333333333', 'PRIVATE', 'Women''s 1:1 Session', null, now() + interval '5 days 9 hours', now() + interval '5 days 10 hours', 1, 40, 'Studio 2')
on conflict (id) do update set
  coach_id = excluded.coach_id,
  type = excluded.type,
  title = excluded.title,
  description = excluded.description,
  start = excluded.start,
  "end" = excluded."end",
  capacity = excluded.capacity,
  price = excluded.price,
  location = excluded.location;

insert into coach_appointments (id, slot_id, member_id, participant_name, status, created_at)
values
  ('ffffffff-ffff-ffff-ffff-fffffffffff1', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'John Doe', 'CONFIRMED', now()),
  ('ffffffff-ffff-ffff-ffff-fffffffffff2', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Jane Smith', 'CONFIRMED', now())
on conflict (id) do update set
  slot_id = excluded.slot_id,
  member_id = excluded.member_id,
  participant_name = excluded.participant_name,
  status = excluded.status;

insert into transactions (id, member_id, coach_id, booking_id, slot_id, amount, currency, source, status, description, stripe_session_id, confirmation_status, created_at)
values
  ('99999999-9999-9999-9999-999999999991', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '22222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', null, 10, 'GBP', 'CLASS', 'PAID', 'Class booking payment', null, 'CONFIRMED', now()),
  ('99999999-9999-9999-9999-999999999992', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8', null, null, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 45, 'GBP', 'PRIVATE_SESSION', 'PAID', '1:1 With Sean paid by Kaylee Ann Smith', null, 'CONFIRMED', now())
on conflict (id) do update set
  member_id = excluded.member_id,
  coach_id = excluded.coach_id,
  booking_id = excluded.booking_id,
  slot_id = excluded.slot_id,
  amount = excluded.amount,
  currency = excluded.currency,
  source = excluded.source,
  status = excluded.status,
  description = excluded.description,
  stripe_session_id = excluded.stripe_session_id,
  confirmation_status = excluded.confirmation_status;

insert into guest_bookings (id, service_type, reference_id, title, date, participant_name, contact_name, contact_email, contact_phone, status, created_at)
values
  ('88888888-8888-8888-8888-888888888881', 'CLASS', 'cccccccc-cccc-cccc-cccc-ccccccccccc7', 'Tiny Tysons Guest', now() + interval '7 days', 'Visitor Child', 'Parent Example', 'parent@example.com', '07000111222', 'PENDING', now())
on conflict (id) do update set
  service_type = excluded.service_type,
  reference_id = excluded.reference_id,
  title = excluded.title,
  date = excluded.date,
  participant_name = excluded.participant_name,
  contact_name = excluded.contact_name,
  contact_email = excluded.contact_email,
  contact_phone = excluded.contact_phone,
  status = excluded.status;

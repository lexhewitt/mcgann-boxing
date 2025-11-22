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

-- Seed data
insert into coaches (id, name, email, role, level, bio, image_url, mobile_number, bank_details)
values
  ('c1', 'Sean McGann', 'sean@fleetwoodboxing.co.uk', 'ADMIN', 'Head Coach, Level 3', 'With over 20 years of experience, Sean is the heart and soul of Fleetwood Boxing Gym.', 'https://picsum.photos/seed/sean/400/400', '07111222333', '10-20-30 12345678'),
  ('c2', 'Drew Austin', 'drew@fleetwoodboxing.co.uk', 'COACH', 'Assistant Head Coach, Level 2', 'Drew specializes in conditioning and development for all skill levels.', 'https://picsum.photos/seed/drew/400/400', '07444555666', '20-30-40 87654321'),
  ('c3', 'Elle', 'elle@fleetwoodboxing.co.uk', 'COACH', 'Level 2 Coach', 'Elle is passionate about empowering women through boxing and fitness.', 'https://picsum.photos/seed/elle/400/400', '07777888999', '30-40-50 11223344'),
  ('c4', 'Bex', 'bex@fleetwoodboxing.co.uk', 'COACH', 'Level 1 Coach', 'Bex brings infectious energy to her classes, focusing on fundamentals and fun.', 'https://picsum.photos/seed/bex/400/400', '07123123123', '40-50-60 55667788'),
  ('c5', 'Rach', 'rach@fleetwoodboxing.co.uk', 'COACH', 'Fitness Instructor', 'Rach leads our HIITSTEP and Gentle Moves classes with expertise and enthusiasm.', 'https://picsum.photos/seed/rach/400/400', '07543543543', '50-60-70 99887766')
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  role = excluded.role,
  level = excluded.level,
  bio = excluded.bio,
  image_url = excluded.image_url,
  mobile_number = excluded.mobile_number,
  bank_details = excluded.bank_details;

insert into members (id, name, email, role, dob, sex, ability, bio, coach_id, is_carded, membership_status, membership_start_date, membership_expiry, is_rolling_monthly)
values
  ('m1', 'John Doe', 'john@example.com', 'MEMBER', '1996-05-20', 'M', 'Intermediate', 'Aspiring amateur boxer looking to improve my footwork.', 'c2', false, 'Monthly', current_date - interval '50 days', current_date + interval '20 days', true),
  ('m2', 'Jane Smith', 'jane@example.com', 'MEMBER', '1990-11-10', 'F', 'Beginner', 'Just starting out, excited to learn and get fit!', 'c3', false, 'PAYG', current_date - interval '100 days', null, false),
  ('m3', 'Liam Johnson', 'liam@example.com', 'MEMBER', '2002-01-15', 'M', 'Competitive', 'Training for the golden gloves.', 'c1', true, 'Monthly', current_date - interval '300 days', current_date + interval '15 days', true),
  ('m4', 'Chloe Davis', 'chloe@example.com', 'MEMBER', '1995-07-22', 'F', 'Intermediate', 'Love the high-energy classes.', 'c3', false, 'PAYG', current_date - interval '10 days', null, false),
  ('m5', 'Oscar Wilson', 'oscar@example.com', 'MEMBER', '1984-03-30', 'M', 'Beginner', 'Future world champ!', 'c4', false, 'None', current_date - interval '5 days', null, false),
  ('m6', 'Amelia Brown', 'amelia@example.com', 'MEMBER', '1993-09-05', 'F', 'Advanced', 'Focusing on technique and sparring.', 'c2', false, 'Monthly', current_date - interval '90 days', current_date - interval '5 days', false),
  ('m7', 'Noah Garcia', 'noah@example.com', 'MEMBER', '1999-06-12', 'M', 'Beginner', 'Getting back into fitness.', null, false, 'PAYG', current_date - interval '25 days', null, false),
  ('m8', 'Kaylee Ann Smith', 'kayleeannsmith@gmail.com', 'MEMBER', '1984-04-15', 'F', 'Beginner', '', null, false, 'PAYG', current_date - interval '1 days', null, false)
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
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
  ('fm1', 'm2', 'Leo Smith', '2016-08-25'),
  ('fm2', 'm5', 'Mia Wilson', '2014-04-18'),
  ('fm3', 'm8', 'Beau Hewitt', '2015-06-10'),
  ('fm4', 'm8', 'Lex Hewitt', '2010-02-20')
on conflict (id) do update set
  parent_id = excluded.parent_id,
  name = excluded.name,
  dob = excluded.dob;

insert into classes (id, name, description, day, time, coach_id, capacity, price, min_age, max_age, original_coach_id)
values
  ('cl1', 'HIITSTEP with Rach (RH Fitness)', 'High-intensity step workout', 'Monday', '06:30 - 07:00', 'c5', 15, 8, 16, null, null),
  ('cl2', 'Circuits with Sean', 'Circuit training', 'Tuesday', '06:30 - 07:00', 'c1', 20, 8, 16, null, null),
  ('cl3', 'Circuits with Drew', 'Circuit training', 'Thursday', '06:30 - 07:00', 'c2', 20, 8, 16, null, null),
  ('cl4', 'HIITSTEP with Rach (RH Fitness)', 'High-intensity step workout', 'Friday', '06:30 - 07:00', 'c5', 15, 8, 16, null, null),
  ('cl5', 'Fit Over 50', 'Fitness class for ages 50+', 'Monday', '11:00 - 12:00', 'c1', 10, 10, 50, null, null),
  ('cl6', 'Gentle Moves (RH Fitness)', 'Gentle fitness and mobility', 'Thursday', '11:00 - 12:00', 'c5', 10, 10, 16, null, null),
  ('cl7', 'Tiny Tysons', 'Children''s boxing class', 'Monday', '17:00 - 17:45', 'c4', 12, 7, 5, 9, null),
  ('cl8', 'Tiny Tysons', 'Children''s boxing class', 'Wednesday', '17:00 - 17:45', 'c4', 12, 7, 5, 9, null),
  ('cl9', 'Carded Boxers', 'Competitive boxer training', 'Monday', '18:00 - 19:00', 'c1', 8, 12, 16, null, null),
  ('cl10', 'Beginner / Development', 'Boxing fundamentals & skill building', 'Tuesday', '18:00 - 19:00', 'c2', 15, 10, 16, null, null),
  ('cl11', 'Carded Boxers', 'Competitive boxer training', 'Wednesday', '18:00 - 19:00', 'c1', 8, 12, 16, null, null),
  ('cl12', 'Beginner / Development', 'Boxing fundamentals & skill building', 'Thursday', '18:00 - 19:00', 'c2', 15, 10, 16, null, null),
  ('cl13', 'Seniors Class', 'Advanced boxing training', 'Tuesday', '19:00 - 20:15', 'c1', 10, 12, 16, null, null),
  ('cl14', 'Seniors Class', 'Advanced boxing training', 'Thursday', '19:00 - 20:15', 'c1', 10, 12, 16, null, null),
  ('cl15', 'Ladies Class', 'Boxing & fitness for women', 'Monday', '19:00 - 20:00', 'c3', 15, 10, 16, null, null)
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
  ('b1', 'm1', 'm1', null, 'cl10', now(), true, true, 'CONFIRMED', now()),
  ('b2', 'm2', 'm2', null, 'cl15', now(), false, false, 'PENDING', now()),
  ('b3', 'm3', 'm3', null, 'cl9', now(), true, true, 'CONFIRMED', now()),
  ('b4', 'm3', 'm3', null, 'cl11', now(), true, false, 'CONFIRMED', now()),
  ('b5', 'm4', 'm4', null, 'cl13', now(), false, false, 'PENDING', now()),
  ('b6', 'm2', null, 'fm1', 'cl7', now(), true, true, 'CONFIRMED', now()), -- child booking
  ('b7', 'm6', 'm6', null, 'cl14', now(), true, true, 'CONFIRMED', now()),
  ('b8', 'm7', 'm7', null, 'cl12', now(), false, true, 'PENDING', now()),
  ('b9', 'm1', 'm1', null, 'cl2', now(), true, false, 'PENDING', now()),
  ('b10', 'm4', 'm4', null, 'cl15', now(), true, true, 'CONFIRMED', now())
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
  ('slot-sean-1', 'c1', 'PRIVATE', '1:1 With Sean', 'Technique tune-up focused on fundamentals', now() + interval '2 days 10 hours', now() + interval '2 days 11 hours', 1, 45, 'Ring 1'),
  ('slot-sean-2', 'c1', 'PRIVATE', '1:1 With Sean', null, now() + interval '4 days 18 hours 30 minutes', now() + interval '4 days 19 hours 30 minutes', 1, 45, 'Technique Studio'),
  ('slot-drew-group', 'c2', 'GROUP', 'Small-Group Conditioning', 'Sweat-focused conditioning for up to four boxers', now() + interval '3 days 17 hours', now() + interval '3 days 18 hours', 4, 25, 'Conditioning Area'),
  ('slot-elle-1', 'c3', 'PRIVATE', 'Women''s 1:1 Session', null, now() + interval '5 days 9 hours', now() + interval '5 days 10 hours', 1, 40, 'Studio 2')
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
  ('appt-1', 'slot-sean-1', 'm1', 'John Doe', 'CONFIRMED', now()),
  ('appt-2', 'slot-drew-group', 'm2', 'Jane Smith', 'CONFIRMED', now())
on conflict (id) do update set
  slot_id = excluded.slot_id,
  member_id = excluded.member_id,
  participant_name = excluded.participant_name,
  status = excluded.status;

insert into transactions (id, member_id, coach_id, booking_id, slot_id, amount, currency, source, status, description, stripe_session_id, confirmation_status, created_at)
values
  ('tx-1', 'm1', 'c2', 'b1', null, 10, 'GBP', 'CLASS', 'PAID', 'Class booking payment', null, 'CONFIRMED', now()),
  ('tx-2', 'm8', null, null, 'slot-sean-2', 45, 'GBP', 'PRIVATE_SESSION', 'PAID', '1:1 With Sean paid by Kaylee Ann Smith', null, 'CONFIRMED', now())
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
  ('guest-1', 'CLASS', 'cl7', 'Tiny Tysons Guest', now() + interval '7 days', 'Visitor Child', 'Parent Example', 'parent@example.com', '07000111222', 'PENDING', now())
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

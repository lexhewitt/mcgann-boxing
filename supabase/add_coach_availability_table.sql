-- Create coach_availability table for recurring availability slots
CREATE TABLE IF NOT EXISTS coach_availability (
  id text primary key,
  coach_id text references coaches (id) on delete cascade,
  day text not null CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  start_time text not null, -- Format: "HH:mm"
  end_time text not null, -- Format: "HH:mm"
  created_at timestamptz default now()
);

-- Create unavailable_slots table for one-off unavailability
CREATE TABLE IF NOT EXISTS unavailable_slots (
  id text primary key,
  coach_id text references coaches (id) on delete cascade,
  date date not null, -- Format: "YYYY-MM-DD"
  start_time text, -- Format: "HH:mm" (nullable for all-day blocks)
  end_time text, -- Format: "HH:mm" (nullable for all-day blocks)
  created_at timestamptz default now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_coach_availability_coach_id ON coach_availability(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_availability_day ON coach_availability(day);
CREATE INDEX IF NOT EXISTS idx_unavailable_slots_coach_id ON unavailable_slots(coach_id);
CREATE INDEX IF NOT EXISTS idx_unavailable_slots_date ON unavailable_slots(date);


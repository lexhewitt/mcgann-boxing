-- Add support for multiple coaches per class and group session
-- This creates junction tables for many-to-many relationships

-- Junction table for classes and coaches
CREATE TABLE IF NOT EXISTS class_coaches (
  id text primary key,
  class_id text references classes (id) on delete cascade,
  coach_id text references coaches (id) on delete cascade,
  created_at timestamptz default now(),
  UNIQUE(class_id, coach_id)
);

-- Junction table for coach_slots and coaches (for group sessions)
CREATE TABLE IF NOT EXISTS slot_coaches (
  id text primary key,
  slot_id text references coach_slots (id) on delete cascade,
  coach_id text references coaches (id) on delete cascade,
  created_at timestamptz default now(),
  UNIQUE(slot_id, coach_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_class_coaches_class_id ON class_coaches(class_id);
CREATE INDEX IF NOT EXISTS idx_class_coaches_coach_id ON class_coaches(coach_id);
CREATE INDEX IF NOT EXISTS idx_slot_coaches_slot_id ON slot_coaches(slot_id);
CREATE INDEX IF NOT EXISTS idx_slot_coaches_coach_id ON slot_coaches(coach_id);

-- Migrate existing data: if a class has coach_id, create a junction record
INSERT INTO class_coaches (id, class_id, coach_id)
SELECT 
  'cc_' || classes.id || '_' || classes.coach_id as id,
  classes.id as class_id,
  classes.coach_id
FROM classes
WHERE classes.coach_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM class_coaches WHERE class_coaches.class_id = classes.id AND class_coaches.coach_id = classes.coach_id
  );

-- Migrate existing data: if a slot has coach_id, create a junction record
INSERT INTO slot_coaches (id, slot_id, coach_id)
SELECT 
  'sc_' || coach_slots.id || '_' || coach_slots.coach_id as id,
  coach_slots.id as slot_id,
  coach_slots.coach_id
FROM coach_slots
WHERE coach_slots.coach_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM slot_coaches WHERE slot_coaches.slot_id = coach_slots.id AND slot_coaches.coach_id = coach_slots.coach_id
  );


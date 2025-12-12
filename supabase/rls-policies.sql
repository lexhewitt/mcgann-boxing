-- RLS Policies for Fleetwood Boxing Gym
-- Run this in Supabase SQL Editor to enable RLS and create policies

-- Enable RLS on all tables
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unavailable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_alerts ENABLE ROW LEVEL SECURITY;

-- Members table policies
-- Allow all operations for anon role (for now - can be restricted later)
CREATE POLICY "Allow all operations on members for anon" ON public.members
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Coaches table policies
CREATE POLICY "Allow all operations on coaches for anon" ON public.coaches
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Classes table policies
CREATE POLICY "Allow all operations on classes for anon" ON public.classes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Bookings table policies
CREATE POLICY "Allow all operations on bookings for anon" ON public.bookings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Family members table policies
CREATE POLICY "Allow all operations on family_members for anon" ON public.family_members
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Coach slots table policies
CREATE POLICY "Allow all operations on coach_slots for anon" ON public.coach_slots
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Coach appointments table policies
CREATE POLICY "Allow all operations on coach_appointments for anon" ON public.coach_appointments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Transactions table policies
CREATE POLICY "Allow all operations on transactions for anon" ON public.transactions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Guest bookings table policies
CREATE POLICY "Allow all operations on guest_bookings for anon" ON public.guest_bookings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Coach availability table policies (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'coach_availability') THEN
    CREATE POLICY "Allow all operations on coach_availability for anon" ON public.coach_availability
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Unavailable slots table policies (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'unavailable_slots') THEN
    CREATE POLICY "Allow all operations on unavailable_slots for anon" ON public.unavailable_slots
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Notifications table policies (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    CREATE POLICY "Allow all operations on notifications for anon" ON public.notifications
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Booking alerts table policies (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'booking_alerts') THEN
    CREATE POLICY "Allow all operations on booking_alerts for anon" ON public.booking_alerts
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;





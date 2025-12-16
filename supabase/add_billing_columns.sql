-- Add billing preferences to guest_bookings and bookings tables
-- This allows tracking payment method and billing frequency

-- Add billing columns to guest_bookings
ALTER TABLE guest_bookings
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'ONE_OFF', -- ONE_OFF, PER_SESSION, WEEKLY, MONTHLY
  ADD COLUMN IF NOT EXISTS billing_frequency text, -- null for ONE_OFF, 'WEEKLY' or 'MONTHLY' for recurring
  ADD COLUMN IF NOT EXISTS stripe_customer_id text, -- For recurring payments
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text, -- For subscriptions
  ADD COLUMN IF NOT EXISTS next_billing_date date, -- When next payment is due
  ADD COLUMN IF NOT EXISTS contact_email text; -- Ensure email is stored

-- Add billing columns to bookings (for members)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'ONE_OFF',
  ADD COLUMN IF NOT EXISTS billing_frequency text,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS next_billing_date date;

-- Add billing columns to transactions
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'ONE_OFF',
  ADD COLUMN IF NOT EXISTS billing_frequency text,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS invoice_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

-- Create table for monthly statements/invoices
CREATE TABLE IF NOT EXISTS monthly_statements (
  id text primary key,
  member_id text references members (id),
  contact_email text not null,
  contact_name text,
  statement_period_start date not null,
  statement_period_end date not null,
  total_amount numeric not null,
  currency text default 'GBP',
  status text default 'PENDING', -- PENDING, SENT, PAID
  stripe_invoice_id text,
  sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- Create table for statement line items
CREATE TABLE IF NOT EXISTS statement_line_items (
  id text primary key,
  statement_id text references monthly_statements (id) on delete cascade,
  transaction_id text references transactions (id),
  booking_id text references bookings (id),
  description text not null,
  amount numeric not null,
  service_type text, -- CLASS, PRIVATE, GROUP_SESSION
  service_date date,
  created_at timestamptz default now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_guest_bookings_email ON guest_bookings(contact_email);
CREATE INDEX IF NOT EXISTS idx_bookings_member ON bookings(member_id);
CREATE INDEX IF NOT EXISTS idx_statements_member ON monthly_statements(member_id);
CREATE INDEX IF NOT EXISTS idx_statements_period ON monthly_statements(statement_period_start, statement_period_end);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(stripe_customer_id);




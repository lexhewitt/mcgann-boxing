-- Create password_reset_tokens table for forgot password functionality
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id text primary key,
  user_id text not null,
  user_type text not null check (user_type in ('member', 'coach')),
  token text not null unique,
  expires_at timestamptz not null,
  used boolean default false,
  created_at timestamptz default now()
);

-- Add index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id, user_type);

-- Clean up expired tokens (optional: can be run periodically)
-- DELETE FROM password_reset_tokens WHERE expires_at < now() OR used = true;


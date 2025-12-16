-- Create backups table to track system backups
CREATE TABLE IF NOT EXISTS backups (
  id text primary key default 'backup' || substr(gen_random_uuid()::text, 1, 10) || to_char(now(), 'YYMMDDHH24MISSMS'),
  created_by text not null, -- coach_id of the admin who created the backup
  created_at timestamptz default now(),
  backup_name text not null,
  backup_description text,
  file_size_bytes bigint,
  backup_data jsonb not null, -- The actual backup data as JSON
  restored_at timestamptz,
  restored_by text, -- coach_id of the admin who restored it
  is_active boolean default true -- If false, backup was deleted/archived
);

CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backups_created_by ON backups(created_by);
CREATE INDEX IF NOT EXISTS idx_backups_is_active ON backups(is_active);


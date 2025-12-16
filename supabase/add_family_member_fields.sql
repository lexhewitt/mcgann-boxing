-- Add ability and is_carded columns to family_members table
-- Run this in Supabase SQL Editor

-- Add ability column to family_members table
ALTER TABLE family_members 
ADD COLUMN IF NOT EXISTS ability text;

-- Add is_carded column to family_members table
ALTER TABLE family_members 
ADD COLUMN IF NOT EXISTS is_carded boolean default false;



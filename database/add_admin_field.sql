-- Migration: Add is_admin field to user_profiles table
-- Run this in your Supabase SQL Editor

-- Add is_admin column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create index for faster admin lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON user_profiles(is_admin) WHERE is_admin = true;

-- Grant necessary permissions (if needed)
-- The column will inherit existing RLS policies

-- Example: To set a user as admin, run:
-- UPDATE user_profiles SET is_admin = true WHERE email = 'admin@example.com';

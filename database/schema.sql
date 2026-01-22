-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  country TEXT,
  career_field TEXT CHECK (career_field IN (
    'technology', 'finance', 'healthcare', 'education', 
    'government', 'media', 'retail', 'manufacturing', 'other'
  )),
  interests TEXT[] DEFAULT '{}',
  risk_tolerance TEXT CHECK (risk_tolerance IN ('low', 'medium', 'high')),
  onboarding_completed BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'politics', 'economy', 'technology', 'health', 
    'environment', 'international', 'social'
  )),
  what_happened TEXT NOT NULL,
  why_people_care TEXT NOT NULL,
  what_this_means TEXT NOT NULL,
  what_likely_does_not_change TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Event Reads Table (track which events users have read)
CREATE TABLE IF NOT EXISTS user_event_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_expires_at ON events(expires_at);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_user_event_reads_user_id ON user_event_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_user_event_reads_event_id ON user_event_reads(event_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON user_profiles(is_admin) WHERE is_admin = true;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at 
  BEFORE UPDATE ON events 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_event_reads ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Events Policies
-- Everyone can read active (non-expired) events
CREATE POLICY "Everyone can read active events" ON events
  FOR SELECT USING (expires_at > NOW());

-- Only authenticated users can create events (for admin)
-- Note: You may want to restrict this further based on user role
CREATE POLICY "Authenticated users can create events" ON events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- User Event Reads Policies
-- Users can read their own read records
CREATE POLICY "Users can read own event reads" ON user_event_reads
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own read records
CREATE POLICY "Users can insert own event reads" ON user_event_reads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to sync email from auth.users to user_profiles
-- This function bypasses RLS to allow automatic profile creation
-- SECURITY DEFINER ensures it runs with elevated privileges to bypass RLS
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_profiles (id, email, created_at, updated_at)
  VALUES (
    NEW.id, 
    COALESCE(NEW.email, ''), 
    NOW(), 
    NOW()
  )
  ON CONFLICT (id) 
  DO UPDATE SET 
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log warning but don't fail the transaction
    -- This allows user creation to succeed even if profile creation fails
    RAISE WARNING 'Error in sync_user_email for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Trigger to sync email on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_user_email();

-- Event Drafts Table (for AI-extracted content before publishing)
CREATE TABLE IF NOT EXISTS event_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  extracted_data JSONB,
  title TEXT,
  date DATE,
  category TEXT CHECK (category IN (
    'politics', 'economy', 'technology', 'health', 
    'environment', 'international', 'social'
  )),
  what_happened TEXT,
  why_people_care TEXT,
  what_this_means TEXT,
  what_likely_does_not_change TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('extracting', 'draft', 'published', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for event_drafts
CREATE INDEX IF NOT EXISTS idx_event_drafts_admin_id ON event_drafts(admin_id);
CREATE INDEX IF NOT EXISTS idx_event_drafts_status ON event_drafts(status);
CREATE INDEX IF NOT EXISTS idx_event_drafts_created_at ON event_drafts(created_at DESC);

-- Trigger to auto-update updated_at for event_drafts
CREATE TRIGGER update_event_drafts_updated_at 
  BEFORE UPDATE ON event_drafts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for event_drafts
ALTER TABLE event_drafts ENABLE ROW LEVEL SECURITY;

-- Admins can read all drafts
CREATE POLICY "Admins can read all drafts" ON event_drafts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.is_admin = true
    )
  );

-- Admins can insert their own drafts
CREATE POLICY "Admins can insert drafts" ON event_drafts
  FOR INSERT WITH CHECK (
    auth.uid() = admin_id
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.is_admin = true
    )
  );

-- Admins can update their own drafts
CREATE POLICY "Admins can update own drafts" ON event_drafts
  FOR UPDATE USING (
    auth.uid() = admin_id
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.is_admin = true
    )
  );

-- Migration script to add event_drafts table and related indexes
-- Run this after the main schema.sql if you need to add drafts to an existing database

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

-- Add category index to events if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);

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

-- Fix RLS policy for user_event_reads to support upsert operations
-- The upsert operation requires both INSERT and UPDATE policies

-- Add UPDATE policy for user_event_reads
-- Users can update their own read records (needed for upsert operations)
CREATE POLICY "Users can update own event reads" ON user_event_reads
  FOR UPDATE USING (auth.uid() = user_id);

-- Fix for "Database error saving new user" issue
-- Run this in your Supabase SQL Editor

-- Drop and recreate the function with proper error handling
DROP FUNCTION IF EXISTS sync_user_email() CASCADE;

-- Recreate the function with better error handling
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert user profile, handling conflicts gracefully
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION sync_user_email();

-- Grant necessary permissions (if needed)
-- Note: In Supabase, SECURITY DEFINER functions should bypass RLS automatically
-- But we can explicitly grant if needed
GRANT EXECUTE ON FUNCTION sync_user_email() TO service_role;
GRANT EXECUTE ON FUNCTION sync_user_email() TO authenticated;
GRANT EXECUTE ON FUNCTION sync_user_email() TO anon;

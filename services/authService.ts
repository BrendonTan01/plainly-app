import { supabase } from '../config/supabase';
import { UserProfile, OnboardingData } from '../types';
import { mapUserProfileFromDb } from '../utils/dbMapping';
import Constants from 'expo-constants';

/**
 * Send magic link email for authentication
 */
export async function signInWithMagicLink(email: string): Promise<{ error: Error | null }> {
  try {
    // Check if Supabase is configured
    const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return { 
        error: new Error('Supabase is not configured. Please check your app.json settings.') 
      };
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: 'plainly://auth/callback',
      },
    });

    if (error) {
      console.error('Supabase sign in error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        code: error.code,
      });
      // Return a more descriptive error - Supabase errors have a message property
      const errorMessage = error.message || 'Failed to send magic link. Please try again.';
      return { 
        error: new Error(errorMessage) 
      };
    }

    return { error: null };
  } catch (error) {
    console.error('Unexpected error in signInWithMagicLink:', error);
    return { 
      error: error instanceof Error 
        ? error 
        : new Error('An unexpected error occurred. Please try again.') 
    };
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithPassword(email: string, password: string): Promise<{ error: Error | null }> {
  try {
    const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return { 
        error: new Error('Supabase is not configured. Please check your app.json settings.') 
      };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Supabase sign in error:', error);
      const errorMessage = error.message || 'Failed to sign in. Please check your credentials.';
      return { 
        error: new Error(errorMessage) 
      };
    }

    return { error: null };
  } catch (error) {
    console.error('Unexpected error in signInWithPassword:', error);
    return { 
      error: error instanceof Error 
        ? error 
        : new Error('An unexpected error occurred. Please try again.') 
    };
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithPassword(email: string, password: string): Promise<{ error: Error | null }> {
  try {
    const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return { 
        error: new Error('Supabase is not configured. Please check your app.json settings.') 
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Supabase sign up error:', error);
      const errorMessage = error.message || 'Failed to create account. Please try again.';
      return { 
        error: new Error(errorMessage) 
      };
    }

    // If email confirmation is required, the user will need to confirm their email
    // The session will be available after confirmation
    return { error: null };
  } catch (error) {
    console.error('Unexpected error in signUpWithPassword:', error);
    return { 
      error: error instanceof Error 
        ? error 
        : new Error('An unexpected error occurred. Please try again.') 
    };
  }
}

/**
 * Legacy function name for backward compatibility
 * @deprecated Use signInWithMagicLink instead
 */
export async function signInWithEmail(email: string): Promise<{ error: Error | null }> {
  return signInWithMagicLink(email);
}

/**
 * Get current user session
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Get or create user profile
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching user profile:', error);
      return null;
    }

    if (!data) {
      // Get user email from auth
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email || '';

      // Create new profile
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email: email,
          onboarding_completed: false,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user profile:', createError);
        return null;
      }

      return mapUserProfileFromDb(newProfile);
    }

    return mapUserProfileFromDb(data);
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
}

/**
 * Update user profile with onboarding data
 */
export async function updateUserProfile(
  userId: string,
  onboardingData: OnboardingData
): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        country: onboardingData.country,
        career_field: onboardingData.careerField,
        interests: onboardingData.interests,
        risk_tolerance: onboardingData.riskTolerance,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return null;
    }

    return mapUserProfileFromDb(data);
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return null;
  }
}

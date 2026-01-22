import { supabase } from '../config/supabase';
import { Event, UserProfile, PersonalizedEvent } from '../types';
import { personalizeEvent } from '../utils/personalization';
import { mapEventFromDb, mapUserProfileFromDb } from '../utils/dbMapping';

/**
 * Get the active event for a user
 * An event is active if it hasn't been read and hasn't expired
 */
export async function getActiveEvent(userId: string): Promise<PersonalizedEvent | null> {
  try {
    // First, get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }

    const userProfile = mapUserProfileFromDb(profile);

    // Get active event (not expired, not read)
    const now = new Date().toISOString();
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1);

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return null;
    }

    if (!events || events.length === 0) {
      return null;
    }

    const event = mapEventFromDb(events[0]);
    
    // Check if user has already read this event
    const { data: readEvents } = await supabase
      .from('user_event_reads')
      .select('event_id')
      .eq('user_id', userId)
      .eq('event_id', event.id)
      .single();

    if (readEvents) {
      // User has already read this event
      return null;
    }

    // Personalize the event
    return personalizeEvent(event, userProfile);
  } catch (error) {
    console.error('Error in getActiveEvent:', error);
    return null;
  }
}

/**
 * Mark an event as read
 */
export async function markEventAsRead(userId: string, eventId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_event_reads')
      .insert({
        user_id: userId,
        event_id: eventId,
        read_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error marking event as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markEventAsRead:', error);
    return false;
  }
}

/**
 * Create a new event (admin function)
 */
export async function createEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event | null> {
  try {
    const { data, error } = await supabase
      .from('events')
      .insert({
        title: event.title,
        date: event.date,
        category: event.category,
        what_happened: event.whatHappened,
        why_people_care: event.whyPeopleCare,
        what_this_means: event.whatThisMeans,
        what_likely_does_not_change: event.whatLikelyDoesNotChange || null,
        expires_at: event.expiresAt,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return null;
    }

    // Map database fields to Event type
    return mapEventFromDb(data);
  } catch (error) {
    console.error('Error in createEvent:', error);
    return null;
  }
}

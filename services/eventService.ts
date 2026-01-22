import { supabase } from '../config/supabase';
import { Event, UserProfile, PersonalizedEvent } from '../types';
import { personalizeEvent } from '../utils/personalization';
import { mapEventFromDb, mapUserProfileFromDb } from '../utils/dbMapping';
import { calculateRelevanceScore } from '../utils/relevanceScoring';

/**
 * Get the active event for a user
 * Returns the most relevant non-expired event based on user preferences
 * Falls back to most recent event if no events meet relevance threshold
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

    // Get all non-expired events
    const now = new Date().toISOString();
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .gt('expires_at', now)
      .order('created_at', { ascending: false });

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return null;
    }

    if (!events || events.length === 0) {
      return null;
    }

    // Map database events to Event type
    const mappedEvents = events.map(mapEventFromDb);

    // Calculate relevance scores for each event
    const scoredEvents = mappedEvents.map(event => ({
      event,
      score: calculateRelevanceScore(event, userProfile)
    }));

    // Filter by minimum relevance threshold
    const MIN_RELEVANCE_THRESHOLD = 20;
    const relevantEvents = scoredEvents.filter(se => se.score >= MIN_RELEVANCE_THRESHOLD);

    // Sort by score DESC, then created_at DESC
    relevantEvents.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(b.event.createdAt).getTime() - new Date(a.event.createdAt).getTime();
    });

    // Get top event (or most recent if no relevant events)
    let selectedEvent: Event;
    if (relevantEvents.length > 0) {
      selectedEvent = relevantEvents[0].event;
    } else {
      // Fallback to most recent event if no events meet threshold
      const sortedByDate = [...mappedEvents].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      selectedEvent = sortedByDate[0];
    }

    // Personalize the event (regardless of read status)
    return personalizeEvent(selectedEvent, userProfile);
  } catch (error) {
    console.error('Error in getActiveEvent:', error);
    return null;
  }
}

/**
 * Mark an event as read
 * Uses upsert to avoid duplicate entries if already marked as read
 */
export async function markEventAsRead(userId: string, eventId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_event_reads')
      .upsert({
        user_id: userId,
        event_id: eventId,
        read_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,event_id'
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

/**
 * Get event recommendations for a user
 * Returns top N events ranked by relevance to user preferences
 */
export async function getEventRecommendations(userId: string, limit: number = 5): Promise<PersonalizedEvent[]> {
  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError);
      return [];
    }

    const userProfile = mapUserProfileFromDb(profile);

    // Get all non-expired events
    const now = new Date().toISOString();
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .gt('expires_at', now)
      .order('created_at', { ascending: false });

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return [];
    }

    if (!events || events.length === 0) {
      return [];
    }

    // Map and score events
    const mappedEvents = events.map(mapEventFromDb);
    const scoredEvents = mappedEvents.map(event => ({
      event,
      score: calculateRelevanceScore(event, userProfile)
    }));

    // Sort by score DESC, then created_at DESC
    scoredEvents.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(b.event.createdAt).getTime() - new Date(a.event.createdAt).getTime();
    });

    // Get top N events and personalize them
    const topEvents = scoredEvents.slice(0, limit).map(se => se.event);
    return topEvents.map(event => personalizeEvent(event, userProfile));
  } catch (error) {
    console.error('Error in getEventRecommendations:', error);
    return [];
  }
}

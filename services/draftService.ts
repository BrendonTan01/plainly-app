import { supabase } from '../config/supabase';
import { EventDraft, DraftStatus } from '../types';
import { getCurrentUser } from './authService';

/**
 * Create a new draft from extracted data
 */
export async function createDraft(
  sourceUrl: string,
  extractedData: any,
  eventData?: Partial<EventDraft>
): Promise<EventDraft | null> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to create drafts');
    }

    const { data, error } = await supabase
      .from('event_drafts')
      .insert({
        admin_id: user.id,
        source_url: sourceUrl,
        extracted_data: extractedData,
        title: eventData?.title || null,
        date: eventData?.date || null,
        category: eventData?.category || null,
        what_happened: eventData?.whatHappened || null,
        why_people_care: eventData?.whyPeopleCare || null,
        what_this_means: eventData?.whatThisMeans || null,
        what_likely_does_not_change: eventData?.whatLikelyDoesNotChange || null,
        status: 'draft' as DraftStatus,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating draft:', error);
      return null;
    }

    return mapDraftFromDb(data);
  } catch (error) {
    console.error('Error in createDraft:', error);
    return null;
  }
}

/**
 * Update an existing draft
 */
export async function updateDraft(
  draftId: string,
  updates: Partial<EventDraft>
): Promise<EventDraft | null> {
  try {
    const { data, error } = await supabase
      .from('event_drafts')
      .update({
        title: updates.title || null,
        date: updates.date || null,
        category: updates.category || null,
        what_happened: updates.whatHappened || null,
        why_people_care: updates.whyPeopleCare || null,
        what_this_means: updates.whatThisMeans || null,
        what_likely_does_not_change: updates.whatLikelyDoesNotChange || null,
        status: updates.status || null,
      })
      .eq('id', draftId)
      .select()
      .single();

    if (error) {
      console.error('Error updating draft:', error);
      return null;
    }

    return mapDraftFromDb(data);
  } catch (error) {
    console.error('Error in updateDraft:', error);
    return null;
  }
}

/**
 * Get all drafts for the current admin user
 */
export async function getDrafts(status?: DraftStatus): Promise<EventDraft[]> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return [];
    }

    let query = supabase
      .from('event_drafts')
      .select('*')
      .eq('admin_id', user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching drafts:', error);
      return [];
    }

    return data.map(mapDraftFromDb);
  } catch (error) {
    console.error('Error in getDrafts:', error);
    return [];
  }
}

/**
 * Get a single draft by ID
 */
export async function getDraft(draftId: string): Promise<EventDraft | null> {
  try {
    const { data, error } = await supabase
      .from('event_drafts')
      .select('*')
      .eq('id', draftId)
      .single();

    if (error) {
      console.error('Error fetching draft:', error);
      return null;
    }

    return mapDraftFromDb(data);
  } catch (error) {
    console.error('Error in getDraft:', error);
    return null;
  }
}

/**
 * Delete a draft
 */
export async function deleteDraft(draftId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('event_drafts')
      .delete()
      .eq('id', draftId);

    if (error) {
      console.error('Error deleting draft:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteDraft:', error);
    return false;
  }
}

/**
 * Map database draft to EventDraft type
 */
function mapDraftFromDb(dbDraft: any): EventDraft {
  return {
    id: dbDraft.id,
    adminId: dbDraft.admin_id,
    sourceUrl: dbDraft.source_url,
    extractedData: dbDraft.extracted_data,
    title: dbDraft.title || undefined,
    date: dbDraft.date || undefined,
    category: dbDraft.category || undefined,
    whatHappened: dbDraft.what_happened || undefined,
    whyPeopleCare: dbDraft.why_people_care || undefined,
    whatThisMeans: dbDraft.what_this_means || undefined,
    whatLikelyDoesNotChange: dbDraft.what_likely_does_not_change || undefined,
    status: dbDraft.status as DraftStatus,
    createdAt: dbDraft.created_at,
    updatedAt: dbDraft.updated_at,
  };
}

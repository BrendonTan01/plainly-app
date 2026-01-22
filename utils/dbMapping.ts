import { UserProfile, Event } from '../types';

/**
 * Map database user_profile row to UserProfile type
 */
export function mapUserProfileFromDb(data: any): UserProfile {
  return {
    id: data.id,
    email: data.email,
    country: data.country,
    careerField: data.career_field,
    interests: data.interests || [],
    riskTolerance: data.risk_tolerance,
    onboardingCompleted: data.onboarding_completed || false,
    isAdmin: data.is_admin || false,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Map database event row to Event type
 */
export function mapEventFromDb(data: any): Event {
  return {
    id: data.id,
    title: data.title,
    date: data.date,
    category: data.category,
    whatHappened: data.what_happened,
    whyPeopleCare: data.why_people_care,
    whatThisMeans: data.what_this_means,
    whatLikelyDoesNotChange: data.what_likely_does_not_change,
    expiresAt: data.expires_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

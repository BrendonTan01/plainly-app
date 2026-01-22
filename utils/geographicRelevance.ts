import { Event } from '../types';

/**
 * Check if an event contains mentions of a specific country
 * Uses simple keyword matching (can be enhanced with NLP/geocoding later)
 */
export function eventContainsCountry(event: Event, country: string): boolean {
  if (!country || !country.trim()) {
    return false;
  }
  
  const searchText = `${event.title} ${event.whatHappened} ${event.whyPeopleCare} ${event.whatThisMeans}`.toLowerCase();
  const countryLower = country.toLowerCase().trim();
  
  // Simple keyword matching
  // This is a basic implementation - can be enhanced with:
  // - NLP for better country detection
  // - Geocoding API for location mentions
  // - Country code matching (US, USA, United States)
  return searchText.includes(countryLower);
}

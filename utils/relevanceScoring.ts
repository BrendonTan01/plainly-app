import { Event, UserProfile } from '../types';
import { eventContainsCountry } from './geographicRelevance';

/**
 * Calculate relevance score for an event based on user preferences
 * Returns a score from 0-100, where higher scores indicate better relevance
 * 
 * Scoring breakdown:
 * - Interest matching: 40 points max
 * - Career matching: 30 points max
 * - Geographic relevance: 20 points max
 * - Recency boost: 10 points max (decays over 7 days)
 */
export function calculateRelevanceScore(event: Event, profile: UserProfile): number {
  let score = 0;
  
  // Interest matching (40 points max)
  const interestCategoryMap: Record<string, string | string[]> = {
    'money': 'economy',
    'health': 'health',
    'environment': 'environment',
    'tech': 'technology',
    'work': ['economy', 'technology'] // Multiple categories
  };
  
  profile.interests.forEach(interest => {
    const categories = interestCategoryMap[interest];
    if (Array.isArray(categories)) {
      if (categories.includes(event.category)) {
        score += 40;
      }
    } else if (categories === event.category) {
      score += 40;
    }
  });
  
  // Career matching (30 points max)
  const careerCategoryMap: Record<string, string> = {
    'technology': 'technology',
    'finance': 'economy',
    'healthcare': 'health',
    'government': 'politics',
    'media': 'social',
    'education': 'social',
    'retail': 'economy',
    'manufacturing': 'economy',
    'other': '' // No specific category match
  };
  
  const careerCategory = careerCategoryMap[profile.careerField];
  if (careerCategory && careerCategory === event.category) {
    score += 30;
  }
  
  // Geographic relevance (20 points max)
  if (profile.country && eventContainsCountry(event, profile.country)) {
    score += 20;
  }
  
  // Recency boost (10 points max, decays over 7 days)
  const daysSinceCreation = daysBetween(event.createdAt, new Date().toISOString());
  score += Math.max(0, 10 - daysSinceCreation);
  
  return Math.min(100, score);
}

/**
 * Calculate days between two ISO date strings
 */
function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

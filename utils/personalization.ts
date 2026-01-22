import { Event, UserProfile, PersonalizedEvent } from '../types';

/**
 * Personalizes the "What this means for you" section based on user profile
 * Uses conditional language and references user inputs
 */
export function personalizeEvent(event: Event, userProfile: UserProfile): PersonalizedEvent {
  const { careerField, country, interests, riskTolerance } = userProfile;
  
  // Base personalized text with conditional language
  let personalizedText = event.whatThisMeans;
  
  // Add career-specific context if relevant
  if (event.category === 'economy' || event.category === 'technology') {
    if (careerField === 'technology' && event.category === 'technology') {
      personalizedText += ` If you work in technology, this ${riskTolerance === 'low' ? 'may' : 'could'} affect your industry.`;
    } else if (careerField === 'finance' && event.category === 'economy') {
      personalizedText += ` For those in finance, this ${riskTolerance === 'low' ? 'may' : 'could'} have implications.`;
    }
  }
  
  // Add country context if relevant
  if (event.category === 'international' || event.category === 'politics') {
    personalizedText += ` Depending on your location in ${country}, the impact ${riskTolerance === 'low' ? 'may be limited' : 'could vary'}.`;
  }
  
  // Add interest-based context
  if (interests.includes('money') && event.category === 'economy') {
    personalizedText += ` If financial stability is a concern, this ${riskTolerance === 'low' ? 'may' : 'could'} be worth monitoring.`;
  }
  
  if (interests.includes('health') && event.category === 'health') {
    personalizedText += ` For those focused on health, this ${riskTolerance === 'low' ? 'may' : 'could'} be relevant.`;
  }
  
  if (interests.includes('environment') && event.category === 'environment') {
    personalizedText += ` If environmental issues matter to you, this ${riskTolerance === 'low' ? 'may' : 'could'} be significant.`;
  }
  
  // Ensure all statements are conditional and cautious
  personalizedText = personalizedText.replace(/will/g, 'may');
  personalizedText = personalizedText.replace(/definitely/g, 'possibly');
  personalizedText = personalizedText.replace(/certainly/g, 'likely');
  
  return {
    ...event,
    personalizedWhatThisMeans: personalizedText.trim(),
  };
}

// User types
export type Country = string;
export type CareerField = 
  | 'technology'
  | 'finance'
  | 'healthcare'
  | 'education'
  | 'government'
  | 'media'
  | 'retail'
  | 'manufacturing'
  | 'other';

export type Interest = 'money' | 'work' | 'health' | 'environment' | 'tech';
export type RiskTolerance = 'low' | 'medium' | 'high';

export interface UserProfile {
  id: string;
  email: string;
  country: Country;
  careerField: CareerField;
  interests: Interest[];
  riskTolerance: RiskTolerance;
  onboardingCompleted: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

// Event types
export type EventCategory = 
  | 'politics'
  | 'economy'
  | 'technology'
  | 'health'
  | 'environment'
  | 'international'
  | 'social';

export interface Event {
  id: string;
  title: string;
  date: string;
  category: EventCategory;
  whatHappened: string;
  whyPeopleCare: string;
  whatThisMeans: string;
  whatLikelyDoesNotChange?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalizedEvent extends Event {
  personalizedWhatThisMeans: string;
}

// Onboarding types
export interface OnboardingData {
  country: Country;
  careerField: CareerField;
  interests: Interest[];
  riskTolerance: RiskTolerance;
}

// Draft types
export type DraftStatus = 'extracting' | 'draft' | 'published' | 'rejected';

export interface EventDraft {
  id: string;
  adminId: string;
  sourceUrl: string;
  extractedData?: any;
  title?: string;
  date?: string;
  category?: EventCategory;
  whatHappened?: string;
  whyPeopleCare?: string;
  whatThisMeans?: string;
  whatLikelyDoesNotChange?: string;
  status: DraftStatus;
  createdAt: string;
  updatedAt: string;
}

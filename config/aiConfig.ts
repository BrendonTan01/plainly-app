import Constants from 'expo-constants';

/**
 * AI Service Configuration
 * Supports multiple AI providers for content extraction
 */

export type AIService = 'claude' | 'openai' | 'groq' | 'firecrawl';

export interface AIConfig {
  service: AIService;
  anthropicApiKey?: string;
  openaiApiKey?: string;
  groqApiKey?: string;
  firecrawlApiKey?: string;
  minRelevanceThreshold: number;
  relevanceWeights: {
    interest: number;
    career: number;
    geographic: number;
    recency: number;
  };
}

// Default configuration - using Groq as free default
const defaultConfig: AIConfig = {
  service: 'groq', // Free tier available, very fast
  minRelevanceThreshold: 20,
  relevanceWeights: {
    interest: 40,
    career: 30,
    geographic: 20,
    recency: 10,
  },
};

/**
 * Get AI configuration from environment variables or app.config.js
 */
export function getAIConfig(): AIConfig {
  const extra = Constants.expoConfig?.extra || {};
  
  return {
    ...defaultConfig,
    service: (extra.aiService as AIService) || defaultConfig.service,
    anthropicApiKey: extra.anthropicApiKey || process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '',
    openaiApiKey: extra.openaiApiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
    groqApiKey: extra.groqApiKey || process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
    firecrawlApiKey: extra.firecrawlApiKey || process.env.EXPO_PUBLIC_FIRECRAWL_API_KEY || '',
    minRelevanceThreshold: extra.minRelevanceThreshold || defaultConfig.minRelevanceThreshold,
    relevanceWeights: {
      interest: extra.relevanceWeights?.interest || defaultConfig.relevanceWeights.interest,
      career: extra.relevanceWeights?.career || defaultConfig.relevanceWeights.career,
      geographic: extra.relevanceWeights?.geographic || defaultConfig.relevanceWeights.geographic,
      recency: extra.relevanceWeights?.recency || defaultConfig.relevanceWeights.recency,
    },
  };
}

/**
 * Extraction prompt template for LLM
 */
export const EXTRACTION_PROMPT = `Extract structured information from this article and format it as JSON.

REQUIRED fields (must be provided, cannot be null or empty):
1. title: The article title (REQUIRED - extract from the article)
2. what_happened: A factual summary of what happened (REQUIRED - 2-3 sentences, neutral tone)
3. why_people_care: Context explaining why this matters (REQUIRED - 2-3 sentences)
4. what_this_means: Base implications of this event (REQUIRED - 2-3 sentences, use conditional language like "may", "could", "might")
5. category: One of: politics, economy, technology, health, environment, international, social (REQUIRED - choose the most appropriate)

OPTIONAL fields:
6. date: The publication date (format: YYYY-MM-DD, or infer from content if not available - can be today's date if not found)
7. what_likely_does_not_change: What remains unchanged (1-2 sentences, optional field - can be null)

Important guidelines:
- Use neutral, factual language
- Avoid sensationalism or urgency
- Use conditional language (may, could, might) rather than definitive statements
- Keep summaries concise but informative
- ALL REQUIRED fields must have non-empty string values
- If date cannot be determined, use today's date in YYYY-MM-DD format
- If what_likely_does_not_change cannot be determined, use null

Return ONLY valid JSON matching this exact schema (no markdown, no code blocks, just pure JSON):
{
  "title": "string value here",
  "date": "YYYY-MM-DD",
  "category": "one of the categories listed above",
  "what_happened": "string value here",
  "why_people_care": "string value here",
  "what_this_means": "string value here",
  "what_likely_does_not_change": "string value or null"
}`;

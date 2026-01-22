import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';
import { getAIConfig, EXTRACTION_PROMPT } from '../config/aiConfig';
import { EventCategory } from '../types';

export interface ExtractedEventData {
  title: string;
  date: string;
  category: EventCategory;
  what_happened: string;
  why_people_care: string;
  what_this_means: string;
  what_likely_does_not_change?: string | null;
}

/**
 * Fetch HTML content from a URL
 * Note: In a React Native environment, you may need to use a different approach
 * For web, fetch works. For mobile, consider using expo-web-browser or a backend proxy
 */
async function fetchHtmlFromUrl(url: string): Promise<string> {
  try {
    // Trim and validate URL is not empty
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      throw new Error('URL cannot be empty');
    }

    // Validate URL format
    let urlObj: URL;
    try {
      // Add protocol if missing
      let urlToValidate = trimmedUrl;
      if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
        urlToValidate = `https://${trimmedUrl}`;
      }
      urlObj = new URL(urlToValidate);
    } catch (urlError) {
      throw new Error(`Invalid URL format: ${trimmedUrl}. Please include http:// or https://`);
    }

    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('URL must use http or https protocol');
    }

    // Use the validated URL
    const finalUrl = urlObj.toString();

    // Fetch the page
    let response: Response;
    try {
      response = await fetch(finalUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PlainlyBot/1.0)',
        },
      });
    } catch (fetchError: any) {
      // Handle network errors
      if (fetchError.message?.includes('Network request failed') || 
          fetchError.message?.includes('Failed to fetch') ||
          fetchError.message?.includes('NetworkError')) {
        throw new Error('Network error: Unable to reach the URL. This may be due to CORS restrictions, network connectivity, or the website blocking requests. Consider using a backend proxy service.');
      }
      if (fetchError.message?.includes('CORS')) {
        throw new Error('CORS error: The website blocked the request. This is common in React Native. Consider using a backend proxy or service like Firecrawl.');
      }
      throw new Error(`Failed to fetch URL: ${fetchError.message || 'Unknown network error'}`);
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}. The server returned an error.`);
    }

    const html = await response.text();
    
    if (!html || html.length === 0) {
      throw new Error('Received empty response from the URL');
    }

    return html;
  } catch (error) {
    console.error('Error fetching URL:', error);
    // Re-throw with improved error message if it's not already an Error
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Unexpected error while fetching URL: ${String(error)}`);
  }
}

/**
 * Extract main content from HTML (simple implementation)
 * In production, consider using a library like Readability or Mercury Parser
 */
function extractMainContent(html: string): string {
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Extract text from common article containers
  const articleMatch = text.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    text = articleMatch[1];
  } else {
    // Fallback: try main content area
    const mainMatch = text.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (mainMatch) {
      text = mainMatch[1];
    }
  }
  
  // Remove HTML tags and decode entities
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  // Limit length to avoid token limits (keep first 8000 characters)
  return text.substring(0, 8000);
}

/**
 * Parse JSON from AI response (handles markdown code blocks)
 */
function parseJsonResponse(responseText: string): any {
  let jsonText = responseText.trim();
  
  // Remove markdown code blocks if present
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  
  return JSON.parse(jsonText);
}

/**
 * Validate and normalize extracted data
 */
function validateExtractedData(extracted: any): ExtractedEventData {
  // Validate required fields
  if (!extracted.title || !extracted.what_happened || !extracted.why_people_care || !extracted.what_this_means) {
    throw new Error('Extraction missing required fields');
  }

  // Validate category
  const validCategories: EventCategory[] = ['politics', 'economy', 'technology', 'health', 'environment', 'international', 'social'];
  if (!validCategories.includes(extracted.category)) {
    throw new Error(`Invalid category: ${extracted.category}`);
  }

  // Set default date if not provided
  if (!extracted.date) {
    extracted.date = new Date().toISOString().split('T')[0];
  }

  return extracted as ExtractedEventData;
}

/**
 * Extract structured event data from HTML using Groq
 */
async function extractFromHtmlWithGroq(html: string): Promise<ExtractedEventData> {
  const config = getAIConfig();
  
  if (!config.groqApiKey) {
    throw new Error('Groq API key is not configured. Please set EXPO_PUBLIC_GROQ_API_KEY in your .env file or environment variables.');
  }

  const groq = new Groq({
    apiKey: config.groqApiKey,
  });

  // Extract main content from HTML
  const mainContent = extractMainContent(html);
  
  if (!mainContent || mainContent.length < 100) {
    throw new Error('Could not extract sufficient content from the webpage');
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `${EXTRACTION_PROMPT}\n\nArticle content:\n\n${mainContent}`,
        },
      ],
      model: 'llama-3.3-70b-versatile', // Free, fast, and capable model
      temperature: 0.3, // Lower temperature for more consistent extraction
      max_tokens: 2000,
      response_format: { type: 'json_object' }, // Request JSON format
    });

    const responseText = completion.choices[0]?.message?.content || '';
    
    if (!responseText) {
      throw new Error('Empty response from Groq API');
    }

    const extracted = parseJsonResponse(responseText);
    return validateExtractedData(extracted);
  } catch (error) {
    console.error('Error extracting with Groq:', error);
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse AI response as JSON. The AI may have returned invalid data.');
    }
    throw error;
  }
}

/**
 * Extract structured event data from HTML using Claude AI
 */
async function extractFromHtmlWithClaude(html: string): Promise<ExtractedEventData> {
  const config = getAIConfig();
  
  if (!config.anthropicApiKey) {
    throw new Error('Anthropic API key is not configured. Please set EXPO_PUBLIC_ANTHROPIC_API_KEY in your .env file or environment variables.');
  }

  const client = new Anthropic({
    apiKey: config.anthropicApiKey,
  });

  // Extract main content from HTML
  const mainContent = extractMainContent(html);
  
  if (!mainContent || mainContent.length < 100) {
    throw new Error('Could not extract sufficient content from the webpage');
  }

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4.5', // Using Claude Haiku for cost-effectiveness
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `${EXTRACTION_PROMPT}\n\nArticle content:\n\n${mainContent}`,
        },
      ],
    });

    // Extract text from response
    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : JSON.stringify(message.content[0]);

    const extracted = parseJsonResponse(responseText);
    return validateExtractedData(extracted);
  } catch (error) {
    console.error('Error extracting with Claude:', error);
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse AI response as JSON. The AI may have returned invalid data.');
    }
    throw error;
  }
}

/**
 * Extract structured event data from HTML using the configured AI service
 */
async function extractFromHtml(html: string): Promise<ExtractedEventData> {
  const config = getAIConfig();
  
  switch (config.service) {
    case 'groq':
      return extractFromHtmlWithGroq(html);
    case 'claude':
      return extractFromHtmlWithClaude(html);
    case 'openai':
      throw new Error('OpenAI extraction not yet implemented. Please use Groq or Claude.');
    case 'firecrawl':
      throw new Error('Firecrawl extraction not yet implemented. Please use Groq or Claude.');
    default:
      throw new Error(`Unsupported AI service: ${config.service}`);
  }
}

/**
 * Extract event data from a URL
 * Fetches the webpage, extracts content, and uses AI to structure it
 */
export async function extractFromUrl(url: string): Promise<ExtractedEventData> {
  try {
    // Fetch HTML
    const html = await fetchHtmlFromUrl(url);
    
    // Extract using AI
    const extracted = await extractFromHtml(html);
    
    return extracted;
  } catch (error) {
    console.error('Error in extractFromUrl:', error);
    throw error;
  }
}

/**
 * Format extracted data as an Event object (for creating events)
 */
export function formatAsEvent(extracted: ExtractedEventData, expiresInDays: number = 7): Omit<import('../types').Event, 'id' | 'createdAt' | 'updatedAt'> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  return {
    title: extracted.title,
    date: extracted.date,
    category: extracted.category,
    whatHappened: extracted.what_happened,
    whyPeopleCare: extracted.why_people_care,
    whatThisMeans: extracted.what_this_means,
    whatLikelyDoesNotChange: extracted.what_likely_does_not_change || undefined,
    expiresAt: expiresAt.toISOString(),
  };
}

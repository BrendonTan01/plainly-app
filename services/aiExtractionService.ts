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
 * Fetch content from a URL using Firecrawl API
 * Returns clean Markdown content, which is more efficient for LLM processing
 */
async function fetchContentFromFirecrawl(url: string): Promise<string> {
  const config = getAIConfig();
  
  if (!config.firecrawlApiKey) {
    throw new Error('Firecrawl API key is not configured. Please set EXPO_PUBLIC_FIRECRAWL_API_KEY in your .env file or environment variables.');
  }

  try {
    // Validate and normalize URL
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      throw new Error('URL cannot be empty');
    }

    let urlObj: URL;
    try {
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

    const finalUrl = urlObj.toString();

    // Call Firecrawl API
    const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: finalUrl,
        formats: ['markdown'], // Get clean Markdown instead of HTML
        onlyMainContent: true, // Focus on article content, skip navigation/ads
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        throw new Error('Firecrawl API key is invalid. Please check your EXPO_PUBLIC_FIRECRAWL_API_KEY.');
      } else if (response.status === 429) {
        throw new Error('Firecrawl rate limit exceeded. Please wait before trying again or upgrade your plan.');
      } else if (response.status === 402) {
        throw new Error('Firecrawl credits exhausted. Please add credits to your account.');
      } else if (response.status >= 500) {
        throw new Error(`Firecrawl server error (${response.status}). Please try again later.`);
      }
      throw new Error(`Firecrawl API error: ${response.status} ${response.statusText}. ${errorData.error || ''}`);
    }

    const data = await response.json();
    
    if (!data.data) {
      throw new Error('Firecrawl returned empty response');
    }

    // Prefer Markdown, fallback to content if Markdown not available
    const content = data.data.markdown || data.data.content;
    
    if (!content || content.length === 0) {
      throw new Error('Firecrawl returned empty content from the URL');
    }

    return content;
  } catch (error) {
    console.error('Error fetching from Firecrawl:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Unexpected error while fetching from Firecrawl: ${String(error)}`);
  }
}

/**
 * Fetch HTML content from a URL (fallback method)
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
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
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
      // Provide specific error messages for common status codes
      if (response.status === 403) {
        throw new Error(`403 Forbidden: The website blocked the request. This is common when websites detect automated requests or have CORS restrictions. Solutions: 1) Use a backend proxy service, 2) Use a service like Firecrawl or ScraperAPI, 3) The website may require authentication or have anti-bot protection.`);
      } else if (response.status === 404) {
        throw new Error(`404 Not Found: The URL does not exist or has been removed.`);
      } else if (response.status === 429) {
        throw new Error(`429 Too Many Requests: Rate limit exceeded. Please wait before trying again.`);
      } else if (response.status >= 500) {
        throw new Error(`${response.status} Server Error: The website's server is experiencing issues. Please try again later.`);
      }
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
 * Extract main content from HTML or Markdown
 * If content is already Markdown (from Firecrawl), return it directly
 * Otherwise, extract and clean HTML content
 */
function extractMainContent(content: string, isMarkdown: boolean = false): string {
  // If already Markdown, just clean and limit length
  if (isMarkdown) {
    // Clean up excessive whitespace
    let text = content.replace(/\n{3,}/g, '\n\n').trim();
    // Limit length to avoid token limits (keep first 12000 characters for Markdown)
    return text.substring(0, 12000);
  }

  // HTML processing (original logic)
  // Remove script and style tags
  let text = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
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
 * Parse JSON from AI response (handles markdown code blocks and various formats)
 */
function parseJsonResponse(responseText: string): any {
  let jsonText = responseText.trim();
  
  // Remove markdown code blocks if present (handle various formats)
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\s*/i, '').replace(/\s*```\s*$/i, '');
  }
  
  // Try to find JSON object in the text if it's wrapped in other text
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonText = jsonMatch[0];
  }
  
  // Remove any leading/trailing whitespace again
  jsonText = jsonText.trim();
  
  try {
    return JSON.parse(jsonText);
  } catch (parseError) {
    console.error('JSON parse error. Text received:', jsonText);
    throw new Error(`Failed to parse JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
  }
}

/**
 * Validate and normalize extracted data
 */
function validateExtractedData(extracted: any): ExtractedEventData {
  // Check which required fields are missing
  const missingFields: string[] = [];
  if (!extracted.title || (typeof extracted.title === 'string' && extracted.title.trim() === '')) {
    missingFields.push('title');
  }
  if (!extracted.what_happened || (typeof extracted.what_happened === 'string' && extracted.what_happened.trim() === '')) {
    missingFields.push('what_happened');
  }
  if (!extracted.why_people_care || (typeof extracted.why_people_care === 'string' && extracted.why_people_care.trim() === '')) {
    missingFields.push('why_people_care');
  }
  if (!extracted.what_this_means || (typeof extracted.what_this_means === 'string' && extracted.what_this_means.trim() === '')) {
    missingFields.push('what_this_means');
  }

  if (missingFields.length > 0) {
    console.error('Missing required fields:', missingFields);
    console.error('Extracted data received:', JSON.stringify(extracted, null, 2));
    throw new Error(`Extraction missing required fields: ${missingFields.join(', ')}`);
  }

  // Validate category
  const validCategories: EventCategory[] = ['politics', 'economy', 'technology', 'health', 'environment', 'international', 'social'];
  if (!extracted.category || !validCategories.includes(extracted.category)) {
    console.error('Invalid or missing category:', extracted.category);
    console.error('Extracted data received:', JSON.stringify(extracted, null, 2));
    throw new Error(`Invalid category: ${extracted.category || 'missing'}. Must be one of: ${validCategories.join(', ')}`);
  }

  // Set default date if not provided
  if (!extracted.date) {
    extracted.date = new Date().toISOString().split('T')[0];
  }

  return extracted as ExtractedEventData;
}

/**
 * Extract structured event data from HTML or Markdown using Groq
 */
async function extractFromHtmlWithGroq(content: string, isMarkdown: boolean = false): Promise<ExtractedEventData> {
  const config = getAIConfig();
  
  if (!config.groqApiKey) {
    throw new Error('Groq API key is not configured. Please set EXPO_PUBLIC_GROQ_API_KEY in your .env file or environment variables.');
  }

  const groq = new Groq({
    apiKey: config.groqApiKey,
  });

  // Extract main content (handles both HTML and Markdown)
  const mainContent = extractMainContent(content, isMarkdown);
  
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

    console.log('Groq raw response:', responseText);
    
    let extracted;
    try {
      extracted = parseJsonResponse(responseText);
      console.log('Parsed JSON:', JSON.stringify(extracted, null, 2));
    } catch (parseError) {
      console.error('Failed to parse JSON response:', responseText);
      throw new Error(`Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }
    
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
 * Extract structured event data from HTML or Markdown using Claude AI
 */
async function extractFromHtmlWithClaude(content: string, isMarkdown: boolean = false): Promise<ExtractedEventData> {
  const config = getAIConfig();
  
  if (!config.anthropicApiKey) {
    throw new Error('Anthropic API key is not configured. Please set EXPO_PUBLIC_ANTHROPIC_API_KEY in your .env file or environment variables.');
  }

  const client = new Anthropic({
    apiKey: config.anthropicApiKey,
  });

  // Extract main content (handles both HTML and Markdown)
  const mainContent = extractMainContent(content, isMarkdown);
  
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
 * Extract structured event data from HTML or Markdown using the configured AI service
 * @param content - HTML or Markdown content
 * @param isMarkdown - Whether the content is Markdown (from Firecrawl) or HTML
 */
async function extractFromHtml(content: string, isMarkdown: boolean = false): Promise<ExtractedEventData> {
  const config = getAIConfig();
  
  switch (config.service) {
    case 'groq':
      return extractFromHtmlWithGroq(content, isMarkdown);
    case 'claude':
      return extractFromHtmlWithClaude(content, isMarkdown);
    case 'openai':
      throw new Error('OpenAI extraction not yet implemented. Please use Groq or Claude.');
    case 'firecrawl':
      // Firecrawl is used for scraping, but we still need an LLM for extraction
      // Default to Groq if available, otherwise Claude
      if (config.groqApiKey) {
        return extractFromHtmlWithGroq(content, isMarkdown);
      } else if (config.anthropicApiKey) {
        return extractFromHtmlWithClaude(content, isMarkdown);
      } else {
        throw new Error('Firecrawl scraping requires either Groq or Claude API key for extraction. Please configure EXPO_PUBLIC_GROQ_API_KEY or EXPO_PUBLIC_ANTHROPIC_API_KEY.');
      }
    default:
      throw new Error(`Unsupported AI service: ${config.service}`);
  }
}

/**
 * Extract event data from a URL
 * Uses Firecrawl if configured, otherwise falls back to basic fetch
 * Then extracts content using AI to structure it
 */
export async function extractFromUrl(url: string): Promise<ExtractedEventData> {
  try {
    const config = getAIConfig();
    let content: string;
    let isMarkdown = false;

    // Try Firecrawl first if API key is configured
    if (config.firecrawlApiKey) {
      try {
        content = await fetchContentFromFirecrawl(url);
        isMarkdown = true; // Firecrawl returns Markdown
        console.log('Successfully fetched content using Firecrawl');
      } catch (firecrawlError) {
        console.warn('Firecrawl failed, falling back to basic fetch:', firecrawlError);
        // Fallback to basic fetch if Firecrawl fails
        content = await fetchHtmlFromUrl(url);
        isMarkdown = false;
      }
    } else {
      // No Firecrawl API key, use basic fetch
      content = await fetchHtmlFromUrl(url);
      isMarkdown = false;
    }
    
    // Extract using AI (handles both HTML and Markdown)
    const extracted = await extractFromHtml(content, isMarkdown);
    
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

# Plainly App Improvements: AI Content Extraction & Preference Systems

## Part 1: AI Service Options for Web Scraping & Content Extraction

### Option 1: Firecrawl API

**Overview**: Specialized web scraping service that converts websites into clean, AI-ready data (Markdown/JSON).

**Pros**:
- **Purpose-built for web scraping**: Handles JavaScript rendering, anti-bot detection, and dynamic content automatically
- **Clean output**: Returns Markdown (67% fewer tokens than raw HTML), reducing LLM processing costs
- **Multiple endpoints**: Scrape (single pages), Crawl (entire sites), Map (URL discovery), Search (web search with full content)
- **AI Agent feature**: Natural language extraction requests (e.g., "extract article title, summary, and key points")
- **Structured extraction**: JSON schema support for reliable data extraction
- **Authenticated scraping**: Can access content behind login walls
- **Fast responses**: Sub-10 second responses when combined with fast inference providers
- **Enterprise-ready**: SOC 2 Type 2 compliant
- **Native integrations**: LangChain, LlamaIndex, Dify, Flowise

**Cons**:
- **Additional service dependency**: Requires managing another API key and service
- **Credit-based pricing**: Can be expensive at scale (1 credit per page)
- **Rate limits**: Free tier has 500 credits (one-time), Hobby tier: 3,000/month, Standard: 100,000/month
- **Limited to web content**: Not designed for other content types (PDFs, images, etc.)
- **May still need LLM**: For complex extraction tasks, you might still need to pass Firecrawl output to an LLM

**Pricing**:
- Free: 500 credits (one-time)
- Hobby: $16/month (3,000 credits)
- Standard: $83/month (100,000 credits) - most popular
- Growth: $333/month (500,000 credits)
- Scale: $599/month (1,000,000 credits)

**Best for**: When you need reliable web scraping with minimal setup, handling complex JavaScript sites, or when you want to offload scraping infrastructure.

---

### Option 2: OpenAI GPT-4o with Structured Outputs

**Overview**: Use GPT-4o's structured output feature to extract content from web pages (HTML/Markdown).

**Pros**:
- **Most capable model**: GPT-4o is highly capable at understanding context and extracting structured data
- **Structured outputs**: 100% schema adherence - no malformed JSON, reliable type-safety
- **Flexible**: Can handle any content type (web pages, PDFs, documents, etc.)
- **Single service**: One API for both scraping logic and extraction
- **Recent price cuts**: 50% cost reduction on GPT-4o-2024-08-06
- **No additional infrastructure**: Works with raw HTML/Markdown you provide
- **Context understanding**: Excellent at understanding semantic meaning, not just structure

**Cons**:
- **Requires HTML fetching**: You need to fetch web pages yourself (using fetch, Puppeteer, etc.)
- **Token costs**: Processing full HTML can be expensive (though Markdown conversion helps)
- **Slower**: LLM inference is slower than specialized scraping services
- **Rate limits**: OpenAI has rate limits that may constrain high-volume scraping
- **Cost at scale**: $2.50/$10 per million tokens (input/output) - can add up with many articles
- **JavaScript handling**: You'd need to handle JavaScript rendering yourself (Puppeteer, Playwright)

**Pricing** (GPT-4o-2024-08-06):
- Input: $2.50 per million tokens
- Output: $10.00 per million tokens

**Best for**: When you want maximum extraction quality, need to handle various content types, or prefer a single AI service for all tasks.

---

### Option 3: Anthropic Claude (Sonnet/Haiku)

**Overview**: Use Claude's API to extract structured data from web content with strong semantic understanding.

**Pros**:
- **Excellent at structured extraction**: Strong instruction-following and JSON/CSV output capabilities
- **Large context window**: Up to 200,000 tokens (Claude 3.5 Sonnet) for processing large pages
- **Semantic understanding**: Adapts to layout changes without brittle selectors
- **Cost-effective options**: Claude Haiku 4.5 is very affordable ($1/$5 per million tokens)
- **Prompt caching**: Up to 90% savings on repeated context (useful for similar article structures)
- **Batch processing**: 50% discount on API calls
- **Flexible**: Can handle various content formats

**Cons**:
- **Requires HTML fetching**: Like OpenAI, you need to fetch pages yourself
- **JavaScript handling**: Need separate tools for dynamic content
- **Slower than specialized scrapers**: LLM inference adds latency
- **Token costs**: Can accumulate with many articles (though Haiku is cheap)
- **Two-step process**: Fetch page → send to Claude → extract

**Pricing** (Claude 4.5 Series):
- Haiku: $1 input / $5 output per million tokens (cheapest)
- Sonnet: $3 input / $15 output per million tokens (balanced)
- Opus: $5 input / $25 output per million tokens (most capable)

**Best for**: When you want high-quality extraction with cost-effective options (Haiku), need large context windows, or prefer Anthropic's approach to structured outputs.

---

### Option 4: Hybrid Approach (Firecrawl + LLM)

**Overview**: Use Firecrawl to get clean Markdown, then pass to an LLM (OpenAI/Claude) for structured extraction.

**Pros**:
- **Best of both worlds**: Firecrawl handles scraping complexity, LLM handles extraction intelligence
- **Cost optimization**: Firecrawl's Markdown output reduces LLM token costs significantly
- **Reliable scraping**: Firecrawl handles JavaScript, anti-bot, etc.
- **Flexible extraction**: LLM can adapt to different article structures
- **Quality output**: Clean Markdown + intelligent extraction = high-quality results

**Cons**:
- **Two API calls**: Adds latency and complexity
- **Higher cost**: Paying for both services
- **More moving parts**: More potential failure points
- **Complexity**: Need to manage two services and coordinate between them

**Best for**: When you need both reliable scraping AND intelligent extraction, and cost isn't the primary constraint.

---

### Recommendation Matrix

| Use Case | Recommended Service | Reason |
|----------|-------------------|--------|
| **Simple, high-volume scraping** | Firecrawl | Fast, reliable, purpose-built |
| **Complex extraction, quality-focused** | OpenAI GPT-4o | Most capable, structured outputs |
| **Cost-conscious, quality extraction** | Claude Haiku | Best price/performance |
| **Complex sites + smart extraction** | Firecrawl + LLM | Combines strengths |
| **Budget-constrained MVP** | Claude Haiku | Lowest cost option |

---

## Part 2: Preference-Based Event Filtering & Prioritization Strategies

### Current State Analysis

**What exists now**:
- User preferences stored: `country`, `career_field`, `interests[]`, `risk_tolerance`
- Personalization happens AFTER event selection (modifies "What this means" section)
- Event selection: Simply returns most recent non-expired event (no preference filtering)
- Preferences are NOT used to filter or prioritize which events are shown

**Gap**: The PreferencesScreen says "We'll prioritize events in these areas" but this isn't implemented.

---

### Strategy 1: Filter-Only Approach

**How it works**: Only show events that match user preferences. Hide all others.

**Implementation**:
```typescript
// Filter events by:
// - Category matches user interests (e.g., 'economy' event for 'money' interest)
// - Category matches career field (e.g., 'technology' event for tech career)
// - Geographic relevance (if event mentions user's country)
```

**Pros**:
- **Simple to implement**: Clear yes/no filtering logic
- **Highly relevant**: Users only see events they care about
- **Reduces noise**: No irrelevant content
- **Fast queries**: Simple WHERE clauses

**Cons**:
- **Too restrictive**: Users might miss important events outside their preferences
- **Empty states**: If no events match, user sees nothing
- **Rigid**: Doesn't account for evolving interests or breaking news
- **Limited discovery**: Users never see new topics they might find interesting
- **Poor for new users**: Until preferences are set, no content shown

**Best for**: Users who want strict control and only care about specific topics.

---

### Strategy 2: Prioritize-Only Approach

**How it works**: Show all events, but rank them by relevance to preferences. Most relevant first.

**Implementation**:
```typescript
// Score each event:
// - +10 points: Category matches primary interest
// - +8 points: Category matches career field
// - +5 points: Geographic relevance
// - +3 points: Category matches secondary interest
// - +1 point: Any event (baseline)
// Order by score DESC, then by created_at DESC
```

**Pros**:
- **No empty states**: Always shows content
- **Discovery enabled**: Users can still see other events
- **Flexible**: Can adjust scoring weights
- **Good for new users**: Shows content even without preferences
- **Balanced**: Relevance + recency

**Cons**:
- **Less focused**: Users still see less relevant content
- **More complex queries**: Requires scoring/ranking logic
- **Performance**: More computation than simple filtering
- **May feel random**: Low-scoring events might confuse users

**Best for**: Users who want personalized content but also want to discover new topics.

---

### Strategy 3: Scoring-Based Ranking

**How it works**: Calculate a relevance score (0-100) for each event based on preference overlap. Show events above a threshold, ranked by score.

**Implementation**:
```typescript
// Detailed scoring algorithm:
function calculateRelevanceScore(event: Event, profile: UserProfile): number {
  let score = 0;
  
  // Category matching (40% weight)
  if (profile.interests.includes('money') && event.category === 'economy') score += 40;
  if (profile.interests.includes('health') && event.category === 'health') score += 40;
  if (profile.interests.includes('environment') && event.category === 'environment') score += 40;
  if (profile.interests.includes('tech') && event.category === 'technology') score += 40;
  
  // Career matching (30% weight)
  if (profile.careerField === 'technology' && event.category === 'technology') score += 30;
  if (profile.careerField === 'finance' && event.category === 'economy') score += 30;
  // ... more career matches
  
  // Geographic relevance (20% weight)
  // Use NLP to detect if event mentions user's country
  if (eventContainsCountry(event, profile.country)) score += 20;
  
  // Recency boost (10% weight)
  const daysSinceCreation = daysBetween(event.createdAt, now);
  score += Math.max(0, 10 - daysSinceCreation); // Decay over 10 days
  
  return Math.min(100, score);
}

// Show events with score >= 30, ordered by score DESC
```

**Pros**:
- **Nuanced**: Captures multiple preference dimensions
- **Configurable**: Easy to adjust weights
- **Transparent**: Can show users why events are relevant
- **Balanced**: Combines multiple signals
- **Threshold control**: Filter low-relevance while keeping discovery

**Cons**:
- **Complex implementation**: Requires scoring algorithm
- **Database complexity**: May need computed columns or views
- **Performance**: Scoring all events can be slow
- **Tuning required**: Need to find optimal threshold and weights

**Best for**: When you want sophisticated personalization with fine-grained control.

---

### Strategy 4: Hybrid Filter + Prioritize

**How it works**: Filter out very low-relevance events (score < threshold), then prioritize remaining events by score.

**Implementation**:
```typescript
// Step 1: Calculate scores for all events
// Step 2: Filter: score >= MIN_RELEVANCE_THRESHOLD (e.g., 20)
// Step 3: Sort: score DESC, then created_at DESC
// Step 4: Limit: Show top N events (e.g., 5-10)

const MIN_RELEVANCE_THRESHOLD = 20; // Configurable
const MAX_EVENTS_TO_SHOW = 5;
```

**Pros**:
- **Best of both worlds**: Filters noise, prioritizes relevance
- **Flexible threshold**: Can adjust strictness
- **Performance**: Filters before sorting (fewer items to rank)
- **User control**: Can adjust threshold based on user preference
- **Handles edge cases**: New users see all events (threshold = 0)

**Cons**:
- **Two-step process**: Filter then sort
- **Threshold tuning**: Need to find optimal cutoff
- **May still miss important events**: If threshold too high

**Best for**: Most use cases - balances relevance with discovery.

---

### Strategy 5: Preference-Based Event Queue

**How it works**: Maintain a personalized queue per user. Events are added to queue based on relevance score. User sees next event from their queue.

**Implementation**:
```typescript
// New table: user_event_queue
// - user_id, event_id, relevance_score, queued_at, position
// 
// When new event created:
// 1. Calculate relevance for all users
// 2. Insert into queue if score >= threshold
// 3. Sort by score, then by queued_at
//
// When user requests event:
// 1. Get next event from their queue (position = 1)
// 2. After reading, remove from queue or mark as read
// 3. Shift remaining events up
```

**Pros**:
- **Personalized order**: Each user has their own queue
- **Predictable**: Users know what's coming next
- **Efficient**: Pre-computed, fast retrieval
- **Scalable**: Can handle many users and events
- **Analytics**: Can track queue performance

**Cons**:
- **Database complexity**: New table, triggers, maintenance
- **Real-time updates**: Need to update queues when preferences change
- **Storage**: More data to store
- **Complexity**: More moving parts

**Best for**: When you want highly personalized, pre-computed event ordering.

---

### Strategy 6: Multi-Factor Ranking with ML

**How it works**: Use machine learning to learn which events users engage with, combining explicit preferences with implicit behavior.

**Implementation**:
```typescript
// Features for ML model:
// - Explicit: interests, career, country, risk_tolerance
// - Implicit: read_time, skip_rate, engagement_score
// - Event features: category, length, recency, source
//
// Train model to predict: P(user_will_read | event, user_profile)
// Rank events by predicted probability
```

**Pros**:
- **Adaptive**: Learns from user behavior
- **Accurate**: Improves over time
- **Handles complexity**: Captures non-obvious patterns
- **Personal**: Each user gets unique model

**Cons**:
- **Complex**: Requires ML infrastructure
- **Cold start**: Needs data before working well
- **Maintenance**: Model training, updates, monitoring
- **Overkill for MVP**: Probably too complex initially

**Best for**: Mature product with lots of user data and engagement metrics.

---

### Recommendation Matrix

| Scenario | Recommended Strategy | Reason |
|----------|---------------------|--------|
| **MVP / Simple** | Strategy 4: Hybrid | Good balance, not too complex |
| **Strict personalization** | Strategy 1: Filter | Users only want specific topics |
| **Discovery-focused** | Strategy 2: Prioritize | Want to show variety |
| **Sophisticated** | Strategy 3: Scoring | Need fine-grained control |
| **Scale / Performance** | Strategy 5: Queue | Pre-computed, fast |
| **Mature product** | Strategy 6: ML | Learn from behavior |

---

## Implementation Considerations

### Database Changes Needed

**For Filtering/Prioritization**:
- Add indexes on `events.category` for fast filtering
- Consider materialized view for event scores (if using Strategy 3/4)
- Add `relevance_score` column to events (if pre-computing)

**For Queue System (Strategy 5)**:
- New table: `user_event_queue`
- Indexes: `(user_id, position)`, `(user_id, relevance_score DESC)`
- Triggers: Auto-populate queue when events created

### Performance Optimization

- **Caching**: Cache user profiles and preference-based queries
- **Batch processing**: Calculate scores in background jobs
- **Database views**: Pre-computed relevance scores
- **Pagination**: Limit events returned per query

### User Experience

- **Empty states**: Handle "no matching events" gracefully
- **Preference updates**: Recalculate when user changes preferences
- **Transparency**: Show users why events are relevant (optional)
- **Fallback**: Show recent events if no preferences set

---

## Recommended Implementation Plan

### Phase 1: Basic Preference Filtering (Strategy 4 - Hybrid)
1. Implement relevance scoring function
2. Add database indexes for performance
3. Modify `getActiveEvent` to filter and prioritize
4. Add preference change handlers to recalculate

### Phase 2: AI Content Extraction
1. Choose AI service (recommend Claude Haiku for cost-effectiveness)
2. Build admin UI for URL input
3. Implement web scraping + extraction pipeline
4. Add draft/edit workflow before publishing

### Phase 3: Enhanced Personalization
1. Improve scoring algorithm based on usage
2. Add geographic relevance detection
3. Implement event queue system if needed
4. Add analytics to track effectiveness

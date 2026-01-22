# Plainly

A minimalist mobile app that explains important world events in three clear layers, without urgency or sensationalism.

## Features

- **Email Magic Link Authentication** - No passwords needed
- **Lightweight Onboarding** - Country, career, interests, risk tolerance
- **One Event at a Time** - No feeds, no infinite scroll
- **Personalized Content** - Events tailored to your profile
- **Calm, Neutral Tone** - No urgency, no sensationalism
- **Event Expiration** - Events expire after being read or after a set time

## Tech Stack

- **React Native** with Expo
- **TypeScript**
- **Supabase** (Backend & Auth)
- **React Navigation**
- **React Native StyleSheet** (styling)

## Setup Instructions

### 1. Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase account

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `database/schema.sql`
3. Get your project URL and anon key from Settings > API
4. Update `app.json` with your Supabase credentials:

```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "https://your-project.supabase.co",
      "supabaseAnonKey": "your-anon-key"
    }
  }
}
```

### 4. Configure Email Authentication

In your Supabase dashboard:
1. Go to Authentication > URL Configuration
2. Add your redirect URL: `plainly://auth/callback`
3. Configure email templates (optional)

### 5. Run the App

```bash
# Start Expo development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

## Project Structure

```
├── App.tsx                 # Main app entry point with navigation
├── components/             # Reusable UI components
│   ├── Button.tsx
│   └── TextInput.tsx
├── screens/               # Screen components
│   ├── AuthScreen.tsx     # Email magic link login
│   ├── OnboardingScreen.tsx # User setup flow
│   ├── EventScreen.tsx    # Main event display
│   └── AdminScreen.tsx   # Manual event creation
├── services/              # Business logic
│   ├── authService.ts     # Authentication
│   └── eventService.ts    # Event management
├── config/                # Configuration
│   └── supabase.ts        # Supabase client
├── types/                 # TypeScript types
│   └── index.ts
├── utils/                 # Utility functions
│   └── personalization.ts # Event personalization logic
└── database/              # Database schema
    └── schema.sql
```

## Database Schema

### Tables

- **user_profiles** - User preferences and onboarding data
- **events** - World events with four sections
- **user_event_reads** - Tracks which events users have read

### Key Features

- Row Level Security (RLS) enabled
- Automatic email sync from auth.users
- Event expiration tracking
- Read status tracking

## Development Notes

### Design Principles

- **Calm & Minimal** - Large text, generous spacing, no urgency
- **Conditional Language** - Use "may", "could", "unlikely" instead of definitive statements
- **No Emojis** - Clean, professional content
- **Intelligent Reader** - Assume users are smart but anxious

### Personalization Logic

The `personalizeEvent` function in `utils/personalization.ts`:
- Adds career-specific context when relevant
- Includes country-based implications
- References user interests
- Adjusts tone based on risk tolerance
- Ensures all statements are conditional

### Event Structure

Each event contains:
1. **What happened** - Factual summary
2. **Why people care** - Context
3. **What this might mean for you** - Personalized, cautious implications
4. **What likely does not change** - Optional fourth section

## Admin Features

The Admin screen allows manual event creation. To access:
1. Navigate to Admin screen (add navigation button if needed)
2. Fill in all required fields
3. Set expiration date (default: 7 days)
4. Event will be personalized automatically for each user

## Future Enhancements (Not in MVP)

- Event archive
- Save for later
- Push notifications (opt-in)
- Comments/sharing
- Real-time alerts
- Predictions

## License

Private project - All rights reserved

# Plainly Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Supabase

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish initializing

#### Set Up Database
1. In Supabase dashboard, go to **SQL Editor**
2. Copy the entire contents of `database/schema.sql`
3. Paste and run it in the SQL Editor
4. This creates all necessary tables, indexes, and security policies

#### Get API Credentials
1. Go to **Settings** > **API**
2. Copy your **Project URL** (e.g., `https://xxxxx.supabase.co`)
3. Copy your **anon/public key**

#### Configure App
1. Open `app.json`
2. Update the `extra` section with your Supabase credentials:
```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "https://your-project-id.supabase.co",
      "supabaseAnonKey": "your-anon-key-here"
    }
  }
}
```

#### Configure Email Authentication
1. In Supabase dashboard, go to **Authentication** > **URL Configuration**
2. Add redirect URL: `plainly://auth/callback`
3. (Optional) Customize email templates in **Authentication** > **Email Templates**

### 3. Run the App

```bash
# Start development server
npm start

# Then press:
# - i for iOS simulator
# - a for Android emulator
# - w for web browser
```

## Testing the App

### 1. Test Authentication
- Enter your email on the auth screen
- Check your email for the magic link
- Click the link to sign in (on web) or use deep linking (on mobile)

### 2. Complete Onboarding
- Select your country
- Choose your career field
- Select your interests
- Set your risk tolerance

### 3. Create Your First Event (Admin)
- Tap "Admin" in the header
- Fill in all required fields:
  - Title
  - Date
  - Category
  - What happened
  - Why people care
  - What this means (base text)
  - Optional: What likely does not change
- Set expiration (default: 7 days)
- Tap "Create Event"
- You'll be redirected to the event screen

### 4. View Event
- The event will appear on the main Event screen
- Content will be personalized based on your profile
- Pull down to refresh and check for new events

## Troubleshooting

### "Supabase URL and Anon Key must be set"
- Make sure you've updated `app.json` with your credentials
- Restart the Expo development server after updating `app.json`

### "Error fetching user profile"
- Check that the database schema was run successfully
- Verify RLS policies are enabled in Supabase dashboard

### Magic link not working
- Check that the redirect URL is configured in Supabase
- For mobile, you may need to configure deep linking in `app.json`
- For testing, use the web version first

### Events not showing
- Verify an event exists in the database
- Check that the event hasn't expired (`expires_at > NOW()`)
- Ensure the user hasn't already read the event

### Android SDK Path Error
If you see "Failed to resolve the Android SDK path" or "spawn adb ENOENT":

1. **Install Android Studio** (if not already installed):
   - Download from [developer.android.com/studio](https://developer.android.com/studio)
   - Install and open Android Studio
   - Go through the setup wizard to install Android SDK

2. **Set ANDROID_HOME environment variable**:
   
   For **zsh** (default on macOS):
   ```bash
   # Add to ~/.zshrc
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   ```
   
   Then reload your shell:
   ```bash
   source ~/.zshrc
   ```

3. **Verify installation**:
   ```bash
   echo $ANDROID_HOME
   adb version
   ```

4. **If SDK is in a different location**:
   - Open Android Studio → Preferences → Appearance & Behavior → System Settings → Android SDK
   - Note the "Android SDK Location" path
   - Use that path instead of `$HOME/Library/Android/sdk` in the export commands above

5. **Restart your terminal and Expo development server** after setting up ANDROID_HOME

## Database Management

### View Data in Supabase
- Go to **Table Editor** in Supabase dashboard
- You can manually view/edit:
  - `user_profiles` - User data
  - `events` - Events
  - `user_event_reads` - Read tracking

### Manual Event Creation (SQL)
```sql
INSERT INTO events (
  title, date, category, what_happened, 
  why_people_care, what_this_means, expires_at
) VALUES (
  'Sample Event',
  '2024-01-22',
  'politics',
  'This is what happened.',
  'This is why people care.',
  'This is what it might mean.',
  NOW() + INTERVAL '7 days'
);
```

## Next Steps

- Customize the UI colors and typography
- Add more event categories if needed
- Implement "save for later" feature
- Add event archive
- Set up push notifications (optional)

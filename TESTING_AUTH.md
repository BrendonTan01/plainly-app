# Testing Email Login on iOS Simulator & Expo Go

## ✅ Code Changes Applied

I've updated your app with deep linking support:
- ✅ Enabled `detectSessionInUrl` in `config/supabase.ts`
- ✅ Added deep linking handling in `App.tsx`

## 🚀 Quick Testing Methods

### Method 1: Manual Deep Link (iOS Simulator) - Recommended

1. **Request magic link** in your app
2. **Check your email** for the magic link
3. **Copy the full URL** from the email
4. **Open Terminal** and run:
   ```bash
   xcrun simctl openurl booted "plainly://auth/callback#access_token=YOUR_TOKEN&refresh_token=YOUR_TOKEN&..."
   ```
   Replace with your actual magic link URL (the part after `plainly://`)

### Method 2: Use Web Version (Easiest)

```bash
npm run web
```

Then:
- Request magic link
- Click the link in your email
- It redirects automatically ✅

### Method 3: Extract Token Manually

1. Open the magic link in a browser
2. Copy `access_token` and `refresh_token` from the URL hash
3. Temporarily add this to test:
   ```typescript
   import { supabase } from './config/supabase';
   
   await supabase.auth.setSession({
     access_token: 'paste_here',
     refresh_token: 'paste_here',
   });
   ```

## ⚙️ Supabase Configuration Required

Make sure these redirect URLs are configured in **Supabase Dashboard** → **Authentication** → **URL Configuration**:

- ✅ `plainly://auth/callback` (for custom scheme)
- ✅ `exp://localhost:8081/--/auth/callback` (for Expo Go)
- ✅ `exp://YOUR_IP:8081/--/auth/callback` (replace YOUR_IP with your local IP)

To find your local IP:
```bash
# macOS/Linux
ipconfig getifaddr en0
# or
ifconfig | grep "inet "
```

## 📱 Testing Flow

1. **Start Expo:**
   ```bash
   npm start
   ```

2. **Open in iOS Simulator:**
   - Press `i` in the Expo terminal

3. **Request Magic Link:**
   - Enter your email in the app
   - Check your email

4. **Handle the Link:**
   - **Option A:** Use the Terminal command above
   - **Option B:** Open link in Safari on simulator, then tap "Open in Plainly"
   - **Option C:** Test on web first to verify it works

## 🔍 Troubleshooting

### Deep Link Not Opening App

1. **Verify URL scheme:**
   - Check `app.json` has `"scheme": "plainly"`
   - Restart Expo after changing `app.json`

2. **Test URL scheme manually:**
   ```bash
   xcrun simctl openurl booted "plainly://auth/callback"
   ```
   This should open your app (even if it shows an error, it means deep linking works)

3. **Check Supabase redirect URLs:**
   - Must include `plainly://auth/callback`
   - For Expo Go, add `exp://localhost:8081/--/auth/callback`

### Session Not Persisting

- ✅ Already enabled: `persistSession: true` in Supabase config
- Check console logs for any errors

### Email Not Received

- Check spam folder
- Verify email provider isn't blocking Supabase
- Check Supabase dashboard → Authentication → Email Templates

## 💡 Recommended Testing Order

1. **Test on Web first** (`npm run web`) - Easiest, verifies backend works
2. **Test on iOS Simulator** - Use manual deep link method
3. **Test on Physical Device** - Use Expo Go or development build

## 🎯 Quick Test Command

For iOS Simulator, you can create a simple script:

```bash
# Save this as test-auth.sh
#!/bin/bash
echo "Paste your magic link URL:"
read url
xcrun simctl openurl booted "$url"
```

Then run: `chmod +x test-auth.sh && ./test-auth.sh`

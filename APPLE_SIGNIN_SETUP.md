# Apple Sign In Setup Guide

This guide will help you configure Apple Sign In once your Apple Developer account is approved.

## Prerequisites
- ✅ Apple Developer Program membership ($99/year)
- ✅ Access to Apple Developer Console
- ✅ Supabase project with authentication enabled

## Setup Steps

### 1. Configure Apple Developer Console

1. Go to [Apple Developer Console](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click on **Identifiers** → Select your App ID (`com.nathan.barcrawl`)
4. Enable **Sign in with Apple** capability
5. Click **Edit** next to "Sign in with Apple"
6. Configure settings:
   - Enable as a primary App ID
   - Click **Save**

### 2. Create a Services ID (for Web/Supabase)

1. In **Identifiers**, click the **+** button
2. Select **Services IDs** → Continue
3. Fill in:
   - **Description**: BarCrawl Sign In
   - **Identifier**: `com.nathan.barcrawl.signin` (must be unique)
4. Click **Continue** → **Register**
5. Select the newly created Services ID
6. Enable **Sign in with Apple**
7. Click **Configure**:
   - **Primary App ID**: Select `com.nathan.barcrawl`
   - **Domains and Subdomains**: Add your Supabase project URL
     - Example: `yourproject.supabase.co`
   - **Return URLs**: Add your Supabase callback URL
     - Format: `https://yourproject.supabase.co/auth/v1/callback`
8. Click **Save** → **Continue** → **Register**

### 3. Create a Private Key

1. Go to **Keys** in the Apple Developer Console
2. Click the **+** button
3. Fill in:
   - **Key Name**: BarCrawl Sign In Key
   - Enable **Sign in with Apple**
4. Click **Configure** → Select your Primary App ID
5. Click **Save** → **Continue** → **Register**
6. **Download the key file** (.p8 file) - you can only download this once!
7. Note down:
   - **Key ID** (10 characters)
   - **Team ID** (in top-right of developer console)

### 4. Configure Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication** → **Providers**
3. Find **Apple** and click **Enable**
4. Fill in the configuration:
   - **Services ID**: `com.nathan.barcrawl.signin`
   - **Team ID**: (from step 3)
   - **Key ID**: (from step 3)
   - **Private Key**: Paste the contents of the .p8 file
5. Click **Save**

### 5. Rebuild Your App

After configuring everything:

```bash
# Clean build
npx expo prebuild --clean

# Rebuild for iOS
npx expo run:ios
```

### 6. Enable Sign In with Apple in Xcode

1. Open your project in Xcode:
   ```bash
   open ios/barcrawl.xcworkspace
   ```
2. Select your app target
3. Go to **Signing & Capabilities**
4. Click **+ Capability**
5. Add **Sign in with Apple**
6. Save and rebuild

## Testing

### On Simulator (Limited)
- Apple Sign In has limited functionality in the simulator
- You might see a mock sign-in flow
- For full testing, use a physical device

### On Physical Device
1. Make sure you're signed in to iCloud on the device
2. Launch the app
3. Tap "Continue with Apple"
4. Follow the Apple authentication flow
5. You should be signed in and redirected to the app

## Troubleshooting

### "Sign in with Apple is not available"
- Make sure you're testing on iOS (not Android)
- Ensure the device/simulator has an iCloud account signed in
- Check that capabilities are properly configured in Xcode

### "Invalid client"
- Verify your Services ID is correctly configured
- Check that the bundle identifier matches exactly
- Ensure the Supabase redirect URL is correct

### "Request failed"
- Check your Supabase configuration
- Verify the private key was pasted correctly
- Ensure Team ID and Key ID match

### First-time sign in only provides email
- Apple only provides full name and email on the FIRST sign-in
- If testing, you may need to revoke app access in Settings → Apple ID → Password & Security → Apps Using Your Apple ID

## Code Files Created

- ✅ `/src/lib/appleAuth.ts` - Apple authentication logic
- ✅ `/app/welcome.tsx` - Updated with Apple Sign In button
- ✅ `/app.json` - Added `expo-apple-authentication` plugin

## What Happens When User Signs In

1. User taps "Continue with Apple"
2. Native Apple Sign In sheet appears
3. User authenticates with Face ID/Touch ID/Passcode
4. App receives:
   - Identity token
   - User ID
   - Email (first time only)
   - Full name (first time only)
5. Token is sent to Supabase
6. Supabase creates/updates user account
7. User is redirected to the app

## Notes

- Apple Sign In is **only available on iOS** - it won't show on Android
- The button only appears when `isAppleAuthAvailable()` returns true
- Apple requires all apps with third-party sign-in to also offer Apple Sign In
- Users can choose to hide their email - Apple will provide a private relay email

## Next Steps

Once your developer account is approved:
1. Follow steps 1-6 above
2. Test on a physical iOS device
3. Submit to App Store (Apple Sign In is required if you have Google Sign In)
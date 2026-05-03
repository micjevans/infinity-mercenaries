# Google Drive Integration Setup

This guide explains how to set up Google OAuth 2.0 for the Infinity Mercenaries app to enable user-owned data persistence on Google Drive.

## Architecture

The app uses a **serverless, user-owned data model**:

- Users sign in with their Google account
- The app gets read/write access to a JSON file on their Drive
- All data is stored and synced to the user's Google Drive
- No backend server needed—users control their own data

## Setup Steps

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top and select "NEW PROJECT"
3. Enter project name: `Infinity Mercenaries` (or your preferred name)
4. Click "CREATE"
5. Wait for the project to be created

### 2. Enable Google Drive API

1. In the Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Google Drive API"
3. Click on it and click **ENABLE**

### 3. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth 2.0 Client IDs**
3. If prompted to create a consent screen first:
   - Click **CREATE CONSENT SCREEN**
   - Select **External** for User Type
   - Fill in the required fields:
     - App name: `Infinity Mercenaries`
     - User support email: (your email)
     - Developer contact: (your email)
   - Click **SAVE AND CONTINUE** through all sections
   - On the final screen, click **BACK TO DASHBOARD**

4. Now create the Client ID:
   - Click **+ CREATE CREDENTIALS** → **OAuth 2.0 Client IDs**
   - Application type: **Web application**
   - Name: `Infinity Mercenaries Web Client`
   - Under "Authorized redirect URIs", add:
     - `http://localhost:3000`
     - `http://localhost:3000/`
     - `https://yourdomain.com` (replace with your actual domain)
   - Click **CREATE**
   - Copy the **Client ID** (you'll need this)

### 4. Configure the App

1. Create a `.env.local` file in the project root:

   ```
   PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
   ```

2. Replace `your_client_id_here` with the Client ID you copied in step 3

3. Restart the dev server:
   ```bash
   npm run dev
   ```

### 5. Test the Integration

1. Navigate to http://localhost:3000
2. You should see a "Sign In with Google" button in the top-right of the nav bar
3. Click it and authorize the app
4. Go to http://localhost:3000/test-drive to test reading/writing data
5. Check your Google Drive for the `infinity-data.json` file

## Security Considerations

- **Scopes**: The app requests `https://www.googleapis.com/auth/drive.file` — this gives access only to files the app creates, not your entire Drive
- **Tokens**: Access tokens are handled by the Google Sign-In library and are not stored; sessions use the browser's credential system
- **File Ownership**: The `infinity-data.json` file is owned by the app and can only be accessed by users who have authorized it

## Troubleshooting

### "Google OAuth not configured. Set GOOGLE_CLIENT_ID environment variable."

- Make sure you created the `.env.local` file with your Client ID
- Restart the dev server after creating the file

### "Failed to initialize authentication"

- Check that the Client ID is correct and not expired
- Make sure you enabled the Google Drive API in Cloud Console

### "Sign in" button doesn't appear

- Open browser DevTools (F12) and check for errors in the console
- Make sure the `https://apis.google.com/js/platform.js` script loaded (check Network tab)

### "Permission denied" when saving data

- Make sure you authorized the app when prompted
- Try signing out and signing back in

## Development vs Production

### Development (localhost)

- Set `PUBLIC_GOOGLE_CLIENT_ID` in `.env.local`
- Access at `http://localhost:3000`

### Production

- Create a new OAuth credential with your production domain
- Set `PUBLIC_GOOGLE_CLIENT_ID` in your deployment environment variables
- Update authorized redirect URIs in Google Cloud Console with your production domain

## Architecture Notes

The Google Drive integration is abstracted in `src/lib/google-drive-adapter.ts`:

- `initializeGoogleAPI()` — Initialize the gapi client
- `signInWithGoogle()` — Sign user in
- `getOrCreateDataFile()` — Create or find the data file
- `readDataFromDrive()` — Read JSON from Drive
- `writeDataToDrive()` — Write JSON to Drive
- `getCachedFileId()` / `cacheFileId()` — Cache file ID in localStorage

The `GoogleAuthButton` component handles UI state and calls these functions.

## Next Steps

Once this is working, we can:

1. Migrate existing localStorage data to Drive
2. Create a sync layer that keeps local and Drive data in sync
3. Add offline support with local-first sync
4. Extend the adapter to store companies, events, and troopers

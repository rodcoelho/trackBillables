# Supabase Setup Instructions

## 1. Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in your project details:
   - Name: trackbillables (or your preferred name)
   - Database Password: Create a strong password (save this!)
   - Region: Choose the region closest to your users
4. Click "Create new project" and wait for it to initialize (1-2 minutes)

## 2. Set Up the Database

1. In your Supabase dashboard, click on the "SQL Editor" in the left sidebar
2. Click "New query"
3. Copy the entire contents of `supabase/schema.sql` from this project
4. Paste it into the SQL editor
5. Click "Run" to execute the SQL commands
6. You should see a success message confirming the table was created

## 3. Enable Google OAuth (for Google Sign-In)

1. In your Supabase dashboard, go to "Authentication" > "Providers"
2. Find "Google" in the list and click to expand it
3. Toggle "Enable Google provider" to ON

### Get Google OAuth Credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. If prompted, configure the OAuth consent screen first:
   - User Type: External
   - App name: TrackBillables
   - User support email: your email
   - Developer contact: your email
   - Save and continue through the remaining screens
6. Back to creating OAuth client ID:
   - Application type: Web application
   - Name: TrackBillables
   - Authorized JavaScript origins: (leave empty for now)
   - Authorized redirect URIs: Add the callback URL from Supabase
     - It will look like: `https://your-project-ref.supabase.co/auth/v1/callback`
     - You can find this exact URL in the Supabase Google provider settings
7. Click "Create"
8. Copy the "Client ID" and "Client Secret"
9. Go back to Supabase and paste these values into the Google provider settings
10. Click "Save"

### Alternative: Email/Password Authentication

Email/password authentication is enabled by default in Supabase. If you prefer to use only email/password (without Google OAuth), you can skip the Google setup above. Users will be able to sign up with email and password.

## 4. Enable Realtime

1. In your Supabase dashboard, go to "Database" > "Replication"
2. Find the "billables" table in the list
3. Toggle the switch to enable replication for this table
4. This allows real-time updates when billables are added/edited

## 5. Get Your Supabase Credentials

1. In your Supabase dashboard, click on "Settings" (gear icon) in the left sidebar
2. Click "API" in the settings menu
3. You'll see two important values:
   - **Project URL**: This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key**: This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copy these values - you'll need them for your `.env.local` file

## 6. Configure Your Local Environment

1. In your project root, create a `.env.local` file
2. Add your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the values with your actual Supabase credentials from step 5.

## 7. Security Notes

- The anon key is safe to use in client-side code because Row Level Security (RLS) policies protect your data
- RLS ensures users can only access their own billables
- Never commit your `.env.local` file to version control
- For production deployments, use environment variables in your hosting platform (Vercel, etc.)

## Verification

To verify everything is set up correctly:

1. Run your Next.js app locally: `npm run dev`
2. Try signing in with Google (or email/password)
3. Try adding a billable entry
4. Check the Supabase dashboard > "Table Editor" > "billables" to see your data

If you encounter any issues, check the browser console for errors and verify your environment variables are correct.

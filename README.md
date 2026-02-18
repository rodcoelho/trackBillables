# TrackBillables

A modern, full-stack web application for tracking billable hours and managing client projects. Built with Next.js, React, and Supabase.

## Features

- **Google OAuth Authentication**: Quick login with Gmail (email/password supported as fallback)
- **Real-time Updates**: Automatic synchronization across multiple tabs/devices using Supabase Realtime
- **Billable Management**: Add, edit, and delete billable entries with ease
- **Reverse Chronological View**: See your most recent entries first
- **Inline Editing**: Click to edit any entry directly in the list
- **Mobile Responsive**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark Mode Support**: Automatically adapts to your system preferences
- **AI Time Estimates**: Estimate billable hours from email chains, documents, or LLM chat histories (Pro)
- **Secure**: Row-level security (RLS) ensures users only access their own data

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL database, Authentication, Realtime)
- **Deployment**: Vercel (frontend) + Supabase Cloud (backend)

## Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier available at [supabase.com](https://supabase.com))
- A Google Cloud account (for Google OAuth - optional but recommended)

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd trackBillables
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

Follow the detailed instructions in [`supabase/setup-instructions.md`](supabase/setup-instructions.md) to:

1. Create a new Supabase project
2. Run the database schema (from `supabase/schema.sql`)
3. Enable Google OAuth (optional)
4. Enable Realtime for the billables table
5. Get your Supabase credentials

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace these values with your actual Supabase project URL and anon key (found in your Supabase project settings under API).

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You should be redirected to the login page.

### 6. Create an Account and Start Tracking

1. Click "Continue with Google" for quick signup (or use email/password)
2. After authentication, you'll be redirected to the dashboard
3. Add your first billable entry using the form at the top
4. Your entries will appear below in reverse chronological order
5. Click "Edit" on any entry to modify it inline
6. Click "Delete" to remove an entry (with confirmation)

## Project Structure

```
trackBillables/
├── app/
│   ├── dashboard/         # Main dashboard page
│   ├── login/             # Login page with Google OAuth
│   ├── auth/callback/     # OAuth callback handler
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Root page (redirects to login or dashboard)
│   └── globals.css        # Global styles
├── components/
│   ├── AddBillableForm.tsx    # Form to add new billable entries
│   ├── BillablesList.tsx      # List component with real-time updates
│   ├── BillableItem.tsx       # Individual billable item with inline editing
│   └── SignOutButton.tsx      # Sign out button
├── lib/
│   └── supabase/
│       ├── client.ts      # Browser-side Supabase client
│       ├── server.ts      # Server-side Supabase client
│       └── middleware.ts  # Supabase middleware for session management
├── supabase/
│   ├── schema.sql         # Database schema and RLS policies
│   └── setup-instructions.md  # Detailed Supabase setup guide
├── types/
│   └── database.types.ts  # TypeScript types for database tables
├── middleware.ts          # Next.js middleware for auth
├── .env.example           # Environment variable template
└── package.json
```

## Database Schema

The application uses a single `billables` table:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (auto-generated) |
| user_id | UUID | Foreign key to auth.users |
| date | DATE | Date of the billable work |
| client_project | TEXT | Client or project name |
| time_amount | DECIMAL | Hours worked (e.g., 1.5) |
| description | TEXT | Optional detailed notes |
| created_at | TIMESTAMP | Auto-generated creation time |
| updated_at | TIMESTAMP | Auto-updated modification time |

Row Level Security (RLS) policies ensure users can only access their own billables.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "New Project" and import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click "Deploy"

### Update OAuth Redirect URLs

After deployment, update your Google OAuth configuration:

1. Go to Google Cloud Console > Credentials
2. Edit your OAuth client
3. Add your Vercel domain to "Authorized redirect URIs":
   - `https://your-project-ref.supabase.co/auth/v1/callback`
4. Update Supabase Auth settings with your production URL if needed

## Development Notes

### Real-time Subscriptions

The app uses Supabase Realtime to automatically update the billables list when:
- A new entry is added (from any tab/device)
- An entry is edited
- An entry is deleted

This provides a seamless multi-tab experience without manual refreshing.

### Security Considerations

- Environment variables are kept in `.env.local` (never committed)
- The Supabase anon key is safe to use client-side due to RLS policies
- All database operations are protected by row-level security
- User authentication is handled entirely by Supabase Auth
- Passwords are hashed and never exposed to the application

### Input Validation

- Date: Must be a valid date in YYYY-MM-DD format
- Time Amount: Must be a positive decimal number (min 0.25)
- Client/Project: Required text field
- Description: Optional text field

## Troubleshooting

### "Invalid API key" error
- Check that your `.env.local` file exists and has the correct values
- Restart the development server after changing environment variables

### Google OAuth not working
- Verify you've added the correct redirect URL in Google Cloud Console
- Check that Google provider is enabled in Supabase Auth settings
- Make sure you copied the Client ID and Secret correctly

### Billables not appearing
- Check the browser console for errors
- Verify you're signed in (check Supabase dashboard > Authentication > Users)
- Ensure the database schema was created correctly (check Supabase Table Editor)
- Confirm RLS policies are enabled (check Supabase > Authentication > Policies)

### Real-time updates not working
- Verify Realtime is enabled for the billables table (Supabase > Database > Replication)
- Check browser console for WebSocket connection errors
- Make sure you're using the correct Supabase project URL

## License

This project is open source and available under the MIT License.

## Support

For issues or questions:
1. Check the [Supabase documentation](https://supabase.com/docs)
2. Review the [Next.js documentation](https://nextjs.org/docs)
3. Create an issue in this repository

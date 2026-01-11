# Quick Start Guide

Get TrackBillables up and running in 10 minutes!

## Prerequisites
- Node.js 18+ installed
- A free Supabase account

## Step-by-Step Setup

### 1. Install Dependencies (1 minute)
```bash
npm install
```

### 2. Create Supabase Project (2 minutes)

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Name it "trackbillables" and create a password
4. Wait for initialization (~1 minute)

### 3. Set Up Database (2 minutes)

1. In Supabase dashboard, click "SQL Editor" in the sidebar
2. Click "New query"
3. Copy ALL contents from `supabase/schema.sql` in this project
4. Paste into SQL editor and click "Run"
5. You should see a success message

### 4. Enable Realtime (30 seconds)

1. In Supabase, go to "Database" > "Replication"
2. Find "billables" table and toggle it ON

### 5. Configure Environment (1 minute)

1. In Supabase, click "Settings" > "API"
2. Copy your "Project URL" and "anon public" key
3. Create `.env.local` file in project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 6. Run the App (30 seconds)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 7. Create Account & Start Tracking!

You can now:
- Sign up with email/password (no Google OAuth setup needed initially)
- Start adding billable entries
- See them update in real-time

## Optional: Enable Google Sign-In

For Google OAuth, follow the detailed guide in `supabase/setup-instructions.md`.

## Need Help?

- Full documentation: See `README.md`
- Supabase setup: See `supabase/setup-instructions.md`
- Issues? Check the Troubleshooting section in README.md

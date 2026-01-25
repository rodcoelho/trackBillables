# Email Estimate Feature

## Overview

The Email Estimate feature uses AI (Claude Haiku) to analyze email chains and automatically estimate billable hours for attorneys. This feature is **Pro-only** and helps attorneys quickly create billable entries from email correspondence.

## How It Works

1. **Pro users** see a purple "Email Estimate" button in the dashboard header
2. Clicking opens a modal where users can:
   - Enter their attorney email address (saved for future use)
   - Paste an entire email chain
3. AI analyzes the email chain to estimate:
   - Total billable hours (in 0.1-hour increments)
   - Detailed description of work performed
4. The estimate auto-populates the "Add Billable Entry" form
5. Users review, edit if needed, fill in Client/Matter, and save

## Required Environment Variable

### `ANTHROPIC_API_KEY`

This is required for the email estimate feature to work. Get your API key from:
https://console.anthropic.com/

**Add to Vercel:**
1. Go to Vercel → Project Settings → Environment Variables
2. Add: `ANTHROPIC_API_KEY` = `sk-ant-api03-...`
3. Select: Production, Preview, Development
4. Save and redeploy

**Cost:** Claude Haiku is very cheap (~$0.25 per million input tokens). A typical email chain costs less than $0.01 to process.

## Database Migration

Run the migration to add the `attorney_email` field:

```sql
-- supabase/migrations/20260119_add_attorney_email.sql
ALTER TABLE subscriptions
ADD COLUMN attorney_email TEXT;
```

Or apply via Supabase dashboard:
1. Go to SQL Editor
2. Paste the migration SQL
3. Run query

## Technical Details

### API Route
`/app/api/email-estimate/route.ts`

- Verifies user is authenticated
- Checks if user is Pro (tier='pro', status='active' or 'trialing')
- Calls Claude Haiku API with structured prompt
- Parses JSON response with `billable_hours` and `description`
- Saves `attorney_email` to database
- Returns estimate to frontend

### Prompt
The AI is given a detailed prompt that:
- Considers reading, reviewing, researching, and drafting time
- Only counts attorney work (emails FROM the attorney email)
- Rounds to 0.1-hour increments
- Excludes non-billable administrative tasks
- Returns strict JSON format

### Model
Uses **Claude 3 Haiku** (`claude-3-haiku-20240307`) - the fastest and most cost-effective model for this task.

## User Flow

1. User clicks "Email Estimate" button (Pro only)
2. Modal opens with:
   - Attorney email input (pre-filled if saved)
   - Large textarea for email chain
   - "Generate Billable Estimate" button
3. User pastes email thread and clicks generate
4. API calls Claude Haiku
5. Response validated and returned
6. Modal closes
7. Main form auto-populates with:
   - Hours: from AI
   - Description: from AI
   - Date: today (default)
   - Client: blank (user fills)
   - Matter: blank (user fills)
8. User reviews, edits if needed, fills Client/Matter, and saves

## Error Handling

- If API fails: Shows error, user can retry or enter manually
- If response is invalid JSON: Shows error, falls back to manual
- If user is not Pro: Returns 403 with upgrade message
- If user is not authenticated: Returns 401

## Security

- Attorney email is stored in user's subscription record (not shared)
- Email chains are sent to Anthropic API (see their privacy policy)
- No email data is stored in our database
- Only Pro users can access this feature

## Future Enhancements

- Support for attachments (extract text from PDFs/docs)
- Batch processing multiple email chains
- Historical tracking of estimates vs actual time
- Custom prompts per user/firm
- Integration with email clients (Gmail plugin, etc.)

## Testing

To test locally:
1. Set `ANTHROPIC_API_KEY` in `.env.local`
2. Upgrade a test user to Pro
3. Click "Email Estimate" button
4. Paste sample email chain
5. Verify estimate populates form correctly

Sample test email chain:
```
From: client@example.com
To: attorney@lawfirm.com
Subject: Contract Question
Date: Jan 19, 2026

Hi Attorney,

Can you review this contract and let me know if there are any issues?

Thanks,
Client

---

From: attorney@lawfirm.com
To: client@example.com
Subject: Re: Contract Question
Date: Jan 19, 2026

I've reviewed the contract. There are a few clauses we should discuss. I'll prepare a memo.

Best,
Attorney
```

Expected output: ~0.3-0.5 hours with description like "Reviewed client email and contract (0.2 hours); drafted response and prepared memo outline (0.3 hours)"

---

Last updated: January 19, 2026

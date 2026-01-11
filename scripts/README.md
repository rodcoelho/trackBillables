# Database Seeding Script

This SQL script seeds the database with 300 sample billable entries for testing the infinite scroll functionality.

## What it does:

- Creates 300 entries for a specified user ID
- One entry for each of the last 300 days
- Random hours between 1 and 8 for each entry
- Client/Project: "Dept of Commerce v. Bob {date}" (e.g., "Dept of Commerce v. Bob 12/06/2025")
- Description: Random 50-character string

## How to run:

### 1. Get Your User ID

While signed into the app, open browser console (F12) and run:
```javascript
JSON.parse(localStorage.getItem("sb-abhplcdqblijxfvcbfgj-auth-token")).user.id
```

Or find it in Supabase Dashboard > Authentication > Users > click your user > copy the ID

### 2. Update the Script

Open `scripts/seed-data.sql` and replace this line:
```sql
v_user_id UUID := '31e4d90f-04d6-4685-8832-dbe67ffad444';
```

With your actual user ID.

### 3. Run in Supabase

1. Go to https://app.supabase.com
2. Open your project
3. Click **SQL Editor** in the sidebar
4. Click **New query**
5. Copy the entire contents of `scripts/seed-data.sql`
6. Paste into the editor
7. Click **Run**

## Expected output:

```
Inserted 50 entries...
Inserted 100 entries...
Inserted 150 entries...
Inserted 200 entries...
Inserted 250 entries...
Inserted 300 entries...
Successfully inserted 300 entries!
```

## Testing infinite scroll:

After seeding, refresh your dashboard and:
1. You should see 50 entries initially loaded
2. Scroll down to see the "Loading more..." indicator
3. The next 50 entries will load automatically
4. Continue scrolling to test the full 300 entries
5. At the bottom, you'll see "All entries loaded (300 total)"

## Notes:

- The SQL script runs as database admin, bypassing RLS
- Works regardless of authentication method (OAuth, email/password)
- Each run adds 300 NEW entries (doesn't delete existing ones)
- To clear entries: `DELETE FROM billables WHERE user_id = 'your-user-id';`

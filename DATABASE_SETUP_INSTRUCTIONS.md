# Database Setup Instructions

## Issue
The `coaches` table doesn't exist in your Supabase database. You need to create all tables first.

## Solution

### Option 1: Run Full seed.sql (Recommended)

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open the file `supabase/seed.sql` from your project
3. Copy the **entire contents** of the file
4. Paste into Supabase SQL Editor
5. Click **"Run"**

This will:
- Create all tables (coaches, members, classes, bookings, etc.)
- Add all columns including `whatsapp_auto_reply_enabled`
- Insert seed data

### Option 2: Run Setup Script Only

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy the contents of `supabase/setup_database.sql`
3. Paste and click **"Run"**

This creates all tables without seed data.

## Verify Tables Were Created

After running the script, verify with:

```sql
-- Check if coaches table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'coaches';

-- Check whatsapp_auto_reply_enabled column
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'coaches' 
  AND column_name = 'whatsapp_auto_reply_enabled';
```

## Expected Result

You should see:
- ✅ `coaches` table exists
- ✅ `whatsapp_auto_reply_enabled` column exists (boolean, default: true)

## Next Steps

After tables are created:
1. The WhatsApp control panel will work
2. Coaches can toggle auto-reply on/off
3. The webhook will check the auto-reply setting before sending messages



# Verify WhatsApp Column in Supabase Database

## Quick Check

Run this SQL query in your Supabase SQL Editor to verify the column exists:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'coaches' 
  AND column_name = 'whatsapp_auto_reply_enabled';
```

**Expected Result:**
- `column_name`: `whatsapp_auto_reply_enabled`
- `data_type`: `boolean`
- `column_default`: `true`

## If Column Doesn't Exist

If the query returns no rows, the column doesn't exist. Add it by running:

```sql
ALTER TABLE coaches 
  ADD COLUMN IF NOT EXISTS whatsapp_auto_reply_enabled boolean DEFAULT true;
```

## Verify Current Values

Check all coaches and their WhatsApp auto-reply settings:

```sql
SELECT 
    id, 
    name, 
    whatsapp_auto_reply_enabled,
    mobile_number
FROM coaches;
```

All coaches should have `whatsapp_auto_reply_enabled = true` by default.

## Full Schema Check

To see all columns in the coaches table:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'coaches'
ORDER BY ordinal_position;
```

## Running the Migration

If you haven't run the migration yet:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy the contents of `supabase/seed.sql`
3. Paste and click **"Run"**
4. The `ALTER TABLE` statement (line 132) will add the column if it doesn't exist

The migration is **idempotent** (safe to run multiple times) - it uses `ADD COLUMN IF NOT EXISTS`.


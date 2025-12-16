# Backup System Setup Instructions

## ✅ Pre-Check: Is the backups table created?

Before creating your first backup, you need to verify the `backups` table exists in your Supabase database.

### Quick Check

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run this query:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'backups';
```

**Expected Result:**
- If you see `backups` in the results → ✅ Table exists, you're ready!
- If you see no results → ❌ Table doesn't exist, continue to setup below

---

## 🔧 Setup: Create the backups table

If the table doesn't exist, follow these steps:

### Step 1: Open SQL Editor
1. Go to **Supabase Dashboard**
2. Click **SQL Editor** in the left sidebar
3. Click **"New query"**

### Step 2: Run the Backup Table Creation Script
1. Open the file `supabase/add_backup_system.sql` from this project
2. Copy the **entire contents** of the file
3. Paste it into the Supabase SQL Editor
4. Click **"Run"** (or press Ctrl+Enter / Cmd+Enter)

### Step 3: Verify Table Was Created
Run this query again to confirm:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'backups';
```

You should now see `backups` in the results.

---

## ✅ Ready to Create Backups!

Once the table is created, you can:

1. **Login** to the system: https://mcgann-boxing-2coodfhbmq-nw.a.run.app
2. Go to **Admin Dashboard** → **Backups** tab
3. Click **"Create Backup"**
4. Enter a backup name (e.g., "Initial System Backup")
5. Optionally add a description
6. Click **"Create Backup"**

---

## 📋 What Gets Backed Up?

The backup includes:
- ✅ All coaches
- ✅ All members
- ✅ All family members
- ✅ All classes
- ✅ All bookings
- ✅ All transactions
- ✅ All coach slots & appointments
- ✅ All guest bookings
- ✅ All coach availability settings
- ✅ All notifications

---

## ⚠️ Important Notes

- **Safe to run multiple times:** The SQL script uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run even if the table already exists
- **No data loss:** Creating the table won't affect any existing data
- **First backup recommended:** Create a backup before making any major changes to the system

---

## 🆘 Troubleshooting

**If backup creation fails:**
1. Check that you're logged in as an admin (Sean)
2. Verify the `backups` table exists (use the check query above)
3. Check the browser console for error messages
4. Try refreshing the page and creating the backup again

**If you see "Table already exists" error:**
- This is normal! The table already exists, so you can skip the setup step



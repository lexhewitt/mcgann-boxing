# Supabase Connection Error Fix

## Problem
Getting `ERR_NAME_NOT_RESOLVED` when trying to connect to Supabase. This means the Supabase project URL cannot be resolved.

## Common Causes

1. **Supabase Project is Paused** (Most Common)
   - Free tier projects pause after 1 week of inactivity
   - The project needs to be reactivated

2. **Incorrect URL**
   - The project URL might have changed
   - Need to verify the correct URL

3. **Project Deleted**
   - The project may have been deleted

## How to Fix

### Step 1: Check Supabase Project Status

1. Go to https://app.supabase.com
2. Log in to your account
3. Check if your project `nthibubpasppgpozlqvw` is listed
4. If it shows "Paused" or is missing, you need to reactivate it

### Step 2: Reactivate Project (if paused)

1. Click on your project
2. If paused, click "Restore project" or "Resume"
3. Wait for the project to restart (may take a few minutes)

### Step 3: Verify Project URL

1. In Supabase Dashboard → **Settings** → **API**
2. Copy the **Project URL** - it should be:
   - `https://nthibubpasppgpozlqvw.supabase.co`
3. If the URL is different, update it in Cloud Run

### Step 4: Update Cloud Run (if URL changed)

If your Supabase URL has changed, update it:

```bash
gcloud run services update mcgann-boxing \
  --region=europe-west2 \
  --update-env-vars="VITE_SUPABASE_URL=https://YOUR_NEW_URL.supabase.co" \
  --quiet
```

### Step 5: Test Connection

After reactivating, test the connection:

```bash
curl -I https://nthibubpasppgpozlqvw.supabase.co/rest/v1/
```

Should return HTTP 200 or 401 (not ERR_NAME_NOT_RESOLVED)

## Alternative: Create New Supabase Project

If the project is deleted or can't be restored:

1. Create a new Supabase project
2. Get the new project URL and keys
3. Update Cloud Run environment variables
4. Run the database setup scripts in the new project

## Quick Check

Run this to see if the project is accessible:

```bash
curl -I https://nthibubpasppgpozlqvw.supabase.co/rest/v1/
```

If you get `ERR_NAME_NOT_RESOLVED`, the project is paused or deleted.



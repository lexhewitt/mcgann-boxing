# Deploy Stripe and Supabase Configuration

## Current Issue
The Cloud Run deployment is missing Stripe and Supabase environment variables, causing HTTP 500 errors.

## Required Environment Variables

### Stripe (Test/Sandbox Mode)
- `STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key (starts with `pk_test_...`)
- `STRIPE_SECRET_KEY` - Your Stripe secret key (starts with `sk_test_...`)

### Supabase
- `VITE_SUPABASE_URL` - Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon/public key

## Deployment Command

Run this command to add the missing environment variables:

```bash
gcloud run services update mcgann-boxing \
  --region=europe-west2 \
  --update-env-vars="STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE,STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE,VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co,VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE" \
  --quiet
```

## Getting Your Keys

### Stripe Keys (Test Mode)
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy the **Publishable key** (starts with `pk_test_`)
3. Click "Reveal test key" to see the **Secret key** (starts with `sk_test_`)

### Supabase Keys
1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → Use as `VITE_SUPABASE_URL`
   - **anon public** key (Legacy) → Use as `VITE_SUPABASE_ANON_KEY`

## Important Notes

- **Stripe Test Mode**: You're currently using test/sandbox keys. When ready to go live:
  1. Switch to live mode in Stripe Dashboard
  2. Get live keys (start with `pk_live_` and `sk_live_`)
  3. Update the environment variables
  4. Test thoroughly before going live

- **Persistence**: These environment variables will persist across deployments unless you explicitly remove them.

- **Security**: Never commit these keys to git. They're stored securely in Cloud Run.

## Verify After Deployment

1. Go to Admin Dashboard → System Status
2. Click "Refresh Status"
3. All services should show as "connected"



# Fleetwood Boxing Gym - Configuration Guide

This guide explains how to set up and run the Fleetwood Boxing Gym application locally and in production.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Supabase Configuration](#supabase-configuration)
- [Stripe Configuration](#stripe-configuration)
- [Running the Application](#running-the-application)
- [Deployment to Google Cloud Run](#deployment-to-google-cloud-run)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js** (v20 or higher recommended)
- **npm** (comes with Node.js)
- **Supabase Account** - [Sign up at supabase.com](https://supabase.com)
- **Stripe Account** - [Sign up at stripe.com](https://stripe.com)
- **Google Cloud Account** (for deployment)
- **Git** (for version control)

---

## Local Development Setup

### 1. Clone and Install

```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd mcgann-fleetwood-boxing-gym

# Install dependencies
npm install
```

### 2. Create Environment File

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local  # If .env.example exists
# OR create manually:
touch .env.local
```

### 3. Configure Environment Variables

Add the following to your `.env.local` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Stripe Configuration (for payment processing)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Optional: For local server
PORT=3000
```

**Note:** Never commit `.env.local` to git - it's already in `.gitignore`.

---

## Environment Variables

### Required Variables

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Supabase Dashboard → Settings → API |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Stripe Dashboard → Developers → API keys |
| `STRIPE_SECRET_KEY` | Stripe secret key | Stripe Dashboard → Developers → API keys |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port (local dev) | 8080 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) | Supabase Dashboard |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Stripe Dashboard → Webhooks |
| `FRONTEND_URL` | Frontend URL (for webhooks) | Auto-detected |

---

## Supabase Configuration

### 1. Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project (or create a new one)
3. Navigate to **Settings** → **API**
4. Copy the following:
   - **Project URL** → Use as `VITE_SUPABASE_URL`
   - **anon public** key (Legacy) → Use as `VITE_SUPABASE_ANON_KEY`
   - **service_role** key (Legacy) → Use as `SUPABASE_SERVICE_ROLE_KEY` (server-side only)

### 2. Enable Data API

**IMPORTANT:** The Data API must be enabled for the app to work!

1. In Supabase Dashboard → **Settings** → **API** → **Data API**
2. Toggle **"Enable Data API"** to **ON**
3. Ensure **"public"** schema is checked in "Exposed schemas"
4. Click **"Save"**

### 3. Set Up Row Level Security (RLS)

Run the RLS policies script in Supabase SQL Editor:

1. Go to **SQL Editor** in Supabase Dashboard
2. Open or create a new query
3. Copy and paste the contents of `supabase/rls-policies.sql`
4. Click **"Run"**

This will:
- Enable RLS on all tables
- Create policies allowing the `anon` role to perform operations

### 4. Initialize Database Schema

1. In Supabase Dashboard → **SQL Editor**
2. Copy and paste the contents of `supabase/seed.sql`
3. Click **"Run"**

This creates all necessary tables and seed data.

---

## Stripe Configuration

### 1. Get Your Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **API keys**
3. Copy:
   - **Publishable key** → Use as `STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → Use as `STRIPE_SECRET_KEY`

**Note:** Use test keys (`pk_test_...` and `sk_test_...`) for development.

### 2. Set Up Webhooks (Optional - for production)

1. In Stripe Dashboard → **Developers** → **Webhooks**
2. Add endpoint: `https://your-domain.com/api/webhook`
3. Select events: `checkout.session.completed`
4. Copy the webhook signing secret → Use as `STRIPE_WEBHOOK_SECRET`

---

## Running the Application

### Development Mode

```bash
# Start the development server
npm run dev

# The app will be available at:
# http://localhost:5173 (or the port shown in terminal)
```

### Production Build (Local)

```bash
# Build the application
npm run build

# Preview the production build
npm run preview

# OR run the production server
npm start
# App will be at http://localhost:8080
```

---

## Deployment to Google Cloud Run

### Prerequisites

1. Install [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
2. Authenticate: `gcloud auth login`
3. Set your project: `gcloud config set project YOUR_PROJECT_ID`

### Build and Deploy

```bash
# Build the Docker image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/mcgann-boxing:$(git rev-parse --short HEAD)

# Deploy to Cloud Run
gcloud run deploy mcgann-boxing \
  --image gcr.io/YOUR_PROJECT_ID/mcgann-boxing:$(git rev-parse --short HEAD) \
  --region=europe-west2 \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="STRIPE_PUBLISHABLE_KEY=pk_test_...,STRIPE_SECRET_KEY=sk_test_...,SUPABASE_URL=https://your-project.supabase.co,VITE_SUPABASE_URL=https://your-project.supabase.co,VITE_SUPABASE_ANON_KEY=your-anon-key" \
  --set-secrets SUPABASE_SERVICE_ROLE_KEY=supabase-service-role-key:1
```

### Set Up Secrets in Google Cloud

1. Create a secret for the service role key:
   ```bash
   echo -n "your-service-role-key" | gcloud secrets create supabase-service-role-key --data-file=-
   ```

2. Grant Cloud Run access:
   ```bash
   gcloud secrets add-iam-policy-binding supabase-service-role-key \
     --member="serviceAccount:YOUR_SERVICE_ACCOUNT" \
     --role="roles/secretmanager.secretAccessor"
   ```

### Environment Variables for Cloud Run

Set these in the Cloud Run service:

- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_URL` - Same as SUPABASE_URL (for client-side)
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Set as a secret (not env var)

---

## Troubleshooting

### "Failed to fetch" or DNS errors

- **Check Supabase URL**: Ensure the URL is correct (no typos)
- **Verify Data API is enabled**: Settings → API → Enable Data API must be ON
- **Check RLS policies**: Ensure policies are created and allow `anon` role

### "Supabase client not initialized"

- **Check environment variables**: Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- **For production**: Verify `/env.js` endpoint is serving the correct values
- **Check browser console**: Look for initialization errors

### Members not saving to database

- **Check RLS policies**: Run `supabase/rls-policies.sql` in Supabase SQL Editor
- **Verify Data API**: Must be enabled in Supabase settings
- **Check browser console**: Look for specific error messages
- **Verify anon key**: Use the **Legacy anon key** (JWT), not the publishable key

### Stripe payment issues

- **Use test keys**: Ensure you're using `pk_test_...` and `sk_test_...` for development
- **Check webhook URL**: Must match your deployment URL
- **Verify webhook secret**: If using webhooks, ensure secret is set correctly

### Build errors

- **Clear node_modules**: `rm -rf node_modules package-lock.json && npm install`
- **Check Node version**: Ensure you're using Node.js v20 or higher
- **Verify dependencies**: Run `npm install` to ensure all packages are installed

---

## Quick Reference

### Local Development Checklist

- [ ] Node.js installed
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` file created with all required variables
- [ ] Supabase project created and Data API enabled
- [ ] RLS policies applied (`supabase/rls-policies.sql`)
- [ ] Database schema initialized (`supabase/seed.sql`)
- [ ] Stripe test keys configured
- [ ] Run `npm run dev` to start

### Production Deployment Checklist

- [ ] All environment variables set in Cloud Run
- [ ] Supabase service role key stored as secret
- [ ] Data API enabled in Supabase
- [ ] RLS policies applied
- [ ] Stripe webhook configured (if using)
- [ ] Domain/URL configured correctly
- [ ] Test the deployment thoroughly

---

## Support

For issues or questions:
1. Check the browser console (F12) for errors
2. Check the Network tab for failed requests
3. Verify all environment variables are set correctly
4. Ensure Supabase Data API is enabled
5. Verify RLS policies are in place

---

**Last Updated:** November 2024


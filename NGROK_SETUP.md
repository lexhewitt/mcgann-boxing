# ngrok Setup Guide

## Quick Setup (2 minutes)

### Step 1: Sign Up for Free Account

1. Go to: https://dashboard.ngrok.com/signup
2. Sign up with email (or use Google/GitHub)
3. Verify your email

### Step 2: Get Your Authtoken

1. After signing in, go to: https://dashboard.ngrok.com/get-started/your-authtoken
2. Copy your authtoken (looks like: `2abc123def456ghi789jkl012mno345pq_6r7s8t9u0v1w2x3y4z5`)

### Step 3: Configure ngrok

Run this command in your terminal (replace with your actual token):

```bash
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

### Step 4: Test

```bash
ngrok http 3000
```

You should now see the forwarding URL!

## Alternative: Use ngrok Web Interface

If you prefer, you can also:
1. Go to https://dashboard.ngrok.com/get-started/setup
2. Follow the web-based setup instructions

## Free Tier Limits

- ✅ 1 tunnel at a time
- ✅ HTTPS URLs (perfect for webhooks)
- ✅ Sufficient for development/testing
- ⚠️ URLs change each time you restart (unless you pay for static domain)

## For Production

For production, you'll deploy to Cloud Run, so you won't need ngrok - you'll use your actual domain URL.



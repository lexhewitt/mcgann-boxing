# Production Setup - WhatsApp Meta Integration

## Step-by-Step: Deploy and Configure

### Step 1: Get Your Meta Credentials

In Meta App Dashboard, collect these values:

#### A. App ID and App Secret
1. Left sidebar → **App settings** → **Basic**
2. Copy **App ID**
3. Click **Show** next to **App Secret** and copy it

#### B. Access Token and Phone Number ID
1. Left sidebar → **WhatsApp** → **API Setup**
2. Copy:
   - **Temporary Access Token** (for now - we'll create permanent one later)
   - **Phone number ID** (the numeric ID, not the phone number)

#### C. Generate Webhook Verify Token
```bash
openssl rand -hex 32
```
Copy the output.

### Step 2: Update Your `.env.local`

Add these values:

```env
# Meta WhatsApp Cloud API Configuration
META_APP_ID=your_app_id_here
META_APP_SECRET=your_app_secret_here
META_ACCESS_TOKEN=your_temporary_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
META_WEBHOOK_VERIFY_TOKEN=your_generated_token_here
META_API_VERSION=v21.0
FRONTEND_URL=https://mcgann-boxing-898295873669.europe-west2.run.app
```

### Step 3: Create Secret for META_APP_SECRET

Store the app secret securely in Google Cloud:

```bash
echo -n "your_app_secret_here" | gcloud secrets create meta-app-secret --data-file=-
```

### Step 4: Deploy to Cloud Run

```bash
# Build and push image
gcloud builds submit --tag gcr.io/gen-lang-client-0158369562/mcgann-boxing:$(git rev-parse --short HEAD)

# Deploy with environment variables
gcloud run deploy mcgann-boxing \
  --image gcr.io/gen-lang-client-0158369562/mcgann-boxing:$(git rev-parse --short HEAD) \
  --region=europe-west2 \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="META_APP_ID=your_app_id,META_ACCESS_TOKEN=your_token,WHATSAPP_PHONE_NUMBER_ID=your_phone_id,META_WEBHOOK_VERIFY_TOKEN=your_token,META_API_VERSION=v21.0,FRONTEND_URL=https://mcgann-boxing-898295873669.europe-west2.run.app" \
  --set-secrets="META_APP_SECRET=meta-app-secret:latest,SUPABASE_SERVICE_ROLE_KEY=supabase-service-role-key:latest" \
  --update-secrets="META_APP_SECRET=meta-app-secret:latest"
```

### Step 5: Configure Webhook in Meta Dashboard

1. Go to Meta App Dashboard → **WhatsApp** → **Configuration** → **Webhook**
2. Click **Edit** or **Add Callback URL**
3. Enter:
   - **Callback URL**: `https://mcgann-boxing-898295873669.europe-west2.run.app/server-api/whatsapp-webhook`
   - **Verify Token**: Your generated token from Step 1C
4. Click **"Verify and Save"**
   - ✅ Should show "Verified" status
5. Subscribe to **"messages"** field

### Step 6: Create System User Token (For Production)

The temporary token expires. Create a permanent one:

1. Go to **Business Settings** → **Users** → **System Users**
   - (Access via: https://business.facebook.com/settings)
2. Click **Add** → **Create New System User**
3. Name: `WhatsApp API User`
4. Click **Create System User**
5. Click **Assign Assets**
6. Select your app
7. Role: **WhatsApp Administrator**
8. Click **Save Changes**
9. Click **Generate New Token**
10. Select your app
11. Check permissions:
    - ✅ `whatsapp_business_messaging`
    - ✅ `whatsapp_business_management`
12. Click **Generate Token**
13. **Copy this token** - it doesn't expire!
14. Update Cloud Run with new token:
    ```bash
    gcloud run services update mcgann-boxing \
      --update-env-vars="META_ACCESS_TOKEN=your_system_user_token" \
      --region=europe-west2
    ```

### Step 7: Test the Integration

#### Test Webhook Verification
```bash
curl "https://mcgann-boxing-898295873669.europe-west2.run.app/server-api/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"
```
Should return: `test123`

#### Test Message Sending
Use Meta Graph API Explorer:
1. Go to https://developers.facebook.com/tools/explorer/
2. Select your app
3. POST to `/{phone-number-id}/messages`
4. Body:
```json
{
  "messaging_product": "whatsapp",
  "to": "+447123456789",
  "type": "text",
  "text": {
    "body": "When are you available?"
  }
}
```

#### Check Logs
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=mcgann-boxing" --limit 50 --format json
```

Look for:
- `[WhatsApp] Auto-replied to...`
- Webhook verification messages
- Any errors

### Step 8: Create Message Template (For Outside 24-Hour Window)

1. Go to **WhatsApp** → **Message Templates**
2. Click **Create Template**
3. Fill in:
   - **Name**: `availability_reply`
   - **Category**: `UTILITY`
   - **Language**: English
   - **Body**:
     ```
     Hi! Thanks for your message about {{1}}'s availability.

     📅 View our monthly schedule and book online:
     {{2}}

     You can:
     • Continue as a guest and book a class or private 1-on-1 session
     • Become a member for easier booking and member benefits

     Reply with "BOOK" if you need help, or click the link above to see all available times! 🥊
     ```
4. **Variables**: `{{1}}` = Coach name, `{{2}}` = Booking link
5. Submit (approval takes 24-48 hours)

## Quick Checklist

- [ ] Got App ID and App Secret
- [ ] Got Access Token and Phone Number ID
- [ ] Generated Webhook Verify Token
- [ ] Updated `.env.local`
- [ ] Created `meta-app-secret` in Google Cloud
- [ ] Deployed to Cloud Run with environment variables
- [ ] Configured webhook in Meta dashboard with production URL
- [ ] Webhook verified successfully
- [ ] Subscribed to "messages" field
- [ ] Created System User token (permanent)
- [ ] Updated Cloud Run with System User token
- [ ] Tested webhook verification
- [ ] Tested message sending
- [ ] Created message template
- [ ] Tested end-to-end flow

## Your Production URL

**Webhook URL**: `https://mcgann-boxing-898295873669.europe-west2.run.app/server-api/whatsapp-webhook`

Use this in Meta dashboard webhook configuration.

## Troubleshooting

### Webhook Not Verifying
- Check server is deployed and running
- Verify token matches exactly
- Check Cloud Run logs for errors

### Messages Not Received
- Verify webhook is subscribed to "messages"
- Check phone number is connected to app
- Review Cloud Run logs

### Auto-Reply Not Sending
- Check META_ACCESS_TOKEN is valid
- Verify WHATSAPP_PHONE_NUMBER_ID is correct
- Check logs for API errors



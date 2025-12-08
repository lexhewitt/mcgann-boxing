# WhatsApp Cloud API Integration (Meta)

## Overview

This document covers the migration from Twilio WhatsApp API to Meta (Facebook) WhatsApp Cloud API. The Meta Cloud API provides direct integration with WhatsApp Business Platform, removing the need for a Business Solution Provider (BSP) like Twilio.

## Benefits of Meta Cloud API

✅ **Direct Integration**: No intermediary BSP required  
✅ **Cost Efficiency**: Conversation-based pricing (often cheaper for moderate volume)  
✅ **Full Control**: Direct access to WhatsApp Business Platform features  
✅ **Official Support**: Meta's supported infrastructure  
✅ **Template Management**: Built-in template creation and approval workflow  

## Architecture

```
Customer WhatsApp → Meta Cloud API → Webhook → Server
                                              ↓
                                    Auto-reply with booking link
                                              ↓
                                    Customer clicks link → BookingWizard
```

## Prerequisites

1. **Meta Business Account**
   - Create at [business.facebook.com](https://business.facebook.com)
   - Verify your business

2. **Meta Developer Account**
   - Sign up at [developers.facebook.com](https://developers.facebook.com)
   - Link to your Meta Business Account

3. **WhatsApp Business Account**
   - Apply for WhatsApp Business API access
   - Get approved phone number

## Step-by-Step Setup

### 1. Create Meta App

1. Go to [Meta for Developers](https://developers.facebook.com/apps/)
2. Click **Create App**
3. Select **Business** as app type
4. Fill in app details:
   - App Name: "Fleetwood Boxing Gym"
   - Contact Email: Your email
   - Business Account: Select your business account
5. Click **Create App**

### 2. Add WhatsApp Product

1. In your app dashboard, go to **Add Products**
2. Find **WhatsApp** and click **Set Up**
3. You'll be redirected to WhatsApp configuration

### 3. Get Your Credentials

After setting up WhatsApp, you'll need:

#### App ID and App Secret
- Go to **Settings** → **Basic**
- Copy **App ID**
- Click **Show** next to App Secret and copy it

#### Access Token
- Go to **WhatsApp** → **API Setup**
- Copy the **Temporary Access Token** (for testing)
- For production, create a **System User** with WhatsApp permissions:
  1. Go to **Business Settings** → **Users** → **System Users**
  2. Create new system user
  3. Assign **WhatsApp Administrator** role
  4. Generate token with `whatsapp_business_messaging` and `whatsapp_business_management` permissions

#### Phone Number ID
- Go to **WhatsApp** → **API Setup**
- Copy the **Phone number ID** (not the phone number itself!)

#### Webhook Verify Token
- Create a secure random string (e.g., `openssl rand -hex 32`)
- This will be used to verify webhook requests

### 4. Configure Webhook

1. In **WhatsApp** → **Configuration** → **Webhook**
2. Click **Edit** or **Add Callback URL**
3. Enter:
   - **Callback URL**: `https://your-domain.com/server-api/whatsapp-webhook`
   - **Verify Token**: The token you generated above
4. Click **Verify and Save**
5. Subscribe to webhook fields:
   - ✅ `messages` (for incoming messages)
   - ✅ `message_status` (optional, for delivery status)

### 5. Set Up Message Templates

For messages outside the 24-hour window, you need approved templates:

1. Go to **WhatsApp** → **Message Templates**
2. Click **Create Template**
3. Fill in:
   - **Name**: `availability_reply` (or your preferred name)
   - **Category**: `UTILITY` or `MARKETING`
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
   - **Variables**: 
     - `{{1}}` = Coach name
     - `{{2}}` = Booking link
4. Submit for approval (can take 24-48 hours)

### 6. Environment Variables

Add to `.env.local`:

```env
# Meta WhatsApp Cloud API Configuration
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
META_ACCESS_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
META_WEBHOOK_VERIFY_TOKEN=your_secure_random_token
META_API_VERSION=v21.0

# Frontend URL (for booking links)
FRONTEND_URL=https://your-domain.com
```

### 7. Cloud Run Deployment

For production, set environment variables:

```bash
gcloud run services update mcgann-boxing \
  --set-env-vars="META_APP_ID=your_app_id,META_ACCESS_TOKEN=your_token,WHATSAPP_PHONE_NUMBER_ID=your_phone_id,META_WEBHOOK_VERIFY_TOKEN=your_token,META_API_VERSION=v21.0,FRONTEND_URL=https://your-domain.com" \
  --set-secrets="META_APP_SECRET=meta-app-secret:latest" \
  --region=europe-west2
```

**Important**: Store `META_APP_SECRET` as a secret, not an environment variable!

## How It Works

### 24-Hour Window Rule

Meta has strict rules about when you can send free-form messages:

- **Within 24 hours**: After customer sends a message, you can reply with free-form text for 24 hours
- **Outside 24 hours**: Must use approved message templates

Our implementation:
- Auto-replies (immediate response) → Use free-form text (within 24-hour window)
- Scheduled notifications → Use message templates

### Message Flow

1. **Customer sends WhatsApp** to coach asking about availability
2. **Meta sends webhook** to `/server-api/whatsapp-webhook`
3. **Server verifies signature** using `META_APP_SECRET`
4. **System detects availability question** using keyword matching
5. **Finds coach** by matching phone number in database
6. **Sends auto-reply** with booking link (free-form text, within 24-hour window)
7. **Customer clicks link** → BookingWizard with calendar view

### Webhook Verification

Meta requires webhook verification:

1. **GET Request**: When you configure webhook, Meta sends GET request
2. **Verification**: Server checks `hub.verify_token` matches `META_WEBHOOK_VERIFY_TOKEN`
3. **Challenge**: Returns `hub.challenge` if verified

Our code handles this automatically in the GET endpoint.

## Code Structure

### Key Files

- `services/whatsappService.ts` - Meta Cloud API integration
- `server.js` - Webhook endpoint (`/server-api/whatsapp-webhook`)
- `services/notificationService.ts` - Notification wrapper

### Main Functions

#### `sendWhatsAppMessage(to, message, options)`
Sends a WhatsApp message. Automatically uses:
- Free-form text if `isWithin24HourWindow: true`
- Template if `templateName` provided and outside 24-hour window

#### `sendTemplateMessage(to, templateName, templateParams)`
Sends a message using an approved template (required outside 24-hour window).

#### `verifyWebhookSignature(payload, signature)`
Verifies webhook signature using SHA256 HMAC with `META_APP_SECRET`.

#### `extractMessageFromWebhook(payload)`
Extracts message text and sender from Meta webhook payload.

## Testing

### 1. Test Webhook Verification

```bash
curl "https://your-domain.com/server-api/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"
```

Should return: `test123`

### 2. Test Message Sending

Use Meta's Graph API Explorer:
1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app
3. Use endpoint: `POST /{phone-number-id}/messages`
4. Body:
```json
{
  "messaging_product": "whatsapp",
  "to": "+447123456789",
  "type": "text",
  "text": {
    "body": "Test message"
  }
}
```

### 3. Test Auto-Reply

1. Send WhatsApp message to your business number: "When are you available?"
2. Check server logs for webhook receipt
3. Verify auto-reply is sent with booking link

## Common Pitfalls & Solutions

### ❌ Template Rejection

**Problem**: Template gets rejected during approval

**Solution**:
- Use `UTILITY` category for transactional messages
- Avoid promotional language
- Keep variables simple (text only)
- Follow Meta's template guidelines exactly

### ❌ Webhook Signature Verification Fails

**Problem**: `Invalid signature` errors

**Solution**:
- Ensure `META_APP_SECRET` is correct
- Verify raw request body is used (not parsed JSON)
- Check signature header is `X-Hub-Signature-256`
- In development, you can temporarily skip verification

### ❌ Phone Number ID Confusion

**Problem**: Using phone number instead of Phone Number ID

**Solution**:
- Phone Number ID is a numeric ID (e.g., `123456789012345`)
- Phone number is the actual WhatsApp number (e.g., `+447123456789`)
- Always use Phone Number ID in API calls

### ❌ 24-Hour Window Violations

**Problem**: Trying to send free-form text outside 24-hour window

**Solution**:
- Track last message timestamp per customer
- Use templates for messages outside window
- Implement template fallback in code

### ❌ Access Token Expires

**Problem**: Temporary tokens expire after 24 hours

**Solution**:
- Use System User tokens for production
- Implement token refresh logic
- Store tokens securely (use secrets, not env vars)

### ❌ Webhook Not Receiving Messages

**Problem**: No webhook calls received

**Solution**:
- Verify webhook URL is publicly accessible (HTTPS required)
- Check webhook is subscribed to `messages` field
- Verify phone number is connected to your app
- Check Meta webhook logs in App Dashboard

## Migration Checklist

- [ ] Create Meta Business Account
- [ ] Create Meta Developer App
- [ ] Add WhatsApp product to app
- [ ] Get all credentials (App ID, Secret, Access Token, Phone Number ID)
- [ ] Generate webhook verify token
- [ ] Configure webhook URL and verify
- [ ] Create and submit message templates for approval
- [ ] Update environment variables
- [ ] Deploy updated code
- [ ] Test webhook verification (GET request)
- [ ] Test message sending
- [ ] Test auto-reply flow
- [ ] Monitor for errors
- [ ] Update documentation

## Cost Considerations

Meta uses **conversation-based pricing**:

- **User-initiated conversations**: Free (customer messages you first)
- **Business-initiated conversations**: Paid per conversation
- **Template messages**: Count as business-initiated

**Our use case**: Auto-replies are user-initiated (customer messages first), so they're **FREE**!

Only paid if:
- You send unsolicited messages
- You send outside 24-hour window (requires template)

## Deprecation Notes

### Twilio Code Removal

The following Twilio-specific code has been removed:
- `TWILIO_ACCOUNT_SID` environment variable
- `TWILIO_AUTH_TOKEN` environment variable
- `TWILIO_WHATSAPP_FROM` environment variable
- Twilio SDK usage in `whatsappService.ts`

### Fallback Options

If you need to keep Twilio as backup:
1. Keep old code in a separate branch
2. Use feature flag to switch between providers
3. Implement provider abstraction layer

## Support & Resources

- **Meta WhatsApp Documentation**: https://developers.facebook.com/docs/whatsapp
- **Graph API Reference**: https://developers.facebook.com/docs/graph-api
- **Webhook Guide**: https://developers.facebook.com/docs/graph-api/webhooks
- **Template Guidelines**: https://developers.facebook.com/docs/whatsapp/message-templates

## Troubleshooting

### Check Webhook Logs

1. Go to Meta App Dashboard
2. Navigate to **WhatsApp** → **Webhooks**
3. View recent webhook calls and errors

### Debug Signature Verification

Add logging in `verifyWebhookSignature`:
```typescript
console.log('Expected:', expectedSignature);
console.log('Received:', sig);
```

### Test Locally with ngrok

```bash
ngrok http 3000
# Use ngrok URL as webhook URL in Meta dashboard
```

## Next Steps

1. **Monitor Usage**: Track conversation costs in Meta Business Manager
2. **Optimize Templates**: Create reusable templates for common scenarios
3. **Add Rich Media**: Use images, videos, or interactive buttons in templates
4. **Implement Status Callbacks**: Track message delivery and read receipts
5. **Scale Testing**: Test with multiple concurrent webhook requests


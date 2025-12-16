# WhatsApp Meta Cloud API - Testing Guide

## Quick Start Testing

### Prerequisites

1. **Meta App Created** with WhatsApp product added
2. **Credentials Obtained**:
   - `META_APP_ID`
   - `META_APP_SECRET`
   - `META_ACCESS_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `META_WEBHOOK_VERIFY_TOKEN`
3. **Environment Variables Set** in `.env.local`

## Testing Methods

### Method 1: Local Testing with ngrok

This is the easiest way to test webhooks locally.

#### Step 1: Install ngrok

```bash
# macOS
brew install ngrok

# Or download from https://ngrok.com/download
```

#### Step 2: Start Your Local Server

```bash
npm run dev
# Server should be running on http://localhost:3000 (or your configured port)
```

#### Step 3: Start ngrok Tunnel

```bash
ngrok http 3000
```

You'll see output like:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

#### Step 4: Configure Webhook in Meta Dashboard

1. Go to [Meta App Dashboard](https://developers.facebook.com/apps/)
2. Select your app
3. Navigate to **WhatsApp** → **Configuration** → **Webhook**
4. Click **Edit** or **Add Callback URL**
5. Enter:
   - **Callback URL**: `https://abc123.ngrok.io/server-api/whatsapp-webhook`
   - **Verify Token**: Your `META_WEBHOOK_VERIFY_TOKEN` value
6. Click **Verify and Save**
7. Subscribe to **messages** field

#### Step 5: Test Webhook Verification

The webhook verification should happen automatically when you click "Verify and Save" in Meta dashboard. You should see in your terminal:

```
[WhatsApp] Webhook verified successfully
```

If verification fails, check:
- ngrok is running
- Server is running
- Verify token matches

#### Step 6: Test Message Sending

**Option A: Using Meta Graph API Explorer**

1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app from dropdown
3. Select your access token
4. Change method to **POST**
5. Enter endpoint: `/{your-phone-number-id}/messages`
6. In **Request Body**, enter:
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
7. Click **Submit**
8. Check your server logs for webhook receipt
9. Check WhatsApp for auto-reply

**Option B: Using cURL**

```bash
curl -X POST "https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "+447123456789",
    "type": "text",
    "text": {
      "body": "When are you available?"
    }
  }'
```

Replace:
- `{PHONE_NUMBER_ID}` with your actual Phone Number ID
- `{ACCESS_TOKEN}` with your access token
- `+447123456789` with a test phone number

#### Step 7: Test Auto-Reply Flow

1. Send a WhatsApp message to your business number: **"When are you available?"**
2. Check server logs - you should see:
   ```
   [WhatsApp] Auto-replied to +447123456789 about Coach Name's availability
   ```
3. Check WhatsApp - you should receive auto-reply with booking link
4. Click the booking link - should open BookingWizard with calendar view

### Method 2: Testing on Production/Staging

If you've deployed to Cloud Run or another server:

#### Step 1: Configure Webhook

1. Use your production URL: `https://your-domain.com/server-api/whatsapp-webhook`
2. Follow same steps as ngrok method above

#### Step 2: Test End-to-End

1. Send WhatsApp message to your business number
2. Monitor Cloud Run logs:
   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=mcgann-boxing" --limit 50
   ```
3. Verify auto-reply is sent
4. Test booking link

### Method 3: Unit Testing (Code Level)

Create a test file to test individual functions:

```typescript
// tests/whatsapp.test.ts
import { 
  isAvailabilityQuestion, 
  normalizePhoneNumber,
  verifyWebhookSignature 
} from '../services/whatsappService';

// Test keyword detection
console.assert(
  isAvailabilityQuestion("When are you available?") === true,
  "Should detect availability question"
);

console.assert(
  isAvailabilityQuestion("Hello") === false,
  "Should not detect non-availability question"
);

// Test phone normalization
console.assert(
  normalizePhoneNumber("07123456789") === "+447123456789",
  "Should normalize UK number"
);

console.assert(
  normalizePhoneNumber("+447123456789") === "+447123456789",
  "Should keep already normalized number"
);
```

## Testing Checklist

### ✅ Webhook Verification

- [ ] Webhook URL is publicly accessible (HTTPS)
- [ ] GET request returns challenge correctly
- [ ] Verify token matches
- [ ] Webhook shows as "Verified" in Meta dashboard

### ✅ Signature Verification

- [ ] Webhook signature is verified correctly
- [ ] Invalid signatures are rejected
- [ ] Logs show verification status

### ✅ Message Receiving

- [ ] Webhook receives incoming messages
- [ ] Message text is extracted correctly
- [ ] Sender phone number is extracted correctly
- [ ] Server logs show message receipt

### ✅ Availability Detection

- [ ] Keywords are detected correctly:
  - "available"
  - "availability"
  - "schedule"
  - "when are you"
  - "book"
  - etc.
- [ ] Non-availability messages are ignored

### ✅ Coach Lookup

- [ ] Coach is found by phone number match
- [ ] Phone number normalization works
- [ ] Handles cases where coach not found

### ✅ Auto-Reply Sending

- [ ] Auto-reply is sent successfully
- [ ] Message includes booking link
- [ ] Booking link has correct format: `/book?coach={id}&view=calendar`
- [ ] Message includes coach name
- [ ] Server logs show successful send

### ✅ Booking Link

- [ ] Link opens BookingWizard
- [ ] Coach filter is applied correctly
- [ ] Calendar view is shown
- [ ] Available slots are displayed

### ✅ Error Handling

- [ ] Invalid phone numbers are handled
- [ ] Missing credentials show appropriate errors
- [ ] API errors are logged
- [ ] Webhook errors don't crash server

## Debugging Tips

### Check Server Logs

```bash
# Local development
# Check terminal where server is running

# Cloud Run
gcloud logging read "resource.type=cloud_run_revision" --limit 100
```

### Common Issues & Solutions

#### Issue: Webhook Not Receiving Messages

**Check:**
1. ngrok is running (if local)
2. Server is running
3. Webhook URL is correct in Meta dashboard
4. Webhook is subscribed to "messages" field
5. Phone number is connected to app

**Debug:**
```bash
# Test webhook endpoint directly
curl -X POST https://your-domain.com/server-api/whatsapp-webhook \
  -H "Content-Type: application/json" \
  -d '{"object":"whatsapp_business_account","entry":[]}'
```

#### Issue: Signature Verification Fails

**Check:**
1. `META_APP_SECRET` is correct
2. Raw body is used (not parsed JSON)
3. Signature header is `X-Hub-Signature-256`

**Debug:**
Add logging in `verifyWebhookSignature`:
```typescript
console.log('Expected signature:', expectedSignature);
console.log('Received signature:', sig);
```

#### Issue: Message Not Sending

**Check:**
1. Access token is valid
2. Phone Number ID is correct (not phone number)
3. Recipient number is in E.164 format
4. Within 24-hour window (or using template)

**Debug:**
```bash
# Test API call directly
curl -X POST "https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"messaging_product":"whatsapp","to":"+447123456789","type":"text","text":{"body":"Test"}}'
```

#### Issue: Auto-Reply Not Triggering

**Check:**
1. Message contains availability keywords
2. Coach is found in database
3. Server logs show message processing
4. No errors in logs

**Debug:**
Add logging:
```typescript
console.log('Message text:', messageText);
console.log('Is availability question?', isAvailabilityQuestion(messageText));
console.log('Found coach:', coach);
```

## Test Scenarios

### Scenario 1: Customer Asks About Availability

1. **Send**: "When are you available?"
2. **Expected**: Auto-reply with booking link for general availability
3. **Verify**: Link opens BookingWizard with all coaches

### Scenario 2: Customer Asks Specific Coach

1. **Send**: "What's Rachel's schedule?"
2. **Expected**: Auto-reply with booking link filtered to Rachel
3. **Verify**: Link opens BookingWizard showing only Rachel's slots

### Scenario 3: Non-Availability Message

1. **Send**: "Hello"
2. **Expected**: No auto-reply (message ignored)
3. **Verify**: Server logs show message received but no reply

### Scenario 4: Coach Not Found

1. **Send**: "When are you available?" from unknown number
2. **Expected**: Auto-reply with general booking link
3. **Verify**: Link works and shows all availability

### Scenario 5: Invalid Phone Number

1. **Send**: Message from invalid number format
2. **Expected**: Error logged, no crash
3. **Verify**: Server continues running

## Testing Tools

### Meta Graph API Explorer

- **URL**: https://developers.facebook.com/tools/explorer/
- **Use**: Test API calls, send test messages
- **Select**: Your app and access token

### Meta Webhook Tester

- **Location**: Meta App Dashboard → WhatsApp → Webhooks
- **Use**: View recent webhook calls, see errors
- **Check**: Status codes, response times, errors

### ngrok Inspector

- **URL**: http://127.0.0.1:4040 (when ngrok is running)
- **Use**: See all HTTP requests, inspect payloads
- **Check**: Request/response bodies, headers

### Postman Collection

Create a Postman collection for testing:

```json
{
  "info": {
    "name": "WhatsApp Meta API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Send Message",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{ACCESS_TOKEN}}"
          }
        ],
        "url": {
          "raw": "https://graph.facebook.com/v21.0/{{PHONE_NUMBER_ID}}/messages",
          "host": ["graph", "facebook", "com"],
          "path": ["v21.0", "{{PHONE_NUMBER_ID}}", "messages"]
        },
        "body": {
          "mode": "raw",
          "raw": "{\n  \"messaging_product\": \"whatsapp\",\n  \"to\": \"+447123456789\",\n  \"type\": \"text\",\n  \"text\": {\n    \"body\": \"Test message\"\n  }\n}"
        }
      }
    }
  ]
}
```

## Automated Testing Script

Create a test script:

```bash
#!/bin/bash
# test-whatsapp.sh

echo "Testing WhatsApp Integration..."

# Test 1: Webhook Verification
echo "Test 1: Webhook Verification"
curl -s "http://localhost:3000/server-api/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=$META_WEBHOOK_VERIFY_TOKEN&hub.challenge=test123" | grep -q "test123" && echo "✅ PASS" || echo "❌ FAIL"

# Test 2: Send Test Message
echo "Test 2: Send Test Message"
RESPONSE=$(curl -s -X POST "https://graph.facebook.com/v21.0/$WHATSAPP_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer $META_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "+447123456789",
    "type": "text",
    "text": {
      "body": "When are you available?"
    }
  }')

echo "$RESPONSE" | grep -q "messages" && echo "✅ PASS" || echo "❌ FAIL"

echo "Tests complete!"
```

## Production Testing

Before going live:

1. **Test with Real Phone Numbers**
   - Use actual customer phone numbers
   - Test from different countries
   - Test different message formats

2. **Load Testing**
   - Send multiple messages simultaneously
   - Verify webhook handles concurrent requests
   - Check for rate limiting

3. **Error Recovery**
   - Test with invalid credentials
   - Test with expired tokens
   - Verify graceful error handling

4. **Monitor**
   - Set up alerts for webhook failures
   - Monitor API response times
   - Track message delivery rates

## Quick Test Commands

```bash
# Test webhook verification
curl "http://localhost:3000/server-api/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test"

# Test message sending
curl -X POST "https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"messaging_product":"whatsapp","to":"+447123456789","type":"text","text":{"body":"Test"}}'

# Check server logs (Cloud Run)
gcloud logging read "resource.type=cloud_run_revision" --limit 50 --format json
```

## Next Steps After Testing

1. ✅ All tests pass
2. ✅ Webhook verified in Meta dashboard
3. ✅ Auto-reply working correctly
4. ✅ Booking links functional
5. ✅ Error handling verified
6. ✅ Ready for production!




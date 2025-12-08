# WhatsApp Integration - Testing Instructions

## ✅ Webhook Configuration Complete

Your webhook is now configured in Meta Dashboard:
- **Product**: Whatsapp Business Account
- **Field Subscribed**: `messages` ✅
- **Callback URL**: https://mcgann-boxing-2coodfhbmq-nw.a.run.app/server-api/whatsapp-webhook
- **Verify Token**: Configured ✅

## 🧪 Test the Integration

### 1. Send a Test Message
Send a WhatsApp message to your business number with one of these:
- "When are you available?"
- "What's your schedule?"
- "Are you free?"
- "When can I book?"

### 2. Check the Auto-Reply
You should receive an auto-reply with:
- A greeting mentioning the coach's name
- A booking link: `https://mcgann-boxing-2coodfhbmq-nw.a.run.app/book?coach={coachId}&view=calendar`
- Instructions about booking as a guest or becoming a member

### 3. Monitor Logs
Watch for webhook activity:
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=mcgann-boxing" --limit 50 --format="table(timestamp,textPayload)" --project=gen-lang-client-0158369562
```

Look for:
- `[WhatsApp] Incoming message from...`
- `[WhatsApp] Auto-replied to...`
- `[WhatsApp] Message sent to...`

### 4. Test Different Scenarios

**Test 1: Availability Question**
- Message: "When are you available?"
- Expected: Auto-reply with booking link

**Test 2: Non-Availability Question**
- Message: "Hello" or "Thanks"
- Expected: No auto-reply (only responds to availability keywords)

**Test 3: Unknown Number**
- Message from a number not in your coaches database
- Expected: No auto-reply (only responds to known coach numbers)

## 🔍 Troubleshooting

### If messages aren't being received:
1. Check Cloud Run logs for webhook POST requests
2. Verify the webhook signature is being validated correctly
3. Check that coach phone numbers are in the correct format in your database

### If auto-reply isn't working:
1. Check logs for `[WhatsApp] Auto-replied to...`
2. Verify coach phone number matching logic
3. Check that `FRONTEND_URL` environment variable is set correctly

### If booking link is wrong:
1. Verify `FRONTEND_URL` in Cloud Run environment variables
2. Check that coach IDs are being extracted correctly from the database

## 📊 Expected Log Output

When working correctly, you should see:
```
[WhatsApp] Incoming message from +44...
[WhatsApp] Found coach: {coachName}
[WhatsApp] Auto-replied to +44... with booking link
[WhatsApp] Message sent to +44...: wamid.xxx
```

## ✅ Success Criteria

- ✅ Webhook receives messages from Meta
- ✅ Phone number normalization works (UK numbers converted to +44)
- ✅ Coach lookup by phone number succeeds
- ✅ Availability keywords are detected
- ✅ Auto-reply message is sent with booking link
- ✅ Booking link includes correct coach ID and calendar view


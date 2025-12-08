# WhatsApp Meta Cloud API - Quick Reference

## Code Stubs & Examples

### 1. Initialize Meta Cloud API Client

```typescript
// services/whatsappService.ts
const META_API_VERSION = process.env.META_API_VERSION || 'v21.0';
const META_GRAPH_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

const getMetaConfig = () => {
  return {
    appId: process.env.META_APP_ID,
    appSecret: process.env.META_APP_SECRET,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.META_ACCESS_TOKEN,
    webhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN,
    frontendUrl: process.env.FRONTEND_URL || '',
  };
};
```

### 2. Send Message Template

```typescript
// For messages outside 24-hour window
export const sendTemplateMessage = async (
  to: string,
  templateName: string,
  templateParams?: string[]
): Promise<{ success: boolean; error?: string }> => {
  const config = getMetaConfig();
  const url = `${META_GRAPH_API_BASE}/${config.phoneNumberId}/messages`;
  
  const payload = {
    messaging_product: 'whatsapp',
    to: normalizePhoneNumber(to),
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'en' },
      components: [{
        type: 'body',
        parameters: templateParams?.map(param => ({
          type: 'text',
          text: param
        })) || []
      }]
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return response.json();
};
```

### 3. Handle Inbound Webhook

```typescript
// server.js - GET endpoint (verification)
apiRouter.get('/whatsapp-webhook', (req, res) => {
  const { mode, token, challenge } = req.query;
  const { handleWebhookVerification } = require('./services/whatsappService');
  
  const result = handleWebhookVerification(mode, token, challenge);
  if (result.verified) {
    return res.status(200).send(challenge);
  }
  return res.status(403).send('Forbidden');
});

// POST endpoint (incoming messages)
apiRouter.post('/whatsapp-webhook', express.json(), async (req, res) => {
  // Verify signature
  const signature = req.headers['x-hub-signature-256'];
  const rawBody = JSON.stringify(req.body);
  
  if (signature && !verifyWebhookSignature(rawBody, signature)) {
    return res.status(403).send('Invalid signature');
  }
  
  // Extract message
  const messageData = extractMessageFromWebhook(req.body);
  if (!messageData) {
    return res.status(200).send('OK');
  }
  
  // Process message...
  res.status(200).send('OK');
});
```

### 4. Auto-Reply with Booking Link

```typescript
// Example: Auto-reply logic
const { 
  isAvailabilityQuestion, 
  createAvailabilityAutoReply, 
  generateScheduleLink, 
  sendWhatsAppMessage 
} = require('./services/whatsappService');

// Detect availability question
if (isAvailabilityQuestion(messageText)) {
  // Find coach by phone number
  const coach = await findCoachByPhoneNumber(senderPhone);
  
  // Generate booking link
  const bookingLink = generateScheduleLink(coach.id, baseUrl);
  
  // Create reply message
  const reply = createAvailabilityAutoReply(coach.name, bookingLink);
  
  // Send (within 24-hour window, so free-form text)
  await sendWhatsAppMessage(senderPhone, reply, { 
    isWithin24HourWindow: true 
  });
}
```

### 5. Webhook Signature Verification

```typescript
import crypto from 'crypto';

export const verifyWebhookSignature = (
  payload: string | Buffer,
  signature: string | undefined
): boolean => {
  if (!signature) return false;
  
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) return false;
  
  // Remove 'sha256=' prefix
  const sig = signature.replace(/^sha256=/, '');
  
  // Calculate expected signature
  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex');
  
  // Timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(sig, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
};
```

### 6. Extract Message from Webhook Payload

```typescript
export const extractMessageFromWebhook = (
  payload: MetaWebhookPayload
): { from: string; text: string; messageId: string } | null => {
  const entry = payload.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;
  const message = value?.messages?.[0];
  
  if (message?.type !== 'text' || !message.text?.body) {
    return null;
  }
  
  return {
    from: message.from,
    text: message.text.body,
    messageId: message.id,
  };
};
```

## Common Pitfalls & Solutions

### ⚠️ Pitfall 1: Template Rejection

**Problem**: Template gets rejected during Meta approval

**Why**: 
- Using wrong category (MARKETING vs UTILITY)
- Promotional language in template
- Incorrect variable formatting

**Solution**:
```typescript
// ✅ GOOD: Utility category, simple variables
{
  name: "availability_reply",
  category: "UTILITY",
  body: "Hi! Thanks for your message about {{1}}'s availability. View schedule: {{2}}"
}

// ❌ BAD: Marketing category, promotional language
{
  name: "promo_availability",
  category: "MARKETING",  // Wrong!
  body: "🎉 Special offer! Book now and save! {{1}}"  // Too promotional
}
```

### ⚠️ Pitfall 2: Webhook Signature Verification Fails

**Problem**: `Invalid signature` errors in logs

**Why**:
- Using parsed JSON instead of raw body
- Incorrect secret
- Missing signature header

**Solution**:
```typescript
// ✅ GOOD: Use raw body string
const rawBody = JSON.stringify(req.body);
verifyWebhookSignature(rawBody, signature);

// ❌ BAD: Using parsed object
verifyWebhookSignature(req.body, signature);  // Wrong!
```

**Fix in server.js**:
```javascript
// Must capture raw body BEFORE express.json() parses it
app.use('/server-api/whatsapp-webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
  // Verify signature with raw body
  const signature = req.headers['x-hub-signature-256'];
  if (!verifyWebhookSignature(req.body, signature)) {
    return res.status(403).send('Invalid signature');
  }
  // Then parse JSON
  req.body = JSON.parse(req.body.toString());
  next();
});
```

### ⚠️ Pitfall 3: Phone Number ID Confusion

**Problem**: Using phone number instead of Phone Number ID

**Why**: They look similar but are different

**Solution**:
```typescript
// ✅ GOOD: Use Phone Number ID (numeric string)
const phoneNumberId = "123456789012345";  // This is the ID
const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

// ❌ BAD: Using actual phone number
const phoneNumber = "+447123456789";  // This is the number
const url = `https://graph.facebook.com/v21.0/${phoneNumber}/messages`;  // Wrong!
```

**How to find Phone Number ID**:
- Meta App Dashboard → WhatsApp → API Setup
- Look for "Phone number ID" (not "To" field)

### ⚠️ Pitfall 4: 24-Hour Window Violations

**Problem**: Trying to send free-form text outside 24-hour window

**Why**: Meta requires templates outside 24-hour window

**Solution**:
```typescript
// Track last message timestamp
const lastMessageTime = await getLastMessageTime(phoneNumber);
const hoursSinceLastMessage = (Date.now() - lastMessageTime) / (1000 * 60 * 60);

if (hoursSinceLastMessage > 24) {
  // Use template
  await sendTemplateMessage(phoneNumber, 'availability_reply', [coachName, bookingLink]);
} else {
  // Use free-form text
  await sendWhatsAppMessage(phoneNumber, reply, { isWithin24HourWindow: true });
}
```

### ⚠️ Pitfall 5: Access Token Expires

**Problem**: Temporary tokens expire after 24 hours

**Why**: Using temporary token from API Setup page

**Solution**:
```typescript
// ✅ GOOD: Use System User token (doesn't expire)
// Create in Business Settings → Users → System Users
// Generate token with whatsapp_business_messaging permission

// ❌ BAD: Using temporary token
const tempToken = "EAABsbCS1iHgBO...";  // Expires in 24 hours!
```

### ⚠️ Pitfall 6: Webhook Not Receiving Messages

**Problem**: No webhook calls received

**Why**:
- Webhook URL not publicly accessible
- Not subscribed to correct fields
- Phone number not connected

**Solution**:
```typescript
// Check webhook configuration
// 1. Verify URL is HTTPS and publicly accessible
// 2. Check subscribed fields include "messages"
// 3. Verify phone number is connected to app
// 4. Test with ngrok for local development

// Test webhook locally:
// ngrok http 3000
// Use ngrok URL in Meta dashboard
```

### ⚠️ Pitfall 7: Incorrect Message Payload Format

**Problem**: API returns 400 error

**Why**: Wrong payload structure

**Solution**:
```typescript
// ✅ GOOD: Correct format
{
  messaging_product: 'whatsapp',
  to: '+447123456789',
  type: 'text',
  text: {
    body: 'Message text'
  }
}

// ❌ BAD: Missing required fields
{
  to: '+447123456789',
  body: 'Message text'  // Wrong structure!
}
```

### ⚠️ Pitfall 8: Phone Number Normalization

**Problem**: Messages not delivered

**Why**: Phone number format incorrect

**Solution**:
```typescript
// ✅ GOOD: Normalize to E.164
const normalized = normalizePhoneNumber('07123456789');  // Returns '+447123456789'

// ❌ BAD: Sending without normalization
await sendWhatsAppMessage('07123456789', message);  // May fail!
```

## Testing Checklist

- [ ] Webhook verification (GET request) works
- [ ] Signature verification passes
- [ ] Message extraction works correctly
- [ ] Auto-reply sends successfully
- [ ] Booking link is correct format
- [ ] Template messages work (if outside 24-hour window)
- [ ] Error handling works
- [ ] Logs show correct information

## Environment Variables Checklist

```env
# Required
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret  # Store as secret!
META_ACCESS_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
META_WEBHOOK_VERIFY_TOKEN=your_secure_random_token

# Optional
META_API_VERSION=v21.0  # Defaults to v21.0
FRONTEND_URL=https://your-domain.com
```

## Quick Debug Commands

```bash
# Test webhook verification
curl "https://your-domain.com/server-api/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"

# Test message sending (via Graph API Explorer)
# POST https://graph.facebook.com/v21.0/{phone-number-id}/messages
# Body: { "messaging_product": "whatsapp", "to": "+447123456789", "type": "text", "text": { "body": "Test" } }

# Check webhook logs
# Meta App Dashboard → WhatsApp → Webhooks → View recent calls
```

## Support Resources

- **Meta WhatsApp Docs**: https://developers.facebook.com/docs/whatsapp
- **Graph API Reference**: https://developers.facebook.com/docs/graph-api
- **Webhook Guide**: https://developers.facebook.com/docs/graph-api/webhooks
- **Template Guidelines**: https://developers.facebook.com/docs/whatsapp/message-templates


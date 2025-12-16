# Migration Guide: Twilio to Meta WhatsApp Cloud API

## Overview

This guide walks through migrating from Twilio WhatsApp API to Meta WhatsApp Cloud API.

## Why Migrate?

- ✅ **Direct Integration**: No BSP intermediary
- ✅ **Cost Efficiency**: Conversation-based pricing (often cheaper)
- ✅ **Official Support**: Meta's supported infrastructure
- ✅ **Full Control**: Direct access to WhatsApp Business Platform

## Pre-Migration Checklist

- [ ] Review current Twilio usage and costs
- [ ] Identify all WhatsApp integrations in codebase
- [ ] Document current webhook URLs and configurations
- [ ] Backup current environment variables
- [ ] Plan downtime window (if needed)

## Migration Steps

### Step 1: Set Up Meta Infrastructure

1. **Create Meta Business Account**
   - Sign up at [business.facebook.com](https://business.facebook.com)
   - Complete business verification

2. **Create Meta Developer App**
   - Go to [developers.facebook.com](https://developers.facebook.com)
   - Create new app → Select "Business" type
   - Add WhatsApp product

3. **Get Credentials**
   - App ID and App Secret (Settings → Basic)
   - Access Token (WhatsApp → API Setup)
   - Phone Number ID (WhatsApp → API Setup)
   - Generate Webhook Verify Token

See [WHATSAPP_INTEGRATION_META.md](WHATSAPP_INTEGRATION_META.md) for detailed setup.

### Step 2: Update Code

The code has already been migrated. Key changes:

#### `services/whatsappService.ts`
- ✅ Replaced Twilio SDK with Meta Graph API calls
- ✅ Added webhook signature verification
- ✅ Implemented template message support
- ✅ Updated message sending logic

#### `server.js`
- ✅ Updated webhook endpoint for Meta format
- ✅ Added GET endpoint for webhook verification
- ✅ Changed from form-encoded to JSON payload
- ✅ Added signature verification

#### `services/notificationService.ts`
- ✅ Updated to use Meta Cloud API
- ✅ Changed environment variable checks

### Step 3: Update Environment Variables

**Remove:**
```env
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=...
```

**Add:**
```env
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
META_ACCESS_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
META_WEBHOOK_VERIFY_TOKEN=your_secure_random_token
META_API_VERSION=v21.0
FRONTEND_URL=https://your-domain.com
```

### Step 4: Configure Webhook

1. In Meta App Dashboard → WhatsApp → Configuration → Webhook
2. Set Callback URL: `https://your-domain.com/server-api/whatsapp-webhook`
3. Set Verify Token: Your generated token
4. Click "Verify and Save"
5. Subscribe to `messages` field

### Step 5: Create Message Templates

For messages outside 24-hour window:

1. Go to WhatsApp → Message Templates
2. Create template named `availability_reply`
3. Add variables: `{{1}}` (coach name), `{{2}}` (booking link)
4. Submit for approval (24-48 hours)

### Step 6: Test Migration

#### Test Webhook Verification
```bash
curl "https://your-domain.com/server-api/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"
```
Should return: `test123`

#### Test Message Sending
Use Meta Graph API Explorer or send test message via WhatsApp.

#### Test Auto-Reply Flow
1. Send WhatsApp: "When are you available?"
2. Verify webhook is received
3. Check auto-reply is sent
4. Verify booking link works

### Step 7: Deploy

1. Update Cloud Run environment variables
2. Deploy new code
3. Monitor logs for errors
4. Test end-to-end flow

### Step 8: Monitor & Validate

- [ ] Webhook receiving messages correctly
- [ ] Auto-replies being sent
- [ ] Booking links working
- [ ] No errors in logs
- [ ] Signature verification working

## Key Differences

### Message Format

**Twilio:**
```javascript
{
  From: "whatsapp:+447123456789",
  To: "whatsapp:+14155238886",
  Body: "Message text"
}
```

**Meta:**
```javascript
{
  entry: [{
    changes: [{
      value: {
        messages: [{
          from: "447123456789",
          text: { body: "Message text" }
        }]
      }
    }]
  }]
}
```

### Webhook Verification

**Twilio:** No signature verification required

**Meta:** SHA256 HMAC signature verification required using `META_APP_SECRET`

### Message Sending

**Twilio:**
```javascript
twilio.messages.create({
  from: "whatsapp:+14155238886",
  to: "whatsapp:+447123456789",
  body: "Message"
});
```

**Meta:**
```javascript
fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    messaging_product: 'whatsapp',
    to: '+447123456789',
    type: 'text',
    text: { body: 'Message' }
  })
});
```

### 24-Hour Window

**Twilio:** No restrictions on message types

**Meta:** 
- Within 24 hours: Free-form text allowed
- Outside 24 hours: Must use approved templates

## Rollback Plan

If migration fails:

1. **Revert Code**: Switch back to Twilio branch
2. **Restore Environment Variables**: Add back Twilio credentials
3. **Update Webhook**: Point back to Twilio webhook URL
4. **Redeploy**: Deploy previous version

Keep Twilio credentials active during migration period for quick rollback.

## Common Issues

### Issue: Webhook Not Receiving Messages

**Solution:**
- Verify webhook URL is publicly accessible (HTTPS)
- Check webhook is subscribed to `messages` field
- Verify phone number is connected to app
- Check Meta webhook logs in App Dashboard

### Issue: Signature Verification Fails

**Solution:**
- Ensure `META_APP_SECRET` is correct
- Verify raw request body is used (not parsed JSON)
- Check signature header is `X-Hub-Signature-256`

### Issue: Template Not Approved

**Solution:**
- Use `UTILITY` category for transactional messages
- Avoid promotional language
- Follow Meta's template guidelines
- Wait 24-48 hours for approval

### Issue: Access Token Expires

**Solution:**
- Use System User tokens (don't expire)
- Implement token refresh logic
- Store tokens securely

## Post-Migration

### Clean Up

1. Remove Twilio dependencies from `package.json` (optional, keep for rollback)
2. Archive Twilio credentials (don't delete immediately)
3. Update documentation
4. Notify team of migration completion

### Monitoring

- Monitor Meta Business Manager for costs
- Track webhook success rates
- Monitor message delivery times
- Review error logs regularly

## Support

- **Meta Documentation**: https://developers.facebook.com/docs/whatsapp
- **Migration Issues**: Check [WHATSAPP_INTEGRATION_META.md](WHATSAPP_INTEGRATION_META.md)
- **Common Pitfalls**: See troubleshooting section in Meta integration doc

## Timeline Estimate

- **Setup**: 2-4 hours (Meta account, app creation, credentials)
- **Template Approval**: 24-48 hours (waiting for Meta)
- **Testing**: 1-2 hours
- **Deployment**: 30 minutes
- **Total**: 1-3 days (mostly waiting for template approval)




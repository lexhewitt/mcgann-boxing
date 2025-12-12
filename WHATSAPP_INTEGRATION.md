# WhatsApp Auto-Reply Integration

## Overview

The Fleetwood Boxing Gym app now includes WhatsApp Business API integration that automatically responds to availability questions with personalized booking links.

## Features

✅ **Auto-Reply to Availability Questions**
- Detects when someone asks about coach availability via WhatsApp
- Automatically sends a personalized response with booking link

✅ **Personalized Booking Links**
- Links include coach ID for automatic filtering
- Shows monthly schedule calendar view
- Options to book as guest or become a member

✅ **Smart Message Detection**
- Recognizes availability-related keywords:
  - "available", "availability", "schedule", "calendar"
  - "when are you", "what times", "book", "session"
  - And more...

## How It Works

### Flow Diagram

```
Customer sends WhatsApp → Twilio Webhook → Server detects availability question
                                                      ↓
                                    Auto-reply with booking link
                                                      ↓
                                    Customer clicks link → BookingWizard
                                                      ↓
                                    Monthly calendar view (filtered by coach)
                                                      ↓
                                    Book as guest or become member
```

### Technical Implementation

1. **Webhook Endpoint**: `/server-api/whatsapp-webhook`
   - Receives incoming WhatsApp messages from Twilio
   - Extracts sender phone number and message body

2. **Coach Detection**
   - Queries Supabase `coaches` table
   - Matches phone number to coach's `mobile_number`
   - If no coach match, checks if message is about general availability

3. **Auto-Reply Generation**
   - Creates personalized message with coach name
   - Generates booking link: `/book?coach={coachId}&view=calendar`
   - Sends via Twilio WhatsApp API

4. **BookingWizard Integration**
   - Reads `coach` URL parameter
   - Automatically filters to show that coach's availability
   - Shows calendar view when `view=calendar` parameter is present

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This will install the `twilio` package.

### 2. Configure Twilio

1. Sign up at [twilio.com](https://www.twilio.com)
2. Get your Account SID and Auth Token from the dashboard
3. Set up WhatsApp Sandbox (for testing) or apply for WhatsApp Business API (for production)

### 3. Set Environment Variables

Add to `.env.local`:

```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
FRONTEND_URL=https://your-domain.com
```

### 4. Configure Webhook in Twilio

1. Go to Twilio Console → Messaging → Settings → WhatsApp Sandbox Settings
2. Set webhook URL: `https://your-domain.com/server-api/whatsapp-webhook`
3. Set HTTP method: `POST`

### 5. Test

1. Send a WhatsApp message to your Twilio number: "When are you available?"
2. You should receive an auto-reply with a booking link
3. Click the link to see the monthly schedule calendar

## Example Auto-Reply Message

```
Hi! Thanks for your message about Rachel's availability. 

📅 View our monthly schedule and book online:
https://your-domain.com/book?coach=coach-id&view=calendar

You can:
• Continue as a guest and book a class or private 1-on-1 session
• Become a member for easier booking and member benefits

Reply with "BOOK" if you need help, or click the link above to see all available times! 🥊
```

## Booking Link Format

The auto-reply generates links in this format:

```
/book?coach={coachId}&view=calendar
```

- `coach={coachId}` - Filters BookingWizard to show only that coach's classes/slots
- `view=calendar` - Shows calendar view instead of list view

## Coach Phone Number Format

Coaches' phone numbers in the database should be stored in a format that can be normalized:
- UK numbers: `07123456789` or `+447123456789`
- The system normalizes both formats for matching

## Production Deployment

### Cloud Run Environment Variables

```bash
gcloud run services update mcgann-boxing \
  --set-env-vars="TWILIO_ACCOUNT_SID=your_sid,TWILIO_AUTH_TOKEN=your_token,TWILIO_WHATSAPP_FROM=whatsapp:+14155238886,FRONTEND_URL=https://your-domain.com" \
  --region=europe-west2
```

### Important Notes

- **HTTPS Required**: Webhook URL must use HTTPS
- **Public Access**: Webhook endpoint must be publicly accessible
- **WhatsApp Business API**: For production, you need approved WhatsApp Business API access
- **Rate Limits**: Twilio has rate limits - check their documentation

## Troubleshooting

### No Auto-Reply Received

1. Check Twilio webhook is configured correctly
2. Verify environment variables are set
3. Check server logs for errors
4. Ensure phone number format matches (try with/without country code)

### Webhook Not Receiving Messages

1. Verify webhook URL is publicly accessible
2. Check Twilio webhook configuration
3. Test webhook endpoint manually with curl:
   ```bash
   curl -X POST https://your-domain.com/server-api/whatsapp-webhook \
     -d "From=whatsapp:+447123456789&To=whatsapp:+14155238886&Body=available"
   ```

### Coach Not Found

1. Verify coach's `mobile_number` is set in Supabase
2. Check phone number format matches (system normalizes UK numbers)
3. Check Supabase connection and RLS policies

## Files Modified/Created

- ✅ `services/whatsappService.ts` - WhatsApp API integration
- ✅ `services/notificationService.ts` - Updated to use real WhatsApp API
- ✅ `server.js` - Added webhook endpoint
- ✅ `components/bookings/BookingWizard.tsx` - Added URL parameter support
- ✅ `context/DataContext.tsx` - Made notifications async
- ✅ `package.json` - Added twilio dependency
- ✅ `CONFIG.md` - Added WhatsApp configuration section

## Next Steps

1. **Test the integration** with Twilio sandbox
2. **Apply for WhatsApp Business API** for production use
3. **Customize auto-reply messages** in `services/whatsappService.ts`
4. **Add more keyword detection** if needed
5. **Set up monitoring** for webhook health

## Support

For issues or questions:
- Check Twilio documentation: https://www.twilio.com/docs/whatsapp
- Review server logs for errors
- Verify all environment variables are set correctly



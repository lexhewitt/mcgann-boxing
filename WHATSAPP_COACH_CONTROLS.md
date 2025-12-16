# WhatsApp Coach Control Dashboard

## Overview

Coaches now have a dedicated WhatsApp control panel in their dashboard that allows them to:
1. **Toggle auto-replies on/off** - Control whether the system automatically responds to availability questions
2. **Send personal messages** - Compose and send WhatsApp messages directly to clients

## Features

### Auto-Reply Toggle
- Simple on/off switch in the coach dashboard
- When **enabled** (default): System automatically replies to availability questions with booking links
- When **disabled**: No auto-replies are sent, allowing coaches to respond manually
- Setting is saved per coach in the database

### Personal Message Composer
- Send WhatsApp messages to any phone number
- Supports both E.164 format (+447123456789) and UK format (07123456789)
- Phone numbers are automatically normalized
- Messages are sent within the 24-hour window (free-form text, no template required)
- Real-time status feedback (success/error messages)

## Access

1. Log in as a coach
2. Go to the Dashboard
3. Click the **"WhatsApp"** tab
4. You'll see:
   - Auto-reply toggle switch
   - Message composer with recipient phone and message fields
   - Tips and information box

## Database Changes

### New Column
- `coaches.whatsapp_auto_reply_enabled` (boolean, default: true)
- Added to the `coaches` table schema
- Migrated automatically via `supabase/seed.sql`

## How It Works

### Auto-Reply Logic
1. When a WhatsApp message arrives via webhook
2. System checks if it's an availability question (keywords: "available", "schedule", "when are you", etc.)
3. System looks up the coach by phone number
4. **NEW**: Checks `whatsapp_auto_reply_enabled` setting
5. If enabled: Sends auto-reply with booking link
6. If disabled: Logs the message but doesn't auto-reply

### Personal Messages
1. Coach enters recipient phone number and message
2. Frontend calls `/server-api/send-whatsapp` endpoint
3. Server normalizes phone number to E.164 format
4. Server sends message via Meta WhatsApp Cloud API
5. Returns success/error status to coach

## API Endpoints

### POST `/server-api/send-whatsapp`
Sends a WhatsApp message from the coach dashboard.

**Request:**
```json
{
  "to": "+447123456789",
  "message": "Your message here"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "wamid.xxx"
}
```

## Code Changes

### New Files
- `components/dashboard/WhatsAppControlPanel.tsx` - Main control panel component

### Modified Files
- `types.ts` - Added `whatsappAutoReplyEnabled` to Coach interface
- `components/dashboard/CoachDashboard.tsx` - Added WhatsApp tab
- `context/DataContext.tsx` - Updated `updateCoach` to be async and save WhatsApp setting
- `server.js` - Updated webhook handler to check auto-reply setting, added coach mapping
- `supabase/seed.sql` - Added `whatsapp_auto_reply_enabled` column

## Testing

1. **Test Auto-Reply Toggle:**
   - Go to WhatsApp tab
   - Toggle auto-reply off
   - Send test message asking about availability
   - Verify no auto-reply is sent
   - Toggle back on
   - Send another test message
   - Verify auto-reply is sent

2. **Test Personal Messages:**
   - Enter a phone number (try both formats)
   - Type a message
   - Click "Send Message"
   - Verify success message appears
   - Check WhatsApp to confirm message was received

## Benefits

- **Flexibility**: Coaches can disable auto-replies when they want to respond personally
- **Control**: Coaches can send custom messages to clients
- **Convenience**: All WhatsApp controls in one place
- **Simple**: Easy-to-use toggle switch and message composer




# Custom Auto-Reply Message Feature

## Overview

Coaches can now customize their own personal WhatsApp auto-reply message for availability questions directly from their dashboard.

## How It Works

1. **Coach Dashboard** → **WhatsApp** tab
2. **Custom Auto-Reply Message** section
3. Enter your custom message
4. Use `{bookingLink}` placeholder where you want the booking link to appear
5. Click **"Save Custom Message"**
6. If no custom message is set, the default message is used

## Placeholder

- `{bookingLink}` - Replaced with the actual booking link when the message is sent

## Example Custom Messages

### Simple Example:
```
Hi! Thanks for your message about my availability.

📅 Book online here: {bookingLink}

See you soon! 🥊
```

### Detailed Example:
```
Hi! Thanks for asking about my availability.

I'm available for:
• Private 1-on-1 sessions
• Group classes
• Technique workshops

📅 View my full schedule and book: {bookingLink}

Reply with "BOOK" if you need help! 🥊
```

## Database

- **Column**: `coaches.whatsapp_auto_reply_message` (text, nullable)
- **Default**: If null/empty, uses the default system message

## Code Changes

- Added `whatsappAutoReplyMessage` field to Coach type
- Updated WhatsAppControlPanel with message editor
- Updated webhook handler to use custom message if set
- Updated `createAvailabilityAutoReply` function to accept custom message

## Reset to Default

Coaches can click **"Reset to Default"** to clear their custom message and use the system default.



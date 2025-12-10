/**
 * WhatsApp Business Cloud API Service
 * Uses Meta (Facebook) WhatsApp Cloud API for sending and receiving messages
 * 
 * Migration from Twilio to Meta Cloud API
 */

const crypto = require('crypto');

// Meta Cloud API Configuration
const META_API_VERSION = process.env.META_API_VERSION || 'v21.0';
const META_GRAPH_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

// Environment variables
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

/**
 * Verifies webhook signature from Meta
 * Meta uses X-Hub-Signature-256 header with SHA256 HMAC
 */
const verifyWebhookSignature = (payload, signature) => {
  if (!signature) {
    console.warn('[WhatsApp] No signature provided');
    return false;
  }

  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    console.error('[WhatsApp] META_APP_SECRET not configured');
    return false;
  }

  // Remove 'sha256=' prefix if present
  const sig = signature.replace(/^sha256=/, '');
  
  // Calculate expected signature
  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex');

  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(sig, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
};

/**
 * Normalizes phone number to E.164 format
 * Handles UK numbers (starts with 0 or +44)
 */
const normalizePhoneNumber = (phone) => {
  if (!phone) return null;
  
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Handle UK numbers
  if (cleaned.startsWith('0')) {
    // Convert 07... to +447...
    cleaned = '+44' + cleaned.substring(1);
  } else if (!cleaned.startsWith('+')) {
    // Assume UK if no country code
    cleaned = '+44' + cleaned;
  }
  
  // Validate E.164 format (starts with +, followed by 1-15 digits)
  if (!/^\+[1-9]\d{1,14}$/.test(cleaned)) {
    return null;
  }
  
  return cleaned;
};

/**
 * Sends a WhatsApp message using Meta Cloud API
 * 
 * For messages within 24-hour window: Use free-form text messages
 * For messages outside 24-hour window: Must use approved message templates
 */
const sendWhatsAppMessage = async (to, message, options) => {
  const config = getMetaConfig();
  
  if (!config.phoneNumberId || !config.accessToken) {
    console.error('[WhatsApp] Missing Meta configuration');
    return { success: false, error: 'WhatsApp service not configured' };
  }

  // Normalize phone number
  const normalizedTo = normalizePhoneNumber(to);
  if (!normalizedTo) {
    return { success: false, error: 'Invalid phone number format' };
  }

  try {
    const url = `${META_GRAPH_API_BASE}/${config.phoneNumberId}/messages`;
    
    // Determine if we should use template or free-form message
    const useTemplate = options?.templateName && (!options.isWithin24HourWindow || options.isWithin24HourWindow === false);
    
    let payload;

    if (useTemplate && options.templateName) {
      // Use message template (required outside 24-hour window)
      payload = {
        messaging_product: 'whatsapp',
        to: normalizedTo,
        type: 'template',
        template: {
          name: options.templateName,
          language: { code: 'en' },
          ...(options.templateParams && options.templateParams.length > 0 && {
            components: [{
              type: 'body',
              parameters: options.templateParams.map(param => ({
                type: 'text',
                text: param
              }))
            }]
          })
        }
      };
    } else {
      // Use free-form text message (within 24-hour window)
      payload = {
        messaging_product: 'whatsapp',
        to: normalizedTo,
        type: 'text',
        text: {
          body: message
        }
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[WhatsApp] API error:', data);
      return { 
        success: false, 
        error: data.error?.message || `HTTP ${response.status}` 
      };
    }

    console.log(`[WhatsApp] Message sent to ${normalizedTo}: ${data.messages?.[0]?.id || 'unknown'}`);
    return { 
      success: true, 
      messageId: data.messages?.[0]?.id 
    };
  } catch (error) {
    console.error('[WhatsApp] Error sending message:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Sends a message using an approved template
 * Use this for messages outside the 24-hour window
 */
const sendTemplateMessage = async (to, templateName, templateParams) => {
  return sendWhatsAppMessage(to, '', {
    templateName,
    templateParams,
    isWithin24HourWindow: false,
  });
};

/**
 * Detects if a message is asking about availability
 */
const isAvailabilityQuestion = (message) => {
  const lowerMessage = message.toLowerCase();
  const availabilityKeywords = [
    'available',
    'availability',
    'when are you',
    'what times',
    'schedule',
    'calendar',
    'when can',
    'free',
    'open',
    'hours',
    'times',
    'book',
    'booking',
    'session',
    'class',
  ];
  
  return availabilityKeywords.some(keyword => lowerMessage.includes(keyword));
};

/**
 * Generates a personalized booking link for a coach
 */
const generateCoachBookingLink = (coachId, baseUrl = process.env.FRONTEND_URL || '') => {
  return `${baseUrl}/book?coach=${coachId}`;
};

/**
 * Generates a monthly schedule calendar link
 */
const generateScheduleLink = (coachId, baseUrl = process.env.FRONTEND_URL || '') => {
  const params = new URLSearchParams();
  if (coachId) {
    params.set('coach', coachId);
  }
  params.set('view', 'calendar');
  return `${baseUrl}/book?${params.toString()}`;
};

/**
 * Creates an auto-reply message for availability questions
 * @param coachName - Name of the coach
 * @param bookingLink - Link to booking page
 * @param customMessage - Optional custom message from coach (will replace {bookingLink} placeholder)
 */
const createAvailabilityAutoReply = (coachName, bookingLink, customMessage) => {
  // If coach has a custom message, use it and replace {bookingLink} placeholder
  if (customMessage && customMessage.trim()) {
    return customMessage.replace(/{bookingLink}/g, bookingLink);
  }
  
  // Default message
  return `Hi! Thanks for your message about ${coachName}'s availability. 

📅 View our monthly schedule and book online:
${bookingLink}

You can:
• Continue as a guest and book a class or private 1-on-1 session
• Become a member for easier booking and member benefits

Reply with "BOOK" if you need help, or click the link above to see all available times! 🥊`;
};

/**
 * Extracts message text from Meta webhook payload
 */
const extractMessageFromWebhook = (payload) => {
  if (!payload.entry || payload.entry.length === 0) {
    return null;
  }

  const entry = payload.entry[0];
  const change = entry.changes?.[0];
  const value = change?.value;

  if (!value?.messages || value.messages.length === 0) {
    return null;
  }

  const message = value.messages[0];
  
  // Only handle text messages for now
  if (message.type !== 'text' || !message.text?.body) {
    return null;
  }

  // The display_phone_number is the number that received the message (coach's number)
  const displayPhoneNumber = value.metadata?.display_phone_number;

  return {
    from: message.from, // Sender's number (customer)
    text: message.text.body,
    messageId: message.id,
    to: displayPhoneNumber, // Recipient's number (coach's number)
    displayPhoneNumber: displayPhoneNumber,
  };
};

/**
 * Handles webhook verification (GET request from Meta)
 */
const handleWebhookVerification = (mode, token, challenge) => {
  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
  
  console.log('[WhatsApp] Verification attempt:', { mode, token: token?.substring(0, 10) + '...', hasVerifyToken: !!verifyToken });
  
  if (!verifyToken) {
    console.error('[WhatsApp] META_WEBHOOK_VERIFY_TOKEN not configured');
    return { verified: false };
  }

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WhatsApp] Webhook verified successfully');
    return { verified: true, challenge };
  }

  console.log('[WhatsApp] Verification failed:', { modeMatch: mode === 'subscribe', tokenMatch: token === verifyToken });
  return { verified: false };
};

// Export all functions
module.exports = {
  verifyWebhookSignature,
  normalizePhoneNumber,
  sendWhatsAppMessage,
  sendTemplateMessage,
  isAvailabilityQuestion,
  generateCoachBookingLink,
  generateScheduleLink,
  createAvailabilityAutoReply,
  extractMessageFromWebhook,
  handleWebhookVerification,
};

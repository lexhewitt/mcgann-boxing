/**
 * WhatsApp Business Cloud API Service
 * Uses Meta (Facebook) WhatsApp Cloud API for sending and receiving messages
 * 
 * Migration from Twilio to Meta Cloud API
 */

import crypto from 'crypto';

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
export const verifyWebhookSignature = (
  payload: string | Buffer,
  signature: string | undefined
): boolean => {
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
export const normalizePhoneNumber = (phone: string): string | null => {
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
 * 
 * @param to - Recipient phone number (E.164 format)
 * @param message - Message text
 * @param options - Optional parameters
 */
export const sendWhatsAppMessage = async (
  to: string,
  message: string,
  options?: { 
    templateName?: string;
    templateParams?: string[];
    isWithin24HourWindow?: boolean;
  }
): Promise<{ success: boolean; error?: string; messageId?: string }> => {
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
    
    let payload: any;

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
  } catch (error: any) {
    console.error('[WhatsApp] Error sending message:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Sends a message using an approved template
 * Use this for messages outside the 24-hour window
 */
export const sendTemplateMessage = async (
  to: string,
  templateName: string,
  templateParams?: string[]
): Promise<{ success: boolean; error?: string }> => {
  return sendWhatsAppMessage(to, '', {
    templateName,
    templateParams,
    isWithin24HourWindow: false,
  });
};

/**
 * Detects if a message is asking about availability
 */
export const isAvailabilityQuestion = (message: string): boolean => {
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
export const generateCoachBookingLink = (
  coachId: string,
  baseUrl: string = process.env.FRONTEND_URL || ''
): string => {
  return `${baseUrl}/book?coach=${coachId}`;
};

/**
 * Generates a monthly schedule calendar link
 */
export const generateScheduleLink = (
  coachId?: string,
  baseUrl: string = process.env.FRONTEND_URL || ''
): string => {
  const params = new URLSearchParams();
  if (coachId) {
    params.set('coach', coachId);
  }
  params.set('view', 'calendar');
  return `${baseUrl}/book?${params.toString()}`;
};

/**
 * Creates an auto-reply message for availability questions
 */
export const createAvailabilityAutoReply = (
  coachName: string,
  bookingLink: string
): string => {
  return `Hi! Thanks for your message about ${coachName}'s availability. 

📅 View our monthly schedule and book online:
${bookingLink}

You can:
• Continue as a guest and book a class or private 1-on-1 session
• Become a member for easier booking and member benefits

Reply with "BOOK" if you need help, or click the link above to see all available times! 🥊`;
};

/**
 * Meta Webhook Payload Types
 */
export interface MetaWebhookEntry {
  id: string;
  changes: Array<{
    value: {
      messaging_product: string;
      metadata: {
        display_phone_number: string;
        phone_number_id: string;
      };
      contacts?: Array<{
        profile: {
          name: string;
        };
        wa_id: string;
      }>;
      messages?: Array<{
        from: string;
        id: string;
        timestamp: string;
        type: string;
        text?: {
          body: string;
        };
        image?: any;
        video?: any;
        audio?: any;
        document?: any;
      }>;
      statuses?: Array<{
        id: string;
        status: string;
        timestamp: string;
        recipient_id: string;
      }>;
    };
    field: string;
  }>;
}

export interface MetaWebhookPayload {
  object: string;
  entry: MetaWebhookEntry[];
}

/**
 * Extracts message text from Meta webhook payload
 */
export const extractMessageFromWebhook = (
  payload: MetaWebhookPayload
): { from: string; text: string; messageId: string } | null => {
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

  return {
    from: message.from,
    text: message.text.body,
    messageId: message.id,
  };
};

/**
 * Handles webhook verification (GET request from Meta)
 */
export const handleWebhookVerification = (
  mode: string | undefined,
  token: string | undefined,
  challenge: string | undefined
): { verified: boolean; challenge?: string } => {
  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
  
  if (!verifyToken) {
    console.error('[WhatsApp] META_WEBHOOK_VERIFY_TOKEN not configured');
    return { verified: false };
  }

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WhatsApp] Webhook verified successfully');
    return { verified: true, challenge };
  }

  return { verified: false };
};

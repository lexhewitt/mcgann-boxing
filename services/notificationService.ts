/**
 * Sends a WhatsApp notification
 * In the browser, this calls the server API endpoint
 * On the server, this would use the WhatsApp service directly
 */
export const sendWhatsAppNotification = async (
  to: string | undefined,
  body: string
): Promise<void> => {
  if (!to) {
    console.log('[WhatsApp] Missing recipient:', body);
    return;
  }

  // In browser environment, call server API
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch('/server-api/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, message: body }),
      });
      if (!response.ok) {
        console.error(`[WhatsApp] Failed to send to ${to}:`, await response.text());
      }
    } catch (error) {
      console.error(`[WhatsApp] Error sending to ${to}:`, error);
    }
  } else {
    // Server-side: use WhatsApp service directly
    // This will be handled by server.js which imports whatsappService.js
    console.log(`[WhatsApp] -> ${to}: ${body}`);
  }
};

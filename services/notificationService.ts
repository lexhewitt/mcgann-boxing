export const sendWhatsAppNotification = (to: string | undefined, body: string) => {
  if (!to) {
    console.log('[WhatsApp] Missing recipient:', body);
    return;
  }
  console.log(`[WhatsApp] -> ${to}: ${body}`);
};

import React, { useState } from 'react';
import { Coach } from '../../types';
import Button from '../ui/Button';

interface WhatsAppControlPanelProps {
  coach: Coach;
  onUpdateCoach: (coach: Coach) => Promise<void>;
}

const WhatsAppControlPanel: React.FC<WhatsAppControlPanelProps> = ({ coach, onUpdateCoach }) => {
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(coach.whatsappAutoReplyEnabled ?? true);
  const [customAutoReplyMessage, setCustomAutoReplyMessage] = useState(coach.whatsappAutoReplyMessage || '');
  const [savingMessage, setSavingMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleToggleAutoReply = async (enabled: boolean) => {
    setAutoReplyEnabled(enabled);
    const updatedCoach = { ...coach, whatsappAutoReplyEnabled: enabled };
    try {
      await onUpdateCoach(updatedCoach);
      setStatus({ type: 'success', message: `Auto-reply ${enabled ? 'enabled' : 'disabled'}` });
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      setAutoReplyEnabled(!enabled); // Revert on error
      setStatus({ type: 'error', message: 'Failed to update setting' });
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const handleSaveCustomMessage = async () => {
    setSavingMessage(true);
    setStatus(null);
    
    const updatedCoach = { 
      ...coach, 
      whatsappAutoReplyMessage: customAutoReplyMessage.trim() || undefined 
    };
    
    try {
      await onUpdateCoach(updatedCoach);
      setStatus({ type: 'success', message: 'Custom auto-reply message saved!' });
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to save message' });
      setTimeout(() => setStatus(null), 3000);
    } finally {
      setSavingMessage(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !recipientPhone.trim()) {
      setStatus({ type: 'error', message: 'Please enter both message and recipient phone number' });
      setTimeout(() => setStatus(null), 3000);
      return;
    }

    setSending(true);
    setStatus(null);

    try {
      const response = await fetch('/server-api/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientPhone,
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus({ type: 'success', message: 'Message sent successfully!' });
        setMessage('');
        setRecipientPhone('');
        setTimeout(() => setStatus(null), 3000);
      } else {
        setStatus({ type: 'error', message: data.error || 'Failed to send message' });
        setTimeout(() => setStatus(null), 5000);
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Network error. Please try again.' });
      setTimeout(() => setStatus(null), 5000);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white mb-4">WhatsApp Control</h2>
        <p className="text-gray-400 text-sm mb-6">
          Manage your WhatsApp auto-replies and send personal messages to clients.
        </p>
      </div>

      {/* Auto-Reply Toggle */}
      <div className="bg-brand-dark p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Auto-Reply</h3>
            <p className="text-gray-400 text-sm">
              When enabled, the system will automatically reply to availability questions with a booking link.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoReplyEnabled}
              onChange={(e) => handleToggleAutoReply(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-red/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-red"></div>
            <span className="ml-3 text-sm font-medium text-gray-300">
              {autoReplyEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>
        {status && status.type === 'success' && status.message.includes('Auto-reply') && (
          <div className="mt-4 p-3 bg-green-900/30 border border-green-700 rounded text-green-300 text-sm">
            {status.message}
          </div>
        )}
      </div>

      {/* Custom Auto-Reply Message */}
      <div className="bg-brand-dark p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-2">Custom Auto-Reply Message</h3>
        <p className="text-gray-400 text-sm mb-4">
          Personalize your auto-reply message for availability questions. Use <code className="bg-gray-800 px-1 rounded">{'{bookingLink}'}</code> where you want the booking link to appear. Leave empty to use the default message.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Custom Message
            </label>
            <textarea
              value={customAutoReplyMessage}
              onChange={(e) => setCustomAutoReplyMessage(e.target.value)}
              placeholder="Hi! Thanks for your message about my availability. 

📅 View my schedule and book online:
{bookingLink}

Reply with 'BOOK' if you need help! 🥊"
              rows={8}
              className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-brand-red focus:outline-none resize-none font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              {customAutoReplyMessage.length} characters • Use {'{bookingLink}'} for the booking link
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSaveCustomMessage}
              disabled={savingMessage}
              className="flex-1"
            >
              {savingMessage ? 'Saving...' : 'Save Custom Message'}
            </Button>
            <Button
              onClick={() => {
                setCustomAutoReplyMessage('');
                handleSaveCustomMessage();
              }}
              disabled={savingMessage}
              variant="secondary"
            >
              Reset to Default
            </Button>
          </div>

          {status && status.type === 'success' && status.message.includes('Custom auto-reply') && (
            <div className="p-3 bg-green-900/30 border border-green-700 rounded text-green-300 text-sm">
              {status.message}
            </div>
          )}
        </div>
      </div>

      {/* Send Personal Message */}
      <div className="bg-brand-dark p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Send Personal Message</h3>
        <p className="text-gray-400 text-sm mb-4">
          Send a WhatsApp message to a client. Use E.164 format (e.g., +447123456789) or UK format (07123456789).
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Recipient Phone Number
            </label>
            <input
              type="text"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="+447123456789 or 07123456789"
              className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-brand-red focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={5}
              className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-brand-red focus:outline-none resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length} characters
            </p>
          </div>

          {status && (
            <div
              className={`p-3 rounded text-sm ${
                status.type === 'success'
                  ? 'bg-green-900/30 border border-green-700 text-green-300'
                  : 'bg-red-900/30 border border-red-700 text-red-300'
              }`}
            >
              {status.message}
            </div>
          )}

          <Button
            onClick={handleSendMessage}
            disabled={sending || !message.trim() || !recipientPhone.trim()}
            className="w-full"
          >
            {sending ? 'Sending...' : 'Send Message'}
          </Button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-700 p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-300 mb-2">💡 Tips</h4>
        <ul className="text-xs text-blue-200 space-y-1 list-disc list-inside">
          <li>Messages are sent within the 24-hour window, so you can use free-form text</li>
          <li>Phone numbers are automatically normalized to E.164 format</li>
          <li>When auto-reply is disabled, you'll need to manually respond to availability questions</li>
          <li>Your mobile number: <strong>{coach.mobileNumber || 'Not set'}</strong></li>
        </ul>
      </div>
    </div>
  );
};

export default WhatsAppControlPanel;


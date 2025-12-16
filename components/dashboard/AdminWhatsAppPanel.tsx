import React, { useState, useEffect } from 'react';
import { Coach } from '../../types';
import { useData } from '../../context/DataContext';
import Button from '../ui/Button';
import StatCard from '../ui/StatCard';

const AdminWhatsAppPanel: React.FC = () => {
  const { coaches, updateCoach } = useData();
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [message, setMessage] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [testing, setTesting] = useState(false);

  // Statistics
  const coachesWithAutoReply = coaches.filter(c => c.whatsappAutoReplyEnabled !== false).length;
  const coachesWithMobile = coaches.filter(c => c.mobileNumber && c.mobileNumber.trim() !== '').length;
  const coachesWithCustomMessage = coaches.filter(c => c.whatsappAutoReplyMessage && c.whatsappAutoReplyMessage.trim() !== '').length;

  const handleToggleCoachAutoReply = async (coach: Coach, enabled: boolean) => {
    const updatedCoach = { ...coach, whatsappAutoReplyEnabled: enabled };
    try {
      await updateCoach(updatedCoach);
      setStatus({ type: 'success', message: `${coach.name}'s auto-reply ${enabled ? 'enabled' : 'disabled'}` });
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      setStatus({ type: 'error', message: `Failed to update ${coach.name}'s setting` });
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const handleSendMessage = async (coachId?: string) => {
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
          coachId: coachId || undefined,
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

  const handleTestMessage = async () => {
    if (!testMessage.trim() || !testPhone.trim()) {
      setStatus({ type: 'error', message: 'Please enter both test message and phone number' });
      setTimeout(() => setStatus(null), 3000);
      return;
    }

    setTesting(true);
    setStatus(null);

    try {
      const response = await fetch('/server-api/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testPhone,
          message: testMessage.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus({ type: 'success', message: 'Test message sent successfully! Check your phone.' });
        setTestMessage('');
        setTimeout(() => setStatus(null), 5000);
      } else {
        setStatus({ type: 'error', message: data.error || 'Failed to send test message' });
        setTimeout(() => setStatus(null), 5000);
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Network error. Please try again.' });
      setTimeout(() => setStatus(null), 5000);
    } finally {
      setTesting(false);
    }
  };

  const handleBulkToggle = async (enabled: boolean) => {
    const updates = coaches.map(coach => ({
      ...coach,
      whatsappAutoReplyEnabled: enabled,
    }));

    try {
      await Promise.all(updates.map(updateCoach));
      setStatus({ 
        type: 'success', 
        message: `Auto-reply ${enabled ? 'enabled' : 'disabled'} for all coaches` 
      });
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to update all coaches' });
      setTimeout(() => setStatus(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white mb-2">WhatsApp Management</h2>
        <p className="text-gray-400 text-sm">
          Manage WhatsApp auto-replies for all coaches and send messages on behalf of any coach.
        </p>
      </div>

      {status && (
        <div
          className={`p-4 rounded-lg ${
            status.type === 'success'
              ? 'bg-green-900/30 border border-green-700 text-green-300'
              : 'bg-red-900/30 border border-red-700 text-red-300'
          }`}
        >
          {status.message}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Coaches"
          value={coaches.length}
          subtitle={`${coachesWithMobile} with mobile numbers`}
        />
        <StatCard
          title="Auto-Reply Enabled"
          value={coachesWithAutoReply}
          subtitle={`${coaches.length - coachesWithAutoReply} disabled`}
        />
        <StatCard
          title="Custom Messages"
          value={coachesWithCustomMessage}
          subtitle={`${coaches.length - coachesWithCustomMessage} using default`}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-brand-dark p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => handleBulkToggle(true)}
          >
            Enable Auto-Reply for All
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleBulkToggle(false)}
          >
            Disable Auto-Reply for All
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.open('https://developers.facebook.com/apps', '_blank')}
          >
            Open Meta Developer Portal
          </Button>
        </div>
      </div>

      {/* Coach Management */}
      <div className="bg-brand-dark p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Coach Settings</h3>
        <div className="space-y-4">
          {coaches.map(coach => (
            <div
              key={coach.id}
              className="bg-gray-800 p-4 rounded-lg border border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-white font-semibold">{coach.name}</h4>
                    <span className="text-xs text-gray-400">({coach.level})</span>
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-gray-400">
                    <p>
                      <strong>Mobile:</strong> {coach.mobileNumber || (
                        <span className="text-red-400">Not set</span>
                      )}
                    </p>
                    <p>
                      <strong>Auto-Reply:</strong>{' '}
                      <span className={coach.whatsappAutoReplyEnabled !== false ? 'text-green-400' : 'text-red-400'}>
                        {coach.whatsappAutoReplyEnabled !== false ? 'Enabled' : 'Disabled'}
                      </span>
                    </p>
                    {coach.whatsappAutoReplyMessage && (
                      <p>
                        <strong>Custom Message:</strong>{' '}
                        <span className="text-gray-300 text-xs">
                          {coach.whatsappAutoReplyMessage.substring(0, 50)}...
                        </span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={coach.whatsappAutoReplyEnabled !== false}
                      onChange={(e) => handleToggleCoachAutoReply(coach, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-red/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-red"></div>
                  </label>
                  <Button
                    variant="secondary"
                    onClick={() => setSelectedCoach(coach)}
                  >
                    Send Message
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Send Message on Behalf of Coach */}
      {selectedCoach && (
        <div className="bg-brand-dark p-6 rounded-lg border-2 border-brand-red">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">
              Send Message as {selectedCoach.name}
            </h3>
            <Button variant="secondary" onClick={() => setSelectedCoach(null)}>
              Close
            </Button>
          </div>
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
              <p className="text-xs text-gray-500 mt-1">{message.length} characters</p>
            </div>
            <Button
              onClick={() => handleSendMessage(selectedCoach.id)}
              disabled={sending || !message.trim() || !recipientPhone.trim()}
              className="w-full"
            >
              {sending ? 'Sending...' : `Send as ${selectedCoach.name}`}
            </Button>
          </div>
        </div>
      )}

      {/* Test WhatsApp Connection */}
      <div className="bg-brand-dark p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Test WhatsApp Connection</h3>
        <p className="text-gray-400 text-sm mb-4">
          Send a test message to verify WhatsApp is working correctly. Use your own phone number to test.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Phone Number (for testing)
            </label>
            <input
              type="text"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="+447123456789 or 07123456789"
              className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-brand-red focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Test Message
            </label>
            <textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="This is a test message from Fleetwood Boxing Gym WhatsApp system..."
              rows={4}
              className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 focus:border-brand-red focus:outline-none resize-none"
            />
          </div>
          <Button
            onClick={handleTestMessage}
            disabled={testing || !testMessage.trim() || !testPhone.trim()}
            className="w-full"
          >
            {testing ? 'Sending Test...' : 'Send Test Message'}
          </Button>
        </div>
      </div>

      {/* Configuration Info */}
      <div className="bg-blue-900/20 border border-blue-700 p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-300 mb-2">📋 Configuration Status</h4>
        <ul className="text-xs text-blue-200 space-y-1">
          <li>✅ WhatsApp API configured and connected</li>
          <li>✅ Webhook endpoint: <code className="bg-black/50 px-1 rounded">/server-api/whatsapp-webhook</code></li>
          <li>✅ Auto-reply system active for {coachesWithAutoReply} coach(es)</li>
          <li>
            {coachesWithMobile === coaches.length ? '✅' : '⚠️'} {coachesWithMobile} of {coaches.length} coaches have mobile numbers set
          </li>
          <li>💡 Coaches without mobile numbers won't receive auto-replies</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminWhatsAppPanel;




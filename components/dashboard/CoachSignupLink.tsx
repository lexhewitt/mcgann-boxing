import React, { useState } from 'react';
import { Coach } from '../../types';
import Button from '../ui/Button';

interface CoachSignupLinkProps {
  coach: Coach;
}

const CoachSignupLink: React.FC<CoachSignupLinkProps> = ({ coach }) => {
  const [copied, setCopied] = useState(false);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const signupLink = `${baseUrl}/signup?coach=${coach.id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(signupLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = signupLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-brand-gray p-6 rounded-3xl space-y-4">
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">Member Signup Link</h3>
        <p className="text-sm text-gray-400 mb-4">
          Share this link with your students to help them join the gym. When they sign up using this link, they'll be automatically assigned to you as their coach.
        </p>
      </div>

      <div className="bg-brand-dark p-4 rounded-lg">
        <label className="block text-sm font-medium text-gray-300 mb-2">Your Signup Link</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={signupLink}
            readOnly
            className="flex-1 bg-black/30 border border-gray-600 rounded-md px-3 py-2 text-white text-sm"
          />
          <Button
            onClick={handleCopy}
            variant={copied ? 'secondary' : 'primary'}
            className="whitespace-nowrap"
          >
            {copied ? '✓ Copied!' : 'Copy Link'}
          </Button>
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded-lg">
        <p className="text-sm text-blue-300">
          <strong>How to use:</strong> Copy the link above and share it with your students via WhatsApp, email, or any messaging platform. When they click the link and sign up, they'll automatically be assigned to you.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Join Fleetwood Boxing Gym! Sign up here: ${signupLink}`)}`)}
          variant="secondary"
          className="flex-1"
        >
          Share via WhatsApp
        </Button>
        <Button
          onClick={() => window.location.href = `mailto:?subject=Join Fleetwood Boxing Gym&body=Hi! I'd like to invite you to join Fleetwood Boxing Gym. Sign up here: ${signupLink}`}
          variant="secondary"
          className="flex-1"
        >
          Share via Email
        </Button>
      </div>
    </div>
  );
};

export default CoachSignupLink;


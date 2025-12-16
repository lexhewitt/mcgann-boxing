import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email) {
      setError('Please enter your email address');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/server-api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to send reset email. Please try again.');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('Network error. Please try again.');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reset Password">
      {success ? (
        <div className="space-y-4">
          <div className="bg-green-900/20 border border-green-500 text-green-300 p-4 rounded-lg">
            <p className="font-semibold mb-2">Reset email sent!</p>
            <p className="text-sm">
              If an account exists with {email}, you will receive an email with instructions to reset your password.
            </p>
          </div>
          <Button onClick={handleClose} className="w-full">
            Close
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-sm bg-red-900/20 p-2 rounded">{error}</p>}
          <p className="text-gray-400 text-sm">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          <Input
            label="Email"
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="e.g., sean@fleetwoodboxing.co.uk"
            autoComplete="email"
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>
          <p className="text-center text-sm text-gray-400">
            Remember your password?{' '}
            <button type="button" onClick={() => { handleClose(); onSwitchToLogin(); }} className="font-semibold text-brand-red hover:underline">
              Back to Login
            </button>
          </p>
        </form>
      )}
    </Modal>
  );
};

export default ForgotPasswordModal;


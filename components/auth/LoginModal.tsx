
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = login(email);
    if (success) {
      onClose();
    } else {
      setError('Invalid email. No password needed for this demo.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Member Login">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <p className="text-gray-400 text-sm">Use a pre-filled email or one you register with. No password required for this demo.</p>
        <Input
          label="Email"
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="e.g., sean@fleetwoodboxing.co.uk"
        />
        <Button type="submit" className="w-full">
          Login
        </Button>
        <p className="text-center text-sm text-gray-400">
          Not a member?{' '}
          <button type="button" onClick={onSwitchToRegister} className="font-semibold text-brand-red hover:underline">
            Join Now
          </button>
        </p>
      </form>
    </Modal>
  );
};

export default LoginModal;
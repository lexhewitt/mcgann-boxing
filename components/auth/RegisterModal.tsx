import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { calculateAge } from '../../utils/helpers';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, onSwitchToLogin }) => {
  const { registerMember } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dob: '',
    sex: 'M',
    ability: 'Beginner',
    bio: '',
    coachId: null,
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.dob) {
      setError('Date of Birth is required.');
      return;
    }

    const age = calculateAge(formData.dob);
    if (age < 18) {
      setError('You must be 18 or older to create an account.');
      return;
    }

    // FIX: Added the required `membershipStatus` property with a default value of 'PAYG' for new registrations.
    const user = registerMember({
        ...formData,
        sex: formData.sex as 'M' | 'F',
        ability: formData.ability as 'Beginner' | 'Intermediate' | 'Advanced' | 'Competitive',
        membershipStatus: 'PAYG',
    });
    if (user) {
      onClose();
    } else {
      setError('Registration failed. Email might be taken.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join the Gym">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Input label="Full Name" id="name" name="name" type="text" onChange={handleChange} required />
        <Input label="Email" id="email" name="email" type="email" onChange={handleChange} required />
        <Input label="Date of Birth" id="dob" name="dob" type="date" onChange={handleChange} required />
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Sex</label>
            <select name="sex" onChange={handleChange} className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white">
                <option value="M">Male</option>
                <option value="F">Female</option>
            </select>
        </div>
        <Button type="submit" className="w-full">
          Register
        </Button>
        <p className="text-center text-sm text-gray-400">
          Already a member?{' '}
          <button type="button" onClick={onSwitchToLogin} className="font-semibold text-brand-red hover:underline">
            Login
          </button>
        </p>
      </form>
    </Modal>
  );
};

export default RegisterModal;

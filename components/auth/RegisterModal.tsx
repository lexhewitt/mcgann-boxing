import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { calculateAge } from '../../utils/helpers';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  coachId?: string | null;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, onSwitchToLogin, coachId: propCoachId }) => {
  const { registerMember } = useAuth();
  const { coaches } = useData();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    dob: '',
    sex: 'M',
    ability: 'Beginner',
    bio: '',
    coachId: null as string | null,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Set coachId from prop or URL parameter
  useEffect(() => {
    if (propCoachId) {
      setFormData(prev => ({ ...prev, coachId: propCoachId }));
    } else {
      // Check URL for coach parameter
      const params = new URLSearchParams(window.location.search);
      const coachParam = params.get('coach');
      if (coachParam) {
        setFormData(prev => ({ ...prev, coachId: coachParam }));
      }
    }
  }, [propCoachId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!formData.dob) {
      setError('Date of Birth is required.');
      setIsLoading(false);
      return;
    }

    if (!formData.password) {
      setError('Password is required.');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    const age = calculateAge(formData.dob);
    if (age < 18) {
      setError('You must be 18 or older to create an account.');
      setIsLoading(false);
      return;
    }

    const result = await registerMember({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        dob: formData.dob,
        sex: formData.sex as 'M' | 'F',
        ability: formData.ability as 'Beginner' | 'Intermediate' | 'Advanced' | 'Competitive',
        bio: formData.bio,
        membershipStatus: 'PAYG',
        coachId: formData.coachId,
    });

    if (result.success) {
      onClose();
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        dob: '',
        sex: 'M',
        ability: 'Beginner',
        bio: '',
        coachId: null,
      });
    } else {
      setError(result.error || 'Registration failed. Email might be taken.');
    }
    setIsLoading(false);
  };

  const selectedCoach = coaches.find(c => c.id === formData.coachId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join the Gym">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-500 text-sm bg-red-900/20 p-2 rounded">{error}</p>}
        
        {selectedCoach && (
          <div className="bg-brand-dark p-3 rounded-lg mb-4">
            <p className="text-sm text-gray-300 mb-1">Signing up with:</p>
            <p className="text-lg font-semibold text-brand-red">{selectedCoach.name}</p>
            {selectedCoach.level && (
              <p className="text-xs text-gray-400 mt-1">{selectedCoach.level}</p>
            )}
          </div>
        )}

        <Input label="Full Name" id="name" name="name" type="text" value={formData.name} onChange={handleChange} required />
        <Input label="Email" id="email" name="email" type="email" value={formData.email} onChange={handleChange} required autoComplete="email" />
        <Input label="Password" id="password" name="password" type="password" value={formData.password} onChange={handleChange} required autoComplete="new-password" placeholder="At least 6 characters" />
        <Input label="Confirm Password" id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required autoComplete="new-password" />
        <Input label="Date of Birth" id="dob" name="dob" type="date" value={formData.dob} onChange={handleChange} required />
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Sex</label>
            <select name="sex" value={formData.sex} onChange={handleChange} className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white">
                <option value="M">Male</option>
                <option value="F">Female</option>
            </select>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Ability Level</label>
            <select name="ability" value={formData.ability} onChange={handleChange} className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white">
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Competitive">Competitive</option>
            </select>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Registering...' : 'Register'}
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

import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { calculateAge } from '../../utils/helpers';

const SignupPage: React.FC = () => {
  const { registerMember } = useAuth();
  const { coaches } = useData();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dob: '',
    sex: 'M' as 'M' | 'F',
    ability: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced' | 'Competitive',
    bio: '',
    coachId: null as string | null,
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get coach from URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const coachParam = params.get('coach');
    
    if (coachParam) {
      const coach = coaches.find(c => c.id === coachParam);
      if (coach) {
        setFormData(prev => ({ ...prev, coachId: coach.id }));
      }
    }
  }, [coaches]);

  const selectedCoach = coaches.find(c => c.id === formData.coachId);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!formData.dob) {
      setError('Date of Birth is required.');
      setIsSubmitting(false);
      return;
    }

    const age = calculateAge(formData.dob);
    if (age < 18) {
      setError('You must be 18 or older to create an account.');
      setIsSubmitting(false);
      return;
    }

    try {
      const user = registerMember({
        ...formData,
        sex: formData.sex,
        ability: formData.ability,
        membershipStatus: 'PAYG',
        coachId: formData.coachId || null,
      });
      
      if (user) {
        // Redirect to dashboard after successful registration
        window.location.href = '/';
      } else {
        setError('Registration failed. Email might be taken.');
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-brand-gray rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Join Fleetwood Boxing Gym</h1>
          {selectedCoach && (
            <div className="mt-4 p-4 bg-brand-dark rounded-lg">
              <p className="text-sm text-gray-300 mb-1">Signing up with:</p>
              <p className="text-xl font-semibold text-brand-red">{selectedCoach.name}</p>
              {selectedCoach.level && (
                <p className="text-sm text-gray-400 mt-1">{selectedCoach.level}</p>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-300 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Input 
            label="Full Name" 
            id="name" 
            name="name" 
            type="text" 
            value={formData.name}
            onChange={handleChange} 
            required 
          />
          
          <Input 
            label="Email" 
            id="email" 
            name="email" 
            type="email" 
            value={formData.email}
            onChange={handleChange} 
            required 
          />
          
          <Input 
            label="Date of Birth" 
            id="dob" 
            name="dob" 
            type="date" 
            value={formData.dob}
            onChange={handleChange} 
            required 
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Sex</label>
            <select 
              name="sex" 
              value={formData.sex}
              onChange={handleChange} 
              className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white"
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Ability Level</label>
            <select 
              name="ability" 
              value={formData.ability}
              onChange={handleChange} 
              className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Competitive">Competitive</option>
            </select>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </Button>

          <p className="text-center text-sm text-gray-400">
            Already a member?{' '}
            <button 
              type="button" 
              onClick={() => window.location.href = '/'} 
              className="font-semibold text-brand-red hover:underline"
            >
              Login
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;


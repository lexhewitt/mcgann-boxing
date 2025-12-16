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
    password: '',
    confirmPassword: '',
    dob: '',
    sex: 'M' as 'M' | 'F',
    ability: 'Novice' as 'Novice' | 'Intermediate' | 'Advanced' | 'Competitive',
    bio: '',
    coachId: null as string | null,
  });
  const [familyMembers, setFamilyMembers] = useState<Array<{ name: string; dob: string; ability?: string; isCarded?: boolean }>>([]);
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

    if (!formData.password) {
      setError('Password is required.');
      setIsSubmitting(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setIsSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
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
      const result = await registerMember({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        dob: formData.dob,
        sex: formData.sex,
        ability: formData.ability,
        bio: formData.bio,
        membershipStatus: 'PAYG',
        coachId: formData.coachId || null,
        familyMembers: familyMembers.filter(fm => fm.name && fm.dob), // Only include valid family members
      });
      
      if (result.success) {
        // Redirect to dashboard after successful registration
        window.location.href = '/';
      } else {
        setError(result.error || 'Registration failed. Email might be taken.');
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
              <option value="Novice">Novice</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Competitive">Competitive</option>
            </select>
          </div>

          {/* Family Members Section */}
          <div className="border-t border-gray-700 pt-4 mt-4">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-300">
                Family Members (Optional)
              </label>
              <Button
                type="button"
                variant="secondary"
                className="text-xs py-1 px-3"
                onClick={() => setFamilyMembers([...familyMembers, { name: '', dob: '', ability: 'Novice', isCarded: false }])}
              >
                + Add Child
              </Button>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Add children under 18 who will attend classes. You'll be able to book classes for them and pay on their behalf.
            </p>
            
            {familyMembers.map((fm, index) => {
              const age = fm.dob ? calculateAge(fm.dob) : null;
              
              return (
                <div key={index} className="bg-brand-dark p-3 rounded-lg mb-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-semibold text-white">Child {index + 1}</h4>
                    <Button
                      type="button"
                      variant="danger"
                      className="text-xs py-1 px-2"
                      onClick={() => setFamilyMembers(familyMembers.filter((_, i) => i !== index))}
                    >
                      Remove
                    </Button>
                  </div>
                  <Input
                    label="Child's Name"
                    id={`family-name-${index}`}
                    type="text"
                    value={fm.name}
                    onChange={(e) => {
                      const updated = [...familyMembers];
                      updated[index].name = e.target.value;
                      setFamilyMembers(updated);
                    }}
                    placeholder="Child's full name"
                  />
                  <Input
                    label="Child's Date of Birth"
                    id={`family-dob-${index}`}
                    type="date"
                    value={fm.dob}
                    onChange={(e) => {
                      const updated = [...familyMembers];
                      updated[index].dob = e.target.value;
                      setFamilyMembers(updated);
                    }}
                    placeholder="Date of birth"
                  />
                  {fm.dob && age !== null && (
                    <div className="text-xs">
                      {age >= 18 ? (
                        <span className="text-red-400">⚠️ Must be under 18</span>
                      ) : age < 0 ? (
                        <span className="text-red-400">⚠️ Invalid date</span>
                      ) : (
                        <span className="text-green-400">✓ Age: {age} years old</span>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Ability Level (Optional)</label>
                    <select 
                      value={fm.ability || 'Novice'}
                      onChange={(e) => {
                        const updated = [...familyMembers];
                        updated[index].ability = e.target.value;
                        setFamilyMembers(updated);
                      }}
                      className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white"
                    >
                      <option value="Novice">Novice</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Competitive">Competitive</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id={`family-carded-${index}`}
                      checked={fm.isCarded || false}
                      onChange={(e) => {
                        const updated = [...familyMembers];
                        updated[index].isCarded = e.target.checked;
                        setFamilyMembers(updated);
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                    />
                    <label htmlFor={`family-carded-${index}`} className="text-sm text-gray-300">Mark as Carded Boxer (Optional)</label>
                  </div>
                </div>
              );
            })}
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


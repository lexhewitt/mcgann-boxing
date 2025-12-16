import React, { useState, useEffect } from 'react';
import { Coach } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useData } from '../../context/DataContext';

interface CoachProfileEditorProps {
  coach: Coach;
  onClose: () => void;
}

const CoachProfileEditor: React.FC<CoachProfileEditorProps> = ({ coach, onClose }) => {
  const { updateCoach } = useData();
  const [formData, setFormData] = useState<Partial<Coach>>({
    name: coach.name,
    email: coach.email,
    level: coach.level,
    bio: coach.bio,
    mobileNumber: coach.mobileNumber || '',
    bankDetails: coach.bankDetails || '',
  });
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    if (!formData.name || !formData.email || !formData.level) {
      setError("Name, Email, and Level are required.");
      setIsSaving(false);
      return;
    }

    try {
      const updatedCoach: Coach = {
        ...coach,
        ...formData,
      };
      await updateCoach(updatedCoach);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-brand-dark p-6 rounded-lg">
      <h3 className="text-xl font-semibold text-white mb-4">Edit Profile</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-600 rounded text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          id="profile-name"
          name="name"
          type="text"
          value={formData.name || ''}
          onChange={handleChange}
          required
        />

        <Input
          label="Email"
          id="profile-email"
          name="email"
          type="email"
          value={formData.email || ''}
          onChange={handleChange}
          required
        />

        <Input
          label="Level"
          id="profile-level"
          name="level"
          type="text"
          value={formData.level || ''}
          onChange={handleChange}
          required
          placeholder="e.g., Level 2 Coach"
        />

        <div>
          <label htmlFor="profile-bio" className="block text-sm font-medium text-gray-300 mb-1">
            Bio
          </label>
          <textarea
            id="profile-bio"
            name="bio"
            value={formData.bio || ''}
            onChange={handleChange}
            rows={4}
            className="w-full bg-brand-gray border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-red"
            placeholder="Tell us about yourself..."
          />
        </div>

        <Input
          label="Mobile Number"
          id="profile-mobile"
          name="mobileNumber"
          type="text"
          value={formData.mobileNumber || ''}
          onChange={handleChange}
          placeholder="e.g., 07123456789 or +447123456789"
          helpText="Required for WhatsApp auto-reply to work. Use UK format (07123456789) or international (+447123456789)"
        />

        <Input
          label="Bank Details"
          id="profile-bank"
          name="bankDetails"
          type="text"
          value={formData.bankDetails || ''}
          onChange={handleChange}
          placeholder="e.g., 12-34-56 12345678"
        />

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CoachProfileEditor;




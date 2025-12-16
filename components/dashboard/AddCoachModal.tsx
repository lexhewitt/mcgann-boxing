
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { UserRole, Coach, AdminLevel } from '../../types';
import { canManageAdmins, isAnyAdmin } from '../../utils/permissions';

interface AddCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCoachAdded: (coach: Coach) => void;
}

const AddCoachModal: React.FC<AddCoachModalProps> = ({ isOpen, onClose, onCoachAdded }) => {
  const { addCoach, currentUser } = useAuth();
  const initialFormData: Omit<Coach, 'id'> = {
    name: '',
    email: '',
    level: '',
    bio: '',
    imageUrl: `https://picsum.photos/seed/${Date.now()}/400/400`,
    role: UserRole.COACH,
  };
  const [formData, setFormData] = useState<Omit<Coach, 'id'>>(initialFormData);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.level) {
        setError("Name, Email, and Level are required.");
        return;
    }
    
    const newCoach = addCoach(formData);
    
    if (newCoach) {
      setFormData(initialFormData);
      onCoachAdded(newCoach);
    } else {
      setError('A user with this email already exists.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Coach">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-500 text-sm bg-red-900/20 p-2 rounded">{error}</p>}
        <Input label="Full Name" id="add-coach-name" name="name" type="text" value={formData.name} onChange={handleChange} required />
        <Input label="Email" id="add-coach-email" name="email" type="email" value={formData.email} onChange={handleChange} required />
        <Input label="Level" id="add-coach-level" name="level" type="text" value={formData.level} onChange={handleChange} required placeholder="e.g., Level 1 Coach" />
        <Input label="Image URL" id="add-coach-image" name="imageUrl" type="text" value={formData.imageUrl} onChange={handleChange} />
        <div>
          <label htmlFor="add-coach-role" className="block text-sm font-medium text-gray-300 mb-1">Role</label>
          <select id="add-coach-role" name="role" value={formData.role} onChange={handleChange} className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white">
            <option value={UserRole.COACH}>Coach</option>
            <option value={UserRole.ADMIN}>Admin</option>
          </select>
        </div>
        {formData.role === UserRole.ADMIN && isAnyAdmin(currentUser) && (
          <div>
            <label htmlFor="add-coach-admin-level" className="block text-sm font-medium text-gray-300 mb-1">Admin Level</label>
            <select 
              id="add-coach-admin-level" 
              name="adminLevel" 
              value={formData.adminLevel || AdminLevel.STANDARD_ADMIN} 
              onChange={(e) => setFormData(prev => ({ ...prev, adminLevel: e.target.value as AdminLevel || undefined }))} 
              className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white"
            >
              <option value={AdminLevel.STANDARD_ADMIN}>Standard Admin (Cannot delete)</option>
              {canManageAdmins(currentUser) && (
                <>
                  <option value={AdminLevel.FULL_ADMIN}>Full Admin (Can delete, cannot manage admins)</option>
                  <option value={AdminLevel.SUPERADMIN}>Super Admin (Full access)</option>
                </>
              )}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              {formData.adminLevel === AdminLevel.STANDARD_ADMIN || !formData.adminLevel ? 'Cannot delete members, coaches, classes, or sessions' :
               formData.adminLevel === AdminLevel.FULL_ADMIN ? 'Can delete but cannot create/manage other admins' :
               'Full access including creating/managing admins'}
            </p>
            {!canManageAdmins(currentUser) && (
              <p className="text-xs text-yellow-400 mt-1">
                Note: Only Super Admins can create Full Admins or Super Admins. You can create Standard Admins.
              </p>
            )}
          </div>
        )}
        <div>
            <label htmlFor="add-coach-bio" className="block text-sm font-medium text-gray-300 mb-1">Bio</label>
            <textarea id="add-coach-bio" name="bio" value={formData.bio} onChange={handleChange} rows={3} className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500"></textarea>
        </div>

        <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">Create Coach</Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddCoachModal;

import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { FamilyMember } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface EditFamilyMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyMember: FamilyMember | null;
  parentMemberName: string;
}

const EditFamilyMemberModal: React.FC<EditFamilyMemberModalProps> = ({ isOpen, onClose, familyMember, parentMemberName }) => {
  const { updateFamilyMember } = useData();
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState<FamilyMember | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (familyMember) {
      setFormData({
        ...familyMember,
        ability: familyMember.ability || 'Novice',
        isCarded: familyMember.isCarded || false,
      });
    }
  }, [familyMember]);

  if (!isOpen || !formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    
    setFormData(prev => prev ? {
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value
    } : null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.dob) {
      setError("Name and Date of Birth are required.");
      return;
    }

    if (formData) {
      updateFamilyMember(formData);
      onClose();
    }
  };

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Family Member: ${familyMember?.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-500 text-sm bg-red-900/20 p-2 rounded">{error}</p>}
        
        <div className="bg-brand-dark p-3 rounded-lg mb-4">
          <p className="text-sm text-gray-300 mb-1">Parent:</p>
          <p className="text-lg font-semibold text-brand-red">{parentMemberName}</p>
        </div>

        <Input 
          label="Name" 
          id="edit-fm-name" 
          name="name" 
          type="text" 
          value={formData.name} 
          onChange={handleChange} 
          required 
        />
        <Input 
          label="Date of Birth" 
          id="edit-fm-dob" 
          name="dob" 
          type="date" 
          value={formData.dob} 
          onChange={handleChange} 
          required 
        />
        
        {isAdmin && (
          <>
            <div>
              <label htmlFor="edit-fm-ability" className="block text-sm font-medium text-gray-300 mb-1">Ability Level</label>
              <select 
                id="edit-fm-ability" 
                name="ability" 
                value={formData.ability || 'Novice'} 
                onChange={handleChange} 
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
                id="edit-fm-isCarded"
                name="isCarded"
                checked={!!formData.isCarded}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
              />
              <label htmlFor="edit-fm-isCarded" className="text-sm text-gray-300">Mark as Carded Boxer</label>
            </div>
          </>
        )}

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditFamilyMemberModal;



import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { calculateAge } from '../../utils/helpers';
import { UserRole } from '../../types';

interface AddFamilyMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddFamilyMemberModal: React.FC<AddFamilyMemberModalProps> = ({ isOpen, onClose }) => {
  const { addFamilyMember } = useData();
  const { currentUser } = useAuth();
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [ability, setAbility] = useState<'Novice' | 'Intermediate' | 'Advanced' | 'Competitive'>('Novice');
  const [isCarded, setIsCarded] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !dob) {
      setError("Name and Date of Birth are required.");
      return;
    }
    const age = calculateAge(dob);
    if (age >= 18) {
      setError("Family members must be under 18.");
      return;
    }
     if (age < 0) {
      setError("Please enter a valid date of birth.");
      return;
    }
    if (!currentUser) {
        setError("You must be logged in.");
        return;
    }

    addFamilyMember({
      name,
      dob,
      parentId: currentUser.id,
      ability,
      isCarded,
    });
    
    // Reset form and close
    setName('');
    setDob('');
    setAbility('Novice');
    setIsCarded(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Family Member">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-500 text-sm bg-red-900/20 p-2 rounded">{error}</p>}
        <p className="text-sm text-gray-400">Add a child to your account to book them into children's classes like 'Tiny Tysons'. Must be under 18.</p>
        <Input 
          label="Child's Full Name" 
          id="child-name" 
          type="text" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
        />
        <Input 
          label="Child's Date of Birth" 
          id="child-dob" 
          type="date" 
          value={dob} 
          onChange={(e) => setDob(e.target.value)} 
          required 
        />
        <div>
          <label htmlFor="child-ability" className="block text-sm font-medium text-gray-300 mb-1">Ability Level (Optional)</label>
          <select 
            id="child-ability" 
            value={ability} 
            onChange={(e) => setAbility(e.target.value as 'Novice' | 'Intermediate' | 'Advanced' | 'Competitive')} 
            className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white"
          >
            <option value="Novice">Novice</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Competitive">Competitive</option>
          </select>
        </div>
        {currentUser?.role === UserRole.ADMIN && (
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="child-isCarded"
              checked={isCarded}
              onChange={(e) => setIsCarded(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
            />
            <label htmlFor="child-isCarded" className="text-sm text-gray-300">Mark as Carded Boxer (Admin Only)</label>
          </div>
        )}
        <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">Add Member</Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddFamilyMemberModal;
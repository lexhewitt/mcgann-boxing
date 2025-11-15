
import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { Coach, UserRole } from '../../types';
import AddCoachModal from './AddCoachModal';
import CoachSetupWizard from './CoachSetupWizard';

interface EditCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  coach: Coach | null;
}

const EditCoachModal: React.FC<EditCoachModalProps> = ({ isOpen, onClose, coach }) => {
  const { updateCoach, coaches } = useData();
  const [formData, setFormData] = useState<Coach | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (coach) {
      setFormData(coach);
    }
  }, [coach]);

  if (!isOpen || !formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } as Coach : null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.level) {
      setError("Name, Email, and Level are required.");
      return;
    }
    
    const emailExists = coaches.some(c => c.email.toLowerCase() === formData.email.toLowerCase() && c.id !== formData.id);
    if(emailExists){
        setError('A user with this email already exists.');
        return;
    }

    updateCoach(formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Coach: ${coach?.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-500 text-sm bg-red-900/20 p-2 rounded">{error}</p>}
        <Input label="Full Name" id="edit-coach-name" name="name" type="text" value={formData.name} onChange={handleChange} required />
        <Input label="Email" id="edit-coach-email" name="email" type="email" value={formData.email} onChange={handleChange} required />
        <Input label="Level" id="edit-coach-level" name="level" type="text" value={formData.level} onChange={handleChange} required placeholder="e.g., Level 2 Coach" />
        <Input label="Mobile Number" id="edit-coach-mobile" name="mobileNumber" type="text" value={formData.mobileNumber || ''} onChange={handleChange} placeholder="e.g., 07123456789" />
        <Input label="Bank Details" id="edit-coach-bank" name="bankDetails" type="text" value={formData.bankDetails || ''} onChange={handleChange} placeholder="e.g., 12-34-56 12345678" />
        <Input label="Image URL" id="edit-coach-image" name="imageUrl" type="text" value={formData.imageUrl} onChange={handleChange} />
        <div>
          <label htmlFor="edit-coach-role" className="block text-sm font-medium text-gray-300 mb-1">Role</label>
          <select id="edit-coach-role" name="role" value={formData.role} onChange={handleChange} className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white">
            <option value={UserRole.COACH}>Coach</option>
            <option value={UserRole.ADMIN}>Admin</option>
          </select>
        </div>
        <div>
          <label htmlFor="edit-coach-bio" className="block text-sm font-medium text-gray-300 mb-1">Bio</label>
          <textarea id="edit-coach-bio" name="bio" value={formData.bio} onChange={handleChange} rows={3} className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500"></textarea>
        </div>
        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
};

interface CoachManagementProps {
  onViewCoachDashboard: (coach: Coach) => void;
}

const CoachManagement: React.FC<CoachManagementProps> = ({ onViewCoachDashboard }) => {
  const { coaches, deleteCoach } = useData();
  const { currentUser } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [newlyCreatedCoach, setNewlyCreatedCoach] = useState<Coach | null>(null);
  const [coachToEdit, setCoachToEdit] = useState<Coach | null>(null);

  const handleEditClick = (coach: Coach) => {
    setCoachToEdit(coach);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setCoachToEdit(null);
  };
  
  const handleCoachAdded = (newCoach: Coach) => {
    setIsAddModalOpen(false);
    setNewlyCreatedCoach(newCoach);
    setIsWizardOpen(true);
  };

  const handleWizardClose = () => {
    setIsWizardOpen(false);
    setNewlyCreatedCoach(null);
  }

  return (
    <>
      <div className="overflow-x-auto">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Coaches ({coaches.length})</h3>
            <Button onClick={() => setIsAddModalOpen(true)}>Add New Coach</Button>
        </div>
        <table className="min-w-full bg-brand-dark text-sm">
          <thead className="bg-black">
            <tr>
              <th className="py-2 px-4 text-left">Name</th>
              <th className="py-2 px-4 text-left">Email</th>
              <th className="py-2 px-4 text-left">Level</th>
              <th className="py-2 px-4 text-left">Role</th>
              <th className="py-2 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coaches.map(coach => {
              const isAdmin = currentUser?.role === UserRole.ADMIN;
              const isSelf = currentUser?.id === coach.id;
              
              return (
                <tr 
                  key={coach.id} 
                  className="border-b border-gray-800 hover:bg-gray-800 cursor-pointer"
                  onClick={() => onViewCoachDashboard(coach)}
                >
                  <td className="py-2 px-4">{coach.name}</td>
                  <td className="py-2 px-4">{coach.email}</td>
                  <td className="py-2 px-4">{coach.level}</td>
                  <td className="py-2 px-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded ${coach.role === UserRole.ADMIN ? 'bg-brand-red' : 'bg-blue-500'}`}>
                          {coach.role}
                      </span>
                  </td>
                  <td className="py-2 px-4 space-x-2">
                    <Button 
                      variant="secondary" 
                      className="text-xs py-1 px-2" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewCoachDashboard(coach);
                      }}
                      title={`View ${coach.name}'s dashboard`}
                    >
                      View
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="text-xs py-1 px-2" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(coach);
                      }}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="danger" 
                      className="text-xs py-1 px-2" 
                      onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Are you sure you want to delete ${coach.name}? This action cannot be undone.`)) {
                              deleteCoach(coach.id);
                          }
                      }}
                      disabled={!isAdmin || isSelf}
                      title={
                        !isAdmin ? "Only admins can delete coaches." :
                        isSelf ? "You cannot delete your own account." :
                        `Delete ${coach.name}`
                      }
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <AddCoachModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        onCoachAdded={handleCoachAdded}
      />
      <EditCoachModal 
        isOpen={isEditModalOpen} 
        onClose={handleCloseEditModal} 
        coach={coachToEdit} 
      />
      {newlyCreatedCoach && (
        <CoachSetupWizard
          isOpen={isWizardOpen}
          onClose={handleWizardClose}
          coach={newlyCreatedCoach}
        />
      )}
    </>
  );
};

export default CoachManagement;

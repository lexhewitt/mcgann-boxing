import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import { GymClass } from '../../types';
import AddClassModal from './AddClassModal';
import ClassCreationWizard from './ClassCreationWizard';
import EditClassModal from './EditClassModal';
import { canDeleteClasses } from '../../utils/permissions';

const ClassManagement: React.FC = () => {
  const { classes, coaches, deleteClass } = useData();
  const { currentUser } = useAuth();
  
  // Sort classes by day (Monday first) then by time
  const sortedClasses = useMemo(() => {
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return [...classes].sort((a, b) => {
      const dayA = dayOrder.indexOf(a.day);
      const dayB = dayOrder.indexOf(b.day);
      if (dayA !== dayB) {
        return dayA - dayB;
      }
      // If same day, sort by time
      return a.time.localeCompare(b.time);
    });
  }, [classes]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [classToEdit, setClassToEdit] = useState<GymClass | null>(null);

  const handleEditClick = (cls: GymClass) => {
    setClassToEdit(cls);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setClassToEdit(null);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Classes ({classes.length})</h3>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsAddModalOpen(true)}>Add Class (Quick)</Button>
            <Button onClick={() => setIsWizardOpen(true)}>Create Class (Wizard)</Button>
          </div>
        </div>
        <table className="min-w-full bg-brand-dark text-sm">
          <thead className="bg-black">
            <tr>
              <th className="py-2 px-4 text-left">Name</th>
              <th className="py-2 px-4 text-left">Day</th>
              <th className="py-2 px-4 text-left">Time</th>
              <th className="py-2 px-4 text-left">Coach</th>
              <th className="py-2 px-4 text-left">Capacity</th>
              <th className="py-2 px-4 text-left">Price</th>
              <th className="py-2 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedClasses.map(cls => (
              <tr key={cls.id} className="border-b border-gray-800 hover:bg-gray-800">
                <td className="py-2 px-4">{cls.name}</td>
                <td className="py-2 px-4">{cls.day}</td>
                <td className="py-2 px-4">{cls.time}</td>
                <td className="py-2 px-4">{coaches.find(c => c.id === cls.coachId)?.name}</td>
                <td className="py-2 px-4">{cls.capacity}</td>
                <td className="py-2 px-4">£{cls.price.toFixed(2)}</td>
                <td className="py-2 px-4 space-x-2">
                  <Button variant="secondary" className="text-xs py-1 px-2" onClick={() => handleEditClick(cls)}>Edit</Button>
                  <Button 
                    variant="danger" 
                    className="text-xs py-1 px-2" 
                    onClick={() => window.confirm('Are you sure?') && deleteClass(cls.id)}
                    disabled={!canDeleteClasses(currentUser)}
                    title={!canDeleteClasses(currentUser) ? "Only Full Admins and Super Admins can delete classes" : "Delete class"}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AddClassModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <ClassCreationWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} />
      <EditClassModal isOpen={isEditModalOpen} onClose={handleCloseEditModal} gymClass={classToEdit} />
    </>
  );
};

export default ClassManagement;
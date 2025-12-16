import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Coach, AdminLevel, UserRole } from '../../types';
import { canManageAdmins, getAdminLevelDisplay } from '../../utils/permissions';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const AdminManagement: React.FC = () => {
  const { coaches, updateCoach } = useData();
  const { currentUser } = useAuth();
  const [coachToEdit, setCoachToEdit] = useState<Coach | null>(null);
  const [selectedAdminLevel, setSelectedAdminLevel] = useState<AdminLevel | undefined>(undefined);

  // Only show admins and coaches that can be made admins
  const adminCoaches = coaches.filter(c => c.role === UserRole.ADMIN || c.role === UserRole.COACH);

  const handleEditClick = (coach: Coach) => {
    setCoachToEdit(coach);
    setSelectedAdminLevel(coach.adminLevel);
  };

  const handleSave = async () => {
    if (!coachToEdit) return;

    const updatedCoach: Coach = {
      ...coachToEdit,
      role: selectedAdminLevel ? UserRole.ADMIN : coachToEdit.role,
      adminLevel: selectedAdminLevel,
    };

    try {
      await updateCoach(updatedCoach);
      setCoachToEdit(null);
      setSelectedAdminLevel(undefined);
    } catch (error) {
      console.error('Failed to update coach:', error);
      alert('Failed to update admin level. Please try again.');
    }
  };

  if (!canManageAdmins(currentUser)) {
    return (
      <div className="bg-brand-gray p-6 rounded-3xl shadow-xl">
        <p className="text-white">Only Super Admins can manage admin levels.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-brand-gray p-6 rounded-3xl shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Admin Management</h2>
            <p className="text-sm text-gray-400 mt-1">Manage admin levels and permissions</p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full bg-brand-dark text-sm">
            <thead className="bg-black">
              <tr>
                <th className="py-2 px-4 text-left">Name</th>
                <th className="py-2 px-4 text-left">Email</th>
                <th className="py-2 px-4 text-left">Current Role</th>
                <th className="py-2 px-4 text-left">Admin Level</th>
                <th className="py-2 px-4 text-left">Permissions</th>
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminCoaches.map(coach => (
                <tr key={coach.id} className="border-b border-gray-800 hover:bg-gray-800">
                  <td className="py-2 px-4 text-white font-semibold">{coach.name}</td>
                  <td className="py-2 px-4 text-gray-300">{coach.email}</td>
                  <td className="py-2 px-4">
                    <span className={`px-2 py-1 text-xs rounded ${
                      coach.role === UserRole.ADMIN ? 'bg-purple-500' : 'bg-blue-500'
                    }`}>
                      {coach.role}
                    </span>
                  </td>
                  <td className="py-2 px-4">
                    {coach.role === UserRole.ADMIN ? (
                      <span className={`px-2 py-1 text-xs rounded ${
                        coach.adminLevel === AdminLevel.SUPERADMIN ? 'bg-red-500' :
                        coach.adminLevel === AdminLevel.FULL_ADMIN ? 'bg-orange-500' :
                        coach.adminLevel === AdminLevel.STANDARD_ADMIN ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`}>
                        {getAdminLevelDisplay(coach.adminLevel)}
                      </span>
                    ) : (
                      <span className="text-gray-500 text-xs">N/A</span>
                    )}
                  </td>
                  <td className="py-2 px-4 text-xs text-gray-400">
                    {coach.role === UserRole.ADMIN && (
                      <div>
                        {coach.adminLevel === AdminLevel.SUPERADMIN && (
                          <>
                            <div>✓ Can delete everything</div>
                            <div>✓ Can manage admins</div>
                          </>
                        )}
                        {coach.adminLevel === AdminLevel.FULL_ADMIN && (
                          <>
                            <div>✓ Can delete everything</div>
                            <div>✗ Cannot manage admins</div>
                          </>
                        )}
                        {coach.adminLevel === AdminLevel.STANDARD_ADMIN && (
                          <>
                            <div>✗ Cannot delete</div>
                            <div>✗ Cannot manage admins</div>
                          </>
                        )}
                        {!coach.adminLevel && (
                          <div>✗ No admin permissions</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-4">
                    <Button
                      variant="secondary"
                      className="text-xs py-1 px-2"
                      onClick={() => handleEditClick(coach)}
                    >
                      Edit Level
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Admin Level Modal */}
      {coachToEdit && (
        <Modal
          isOpen={!!coachToEdit}
          onClose={() => {
            setCoachToEdit(null);
            setSelectedAdminLevel(undefined);
          }}
          title={`Edit Admin Level: ${coachToEdit.name}`}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="admin-role" className="block text-sm font-medium text-gray-300 mb-1">
                Role
              </label>
              <select
                id="admin-role"
                value={selectedAdminLevel ? UserRole.ADMIN : coachToEdit.role}
                onChange={(e) => {
                  if (e.target.value === UserRole.ADMIN) {
                    setSelectedAdminLevel(AdminLevel.STANDARD_ADMIN);
                  } else {
                    setSelectedAdminLevel(undefined);
                  }
                }}
                className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white"
              >
                <option value={UserRole.COACH}>Coach</option>
                <option value={UserRole.ADMIN}>Admin</option>
              </select>
            </div>

            {selectedAdminLevel && (
              <div>
                <label htmlFor="admin-level" className="block text-sm font-medium text-gray-300 mb-1">
                  Admin Level
                </label>
                <select
                  id="admin-level"
                  value={selectedAdminLevel || ''}
                  onChange={(e) => setSelectedAdminLevel(e.target.value as AdminLevel || undefined)}
                  className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white"
                >
                  <option value={AdminLevel.STANDARD_ADMIN}>Standard Admin (Cannot delete)</option>
                  <option value={AdminLevel.FULL_ADMIN}>Full Admin (Can delete, cannot manage admins)</option>
                  <option value={AdminLevel.SUPERADMIN}>Super Admin (Full access)</option>
                </select>
                <p className="text-xs text-gray-400 mt-2">
                  {selectedAdminLevel === AdminLevel.STANDARD_ADMIN && 'Cannot delete members, coaches, classes, or sessions. Cannot manage other admins.'}
                  {selectedAdminLevel === AdminLevel.FULL_ADMIN && 'Can delete members, coaches, classes, and sessions. Cannot create or manage other admins.'}
                  {selectedAdminLevel === AdminLevel.SUPERADMIN && 'Full access including creating and managing other admins.'}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-4 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setCoachToEdit(null);
                  setSelectedAdminLevel(undefined);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminManagement;


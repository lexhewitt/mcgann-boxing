import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Coach, AdminLevel, UserRole } from '../../types';
import { canManageAdmins, getAdminLevelDisplay, canDeleteMembers, canDeleteCoaches, canDeleteClasses, canDeleteSessions } from '../../utils/permissions';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';

interface AdminPermissions {
  canDeleteMembers: boolean;
  canDeleteCoaches: boolean;
  canDeleteClasses: boolean;
  canDeleteSessions: boolean;
  canManageAdmins: boolean;
  canCreateBackups: boolean;
  canRestoreBackups: boolean;
}

const AdminManagement: React.FC = () => {
  const { coaches, updateCoach, refreshData } = useData();
  const { currentUser } = useAuth();
  const [coachToEdit, setCoachToEdit] = useState<Coach | null>(null);
  const [selectedAdminLevel, setSelectedAdminLevel] = useState<AdminLevel | undefined>(undefined);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  const [newAdminData, setNewAdminData] = useState({
    name: '',
    email: '',
    password: '',
    adminLevel: AdminLevel.STANDARD_ADMIN as AdminLevel,
  });

  // Show all admins (filter to only show ADMIN role)
  const adminCoaches = coaches.filter(c => c.role === UserRole.ADMIN);

  const getAdminPermissions = (admin: Coach): AdminPermissions => {
    const level = admin.adminLevel;
    return {
      canDeleteMembers: level === AdminLevel.SUPERADMIN || level === AdminLevel.FULL_ADMIN,
      canDeleteCoaches: level === AdminLevel.SUPERADMIN || level === AdminLevel.FULL_ADMIN,
      canDeleteClasses: level === AdminLevel.SUPERADMIN || level === AdminLevel.FULL_ADMIN,
      canDeleteSessions: level === AdminLevel.SUPERADMIN || level === AdminLevel.FULL_ADMIN,
      canManageAdmins: level === AdminLevel.SUPERADMIN,
      canCreateBackups: level === AdminLevel.SUPERADMIN || level === AdminLevel.FULL_ADMIN,
      canRestoreBackups: level === AdminLevel.SUPERADMIN,
    };
  };

  const handleEditClick = (coach: Coach) => {
    setCoachToEdit(coach);
    setSelectedAdminLevel(coach.adminLevel);
    setIsSuspended((coach as any).isSuspended || false);
    setIsEditModalOpen(true);
  };

  const handleSave = async () => {
    if (!coachToEdit) return;

    // Protect Lex from having admin status removed
    const isLex = coachToEdit.email === 'lexhewitt@gmail.com';
    if (isLex) {
      if (!selectedAdminLevel || selectedAdminLevel !== AdminLevel.SUPERADMIN) {
        alert('Lex Hewitt is a protected superadmin and must remain a Super Admin.');
        return;
      }
    }

    const updatedCoach: Coach = {
      ...coachToEdit,
      role: selectedAdminLevel ? UserRole.ADMIN : coachToEdit.role,
      adminLevel: selectedAdminLevel,
      ...(isSuspended !== undefined && { isSuspended } as any),
    };

    try {
      await updateCoach(updatedCoach);
      setCoachToEdit(null);
      setSelectedAdminLevel(undefined);
      setIsEditModalOpen(false);
      await refreshData();
    } catch (error) {
      console.error('Failed to update coach:', error);
      alert('Failed to update admin level. Please try again.');
    }
  };

  const handleCreateAdmin = async () => {
    if (!newAdminData.name || !newAdminData.email || !newAdminData.password) {
      alert('Name, email, and password are required.');
      return;
    }

    if (newAdminData.password.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    try {
      const response = await fetch('/server-api/admin/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAdminData.name,
          email: newAdminData.email,
          password: newAdminData.password,
          adminLevel: newAdminData.adminLevel,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Admin created successfully!');
        setIsAddModalOpen(false);
        setNewAdminData({
          name: '',
          email: '',
          password: '',
          adminLevel: AdminLevel.STANDARD_ADMIN,
        });
        await refreshData();
      } else {
        alert(data.error || 'Failed to create admin.');
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      alert('Failed to create admin. Please try again.');
    }
  };

  const handleToggleSuspend = async (admin: Coach) => {
    const isLex = admin.email === 'lexhewitt@gmail.com';
    if (isLex) {
      alert('Lex Hewitt is a protected superadmin and cannot be suspended.');
      return;
    }

    const newSuspendedState = !((admin as any).isSuspended || false);
    const confirmMessage = newSuspendedState
      ? `Are you sure you want to suspend ${admin.name}? They will not be able to log in.`
      : `Are you sure you want to activate ${admin.name}? They will be able to log in again.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    const updatedCoach: Coach = {
      ...admin,
      ...({ isSuspended: newSuspendedState } as any),
    };

    try {
      await updateCoach(updatedCoach);
      await refreshData();
    } catch (error) {
      console.error('Failed to update admin status:', error);
      alert('Failed to update admin status. Please try again.');
    }
  };

  // Show admin list to everyone, but only allow editing to Super Admins
  const canEdit = canManageAdmins(currentUser);

  return (
    <div className="space-y-6">
      <div className="bg-brand-dark p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Admin Users</h3>
              <p className="text-sm text-gray-400">
                {canEdit 
                  ? 'Manage admin access levels, permissions, and status. Lex Hewitt is protected.'
                  : 'View admin users. Only Super Admins can manage admin levels.'}
              </p>
              {!canEdit && (
                <p className="text-sm text-yellow-400 mt-1">
                  Your current admin level: <span className="font-semibold">{(currentUser as any)?.adminLevel || 'Not set'}</span>
                </p>
              )}
            </div>
            {canEdit && <Button onClick={() => setIsAddModalOpen(true)}>Add New Admin</Button>}
          </div>

        <div className="mt-6 overflow-x-auto">
          <div className="bg-gray-800/30 rounded-lg border border-gray-700 overflow-hidden">
            <table className="min-w-full text-sm">
            <thead className="bg-gray-900/50 border-b border-gray-700">
              <tr>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Name</th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Email</th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Admin Level</th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Created</th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Permissions</th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminCoaches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="space-y-3">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 border-2 border-gray-700 mb-2">
                        <span className="text-3xl">👥</span>
                      </div>
                      <p className="text-gray-300 font-medium">No admins found in the system</p>
                      {canEdit && (
                        <p className="text-gray-400 text-sm">Click "Add New Admin" to create your first admin user.</p>
                      )}
                      {!canEdit && (
                        <p className="text-yellow-400 text-sm">You need to be a Super Admin to add new admins.</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                adminCoaches.map(admin => {
                  const isLex = admin.email === 'lexhewitt@gmail.com';
                  const permissions = getAdminPermissions(admin);
                  const isSuspended = (admin as any).isSuspended || false;
                  const createdDate = (admin as any).created_at 
                    ? new Date((admin as any).created_at).toLocaleDateString()
                    : 'N/A';

                  return (
                    <tr key={admin.id} className="border-b border-gray-700/50 hover:bg-gray-800/50 transition-colors">
                      <td className="py-4 px-6 text-white font-semibold">
                        {admin.name}
                        {isLex && <span className="ml-2 text-xs text-yellow-400">(Protected)</span>}
                      </td>
                      <td className="py-4 px-6 text-gray-300">{admin.email}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                          admin.adminLevel === AdminLevel.SUPERADMIN ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                          admin.adminLevel === AdminLevel.FULL_ADMIN ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                          admin.adminLevel === AdminLevel.STANDARD_ADMIN ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                          'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                        }`}>
                          {getAdminLevelDisplay(admin.adminLevel)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-400 text-xs">{createdDate}</td>
                      <td className="py-4 px-6">
                        {isSuspended ? (
                          <span className="px-2 py-1 text-xs rounded bg-red-900 text-red-200">Suspended</span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded bg-green-900 text-green-200">Active</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-xs space-y-1.5">
                          <div className={permissions.canDeleteMembers ? 'text-green-400' : 'text-gray-500'}>
                            {permissions.canDeleteMembers ? '✓' : '✗'} Delete Members
                          </div>
                          <div className={permissions.canDeleteCoaches ? 'text-green-400' : 'text-gray-500'}>
                            {permissions.canDeleteCoaches ? '✓' : '✗'} Delete Coaches
                          </div>
                          <div className={permissions.canDeleteClasses ? 'text-green-400' : 'text-gray-500'}>
                            {permissions.canDeleteClasses ? '✓' : '✗'} Delete Classes
                          </div>
                          <div className={permissions.canManageAdmins ? 'text-green-400' : 'text-gray-500'}>
                            {permissions.canManageAdmins ? '✓' : '✗'} Manage Admins
                          </div>
                          <div className={permissions.canCreateBackups ? 'text-green-400' : 'text-gray-500'}>
                            {permissions.canCreateBackups ? '✓' : '✗'} Create Backups
                          </div>
                          <div className={permissions.canRestoreBackups ? 'text-green-400' : 'text-gray-500'}>
                            {permissions.canRestoreBackups ? '✓' : '✗'} Restore Backups
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                        {canEdit && (
                          <>
                            <Button
                              variant="secondary"
                              className="text-xs py-2 px-3 flex items-center gap-1"
                              onClick={() => handleEditClick(admin)}
                              disabled={isLex}
                              title={isLex ? "Lex Hewitt is protected" : "Edit admin"}
                            >
                              <span>✏️</span>
                              <span>Edit</span>
                            </Button>
                            <Button
                              variant={isSuspended ? "secondary" : "danger"}
                              className="text-xs py-2 px-3 flex items-center gap-1"
                              onClick={() => handleToggleSuspend(admin)}
                              disabled={isLex}
                              title={isLex ? "Lex Hewitt is protected" : isSuspended ? "Activate admin" : "Suspend admin"}
                            >
                              <span>{isSuspended ? '✅' : '⏸️'}</span>
                              <span>{isSuspended ? 'Activate' : 'Suspend'}</span>
                            </Button>
                          </>
                        )}
                        {!canEdit && (
                          <span className="text-xs text-gray-500 italic">View only</span>
                        )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Add New Admin Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setNewAdminData({
            name: '',
            email: '',
            password: '',
            adminLevel: AdminLevel.STANDARD_ADMIN,
          });
        }}
        title="Add New Admin"
      >
        <div className="space-y-4">
          <Input
            label="Full Name *"
            id="new-admin-name"
            value={newAdminData.name}
            onChange={(e) => setNewAdminData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          <Input
            label="Email *"
            id="new-admin-email"
            type="email"
            value={newAdminData.email}
            onChange={(e) => setNewAdminData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
          <Input
            label="Password *"
            id="new-admin-password"
            type="password"
            value={newAdminData.password}
            onChange={(e) => setNewAdminData(prev => ({ ...prev, password: e.target.value }))}
            required
            placeholder="Minimum 6 characters"
          />
          <div>
            <label htmlFor="new-admin-level" className="block text-sm font-medium text-gray-300 mb-1">
              Admin Level *
            </label>
            <select
              id="new-admin-level"
              value={newAdminData.adminLevel}
              onChange={(e) => setNewAdminData(prev => ({ ...prev, adminLevel: e.target.value as AdminLevel }))}
              className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white"
            >
              <option value={AdminLevel.STANDARD_ADMIN}>Standard Admin (Cannot delete)</option>
              <option value={AdminLevel.FULL_ADMIN}>Full Admin (Can delete, cannot manage admins)</option>
              <option value={AdminLevel.SUPERADMIN}>Super Admin (Full access)</option>
            </select>
            <p className="text-xs text-gray-400 mt-2">
              {newAdminData.adminLevel === AdminLevel.STANDARD_ADMIN && 'Cannot delete members, coaches, classes, or sessions. Cannot manage other admins.'}
              {newAdminData.adminLevel === AdminLevel.FULL_ADMIN && 'Can delete members, coaches, classes, and sessions. Cannot create or manage other admins.'}
              {newAdminData.adminLevel === AdminLevel.SUPERADMIN && 'Full access including creating and managing other admins.'}
            </p>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                setNewAdminData({
                  name: '',
                  email: '',
                  password: '',
                  adminLevel: AdminLevel.STANDARD_ADMIN,
                });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateAdmin}>
              Create Admin
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Admin Modal */}
      {coachToEdit && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setCoachToEdit(null);
            setSelectedAdminLevel(undefined);
          }}
          title={`Edit Admin: ${coachToEdit.name}`}
        >
          <div className="space-y-4">
            {coachToEdit.email === 'lexhewitt@gmail.com' && (
              <div className="bg-yellow-900/20 border border-yellow-600 rounded-md p-3 text-yellow-300 text-sm">
                <strong>Protected Superadmin:</strong> Lex Hewitt must remain a Super Admin and cannot be modified.
              </div>
            )}
            <div>
              <label htmlFor="edit-admin-level" className="block text-sm font-medium text-gray-300 mb-1">
                Admin Level
              </label>
              <select
                id="edit-admin-level"
                value={selectedAdminLevel || ''}
                onChange={(e) => setSelectedAdminLevel(e.target.value as AdminLevel || undefined)}
                className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white"
                disabled={coachToEdit.email === 'lexhewitt@gmail.com'}
              >
                <option value={AdminLevel.STANDARD_ADMIN}>Standard Admin (Cannot delete)</option>
                <option value={AdminLevel.FULL_ADMIN}>Full Admin (Can delete, cannot manage admins)</option>
                <option value={AdminLevel.SUPERADMIN}>Super Admin (Full access)</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-admin-suspended"
                checked={isSuspended}
                onChange={(e) => setIsSuspended(e.target.checked)}
                disabled={coachToEdit.email === 'lexhewitt@gmail.com'}
                className="w-4 h-4"
              />
              <label htmlFor="edit-admin-suspended" className="text-sm text-gray-300">
                Suspend this admin (they will not be able to log in)
              </label>
            </div>
            <div className="flex justify-end gap-4 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEditModalOpen(false);
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

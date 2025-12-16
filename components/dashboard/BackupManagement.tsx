import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';

interface Backup {
  id: string;
  created_by: string;
  created_at: string;
  backup_name: string;
  backup_description?: string;
  file_size_bytes?: number;
  restored_at?: string;
  restored_by?: string;
  is_active: boolean;
}

const BackupManagement: React.FC = () => {
  const { coaches, refreshData } = useData();
  const { currentUser } = useAuth();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [backupToRestore, setBackupToRestore] = useState<Backup | null>(null);
  const [backupName, setBackupName] = useState('');
  const [backupDescription, setBackupDescription] = useState('');

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/server-api/backups/list');
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups || []);
      } else {
        console.error('Failed to load backups');
      }
    } catch (error) {
      console.error('Error loading backups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createBackup = async () => {
    if (!backupName.trim()) {
      alert('Please enter a backup name');
      return;
    }

    setIsCreatingBackup(true);
    try {
      if (!currentUser) {
        alert('You must be logged in to create a backup');
        return;
      }

      const response = await fetch('/server-api/backups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backupName: backupName.trim(),
          backupDescription: backupDescription.trim() || undefined,
          userId: currentUser.id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Backup created successfully! Backup ID: ${result.backupId}`);
        setBackupName('');
        setBackupDescription('');
        loadBackups();
      } else {
        const error = await response.json();
        alert(`Failed to create backup: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Failed to create backup. Please try again.');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const downloadBackup = async (backup: Backup) => {
    try {
      const response = await fetch(`/server-api/backups/download/${backup.id}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${backup.backup_name}-${backup.created_at.split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download backup');
      }
    } catch (error) {
      console.error('Error downloading backup:', error);
      alert('Failed to download backup');
    }
  };

  const handleRestore = async () => {
    if (!backupToRestore) return;

    const confirmMessage = `WARNING: This will restore the system to the state from ${new Date(backupToRestore.created_at).toLocaleString()}.\n\nThis will REPLACE all current data. Are you absolutely sure?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    const doubleConfirm = window.prompt('Type "RESTORE" to confirm:');
    if (doubleConfirm !== 'RESTORE') {
      return;
    }

    try {
      if (!currentUser) {
        alert('You must be logged in to restore a backup');
        return;
      }

      const response = await fetch(`/server-api/backups/restore/${backupToRestore.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
        }),
      });

      if (response.ok) {
        alert('Backup restored successfully! The page will refresh.');
        setIsRestoreModalOpen(false);
        setBackupToRestore(null);
        // Refresh all data
        await refreshData();
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Failed to restore backup: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      alert('Failed to restore backup. Please try again.');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const getCreatorName = (coachId: string) => {
    const coach = coaches.find(c => c.id === coachId);
    return coach?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="bg-brand-gray p-6 rounded-3xl shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">System Backups</h2>
            <p className="text-sm text-gray-400 mt-1">Create and restore system backups</p>
          </div>
          <Button onClick={() => setIsCreatingBackup(true)}>Create Backup</Button>
        </div>

        {/* Create Backup Modal */}
        <Modal
          isOpen={isCreatingBackup}
          onClose={() => {
            setIsCreatingBackup(false);
            setBackupName('');
            setBackupDescription('');
          }}
          title="Create System Backup"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              This will create a complete backup of all system data including members, coaches, classes, bookings, and transactions.
            </p>
            <Input
              label="Backup Name *"
              id="backup-name"
              value={backupName}
              onChange={(e) => setBackupName(e.target.value)}
              placeholder="e.g., Pre-launch backup, Monthly backup"
              required
            />
            <div>
              <label htmlFor="backup-description" className="block text-sm font-medium text-gray-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="backup-description"
                value={backupDescription}
                onChange={(e) => setBackupDescription(e.target.value)}
                rows={3}
                className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500"
                placeholder="Add any notes about this backup..."
              />
            </div>
            <div className="flex justify-end gap-4 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsCreatingBackup(false);
                  setBackupName('');
                  setBackupDescription('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={createBackup} disabled={!backupName.trim() || isLoading}>
                {isLoading ? 'Creating...' : 'Create Backup'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Backups List */}
        <div className="mt-6">
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">Loading backups...</div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No backups found.</p>
              <p className="text-sm mt-2">Create your first backup to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-brand-dark text-sm">
                <thead className="bg-black">
                  <tr>
                    <th className="py-2 px-4 text-left">Name</th>
                    <th className="py-2 px-4 text-left">Created</th>
                    <th className="py-2 px-4 text-left">Created By</th>
                    <th className="py-2 px-4 text-left">Size</th>
                    <th className="py-2 px-4 text-left">Restored</th>
                    <th className="py-2 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map(backup => (
                    <tr key={backup.id} className="border-b border-gray-800 hover:bg-gray-800">
                      <td className="py-2 px-4">
                        <div className="font-semibold text-white">{backup.backup_name}</div>
                        {backup.backup_description && (
                          <div className="text-xs text-gray-400 mt-1">{backup.backup_description}</div>
                        )}
                      </td>
                      <td className="py-2 px-4 text-gray-300">
                        {new Date(backup.created_at).toLocaleString()}
                      </td>
                      <td className="py-2 px-4 text-gray-300">{getCreatorName(backup.created_by)}</td>
                      <td className="py-2 px-4 text-gray-300">{formatFileSize(backup.file_size_bytes)}</td>
                      <td className="py-2 px-4">
                        {backup.restored_at ? (
                          <div>
                            <div className="text-xs text-green-400">Yes</div>
                            <div className="text-xs text-gray-500">
                              {new Date(backup.restored_at).toLocaleString()}
                            </div>
                            {backup.restored_by && (
                              <div className="text-xs text-gray-500">by {getCreatorName(backup.restored_by)}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">No</span>
                        )}
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            className="text-xs py-1 px-2"
                            onClick={() => downloadBackup(backup)}
                          >
                            Download
                          </Button>
                          <Button
                            variant="secondary"
                            className="text-xs py-1 px-2"
                            onClick={() => {
                              setBackupToRestore(backup);
                              setIsRestoreModalOpen(true);
                            }}
                          >
                            Restore
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      {backupToRestore && (
        <Modal
          isOpen={isRestoreModalOpen}
          onClose={() => {
            setIsRestoreModalOpen(false);
            setBackupToRestore(null);
          }}
          title={`Restore Backup: ${backupToRestore.backup_name}`}
        >
          <div className="space-y-4">
            <div className="bg-red-900/20 border border-red-500 p-4 rounded-lg">
              <p className="text-red-300 font-semibold mb-2">⚠️ WARNING</p>
              <p className="text-sm text-red-200">
                Restoring this backup will <strong>REPLACE ALL CURRENT DATA</strong> with the data from{' '}
                <strong>{new Date(backupToRestore.created_at).toLocaleString()}</strong>.
              </p>
              <p className="text-sm text-red-200 mt-2">
                This action cannot be undone. Make sure you have a current backup before proceeding.
              </p>
            </div>
            <div className="bg-brand-dark p-4 rounded-lg">
              <p className="text-sm text-gray-300 mb-2">Backup Details:</p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>Name: {backupToRestore.backup_name}</li>
                <li>Created: {new Date(backupToRestore.created_at).toLocaleString()}</li>
                <li>Created By: {getCreatorName(backupToRestore.created_by)}</li>
                {backupToRestore.backup_description && (
                  <li>Description: {backupToRestore.backup_description}</li>
                )}
              </ul>
            </div>
            <div className="flex justify-end gap-4 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsRestoreModalOpen(false);
                  setBackupToRestore(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleRestore}>
                Restore Backup
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BackupManagement;


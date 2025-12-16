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
  const [restoreConfirmation, setRestoreConfirmation] = useState('');

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

    // Require exact match of "RESTORE" (case-sensitive)
    if (restoreConfirmation !== 'RESTORE') {
      alert('You must type "RESTORE" exactly (all caps) to confirm the restore operation.');
      return;
    }

    // Final confirmation dialog
    const confirmMessage = `FINAL WARNING: This will restore the system to the state from ${new Date(backupToRestore.created_at).toLocaleString()}.\n\nThis will PERMANENTLY REPLACE all current data. This action cannot be undone.\n\nAre you absolutely certain you want to proceed?`;
    if (!window.confirm(confirmMessage)) {
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
        setRestoreConfirmation('');
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
                              setBackupToRestore(null);
                              setRestoreConfirmation('');
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
      <Modal
        isOpen={isRestoreModalOpen}
        onClose={() => {
          setIsRestoreModalOpen(false);
          setBackupToRestore(null);
          setRestoreConfirmation('');
        }}
        title="Restore System Backup"
      >
        <div className="space-y-4">
          {/* Step 1: Select Backup */}
          <div className="bg-brand-dark p-4 rounded-lg border border-gray-700">
            <p className="text-sm text-gray-300 mb-3 font-semibold">Step 1: Select Backup to Restore</p>
            {backups.length === 0 ? (
              <p className="text-sm text-gray-400">No backups available.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {backups.map(backup => (
                  <div
                    key={backup.id}
                    onClick={() => {
                      setBackupToRestore(backup);
                      setRestoreConfirmation(''); // Reset confirmation when backup changes
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      backupToRestore?.id === backup.id
                        ? 'bg-blue-900/30 border-blue-500'
                        : 'bg-gray-800 border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            backupToRestore?.id === backup.id
                              ? 'border-blue-400 bg-blue-500'
                              : 'border-gray-500'
                          }`}>
                            {backupToRestore?.id === backup.id && (
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                            )}
                          </div>
                          <div className="font-semibold text-white">{backup.backup_name}</div>
                        </div>
                        {backup.backup_description && (
                          <div className="text-xs text-gray-400 mt-1 ml-6">{backup.backup_description}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-1 ml-6">
                          Created: {new Date(backup.created_at).toLocaleString()} by {getCreatorName(backup.created_by)}
                          {backup.restored_at && (
                            <span className="text-yellow-400 ml-2">(Previously restored)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Warning (only show if backup selected) */}
          {backupToRestore && (
            <>
              <div className="bg-red-900/20 border-2 border-red-500 p-4 rounded-lg">
                <p className="text-red-300 font-semibold mb-2 text-lg">⚠️ CRITICAL WARNING</p>
                <p className="text-sm text-red-200 mb-2">
                  Restoring this backup will <strong className="text-red-100">PERMANENTLY REPLACE ALL CURRENT DATA</strong> with the data from{' '}
                  <strong>{new Date(backupToRestore.created_at).toLocaleString()}</strong>.
                </p>
                <p className="text-sm text-red-200">
                  <strong>This action cannot be undone.</strong> Make sure you have a current backup before proceeding.
                </p>
              </div>
              <div className="bg-brand-dark p-4 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-300 mb-2 font-semibold">Selected Backup Details:</p>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>Name: {backupToRestore.backup_name}</li>
                  <li>Created: {new Date(backupToRestore.created_at).toLocaleString()}</li>
                  <li>Created By: {getCreatorName(backupToRestore.created_by)}</li>
                  <li>Size: {formatFileSize(backupToRestore.file_size_bytes)}</li>
                  {backupToRestore.backup_description && (
                    <li>Description: {backupToRestore.backup_description}</li>
                  )}
                </ul>
              </div>
            </>
          )}

          {/* Step 3: Type RESTORE (only show if backup selected) */}
          {backupToRestore && (
            <div className="bg-yellow-900/20 border border-yellow-600 p-4 rounded-lg">
              <p className="text-yellow-300 font-semibold mb-2">🔒 Step 2: Confirmation Required</p>
              <p className="text-sm text-yellow-200 mb-3">
                To proceed with the restore, you must type <strong className="text-yellow-100">RESTORE</strong> (all caps) in the field below:
              </p>
              <Input
                label="Type 'RESTORE' to confirm"
                id="restore-confirmation"
                value={restoreConfirmation}
                onChange={(e) => setRestoreConfirmation(e.target.value)}
                placeholder="RESTORE"
                className="font-mono text-lg tracking-wider"
                autoFocus
              />
              {restoreConfirmation && restoreConfirmation !== 'RESTORE' && (
                <p className="text-xs text-red-400 mt-2">
                  ❌ The confirmation text does not match. You must type exactly "RESTORE" (all capital letters).
                </p>
              )}
              {restoreConfirmation === 'RESTORE' && (
                <p className="text-xs text-green-400 mt-2">
                  ✓ Confirmation text matches. You can proceed with the restore.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsRestoreModalOpen(false);
                setBackupToRestore(null);
                setRestoreConfirmation('');
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleRestore}
              disabled={!backupToRestore || restoreConfirmation !== 'RESTORE'}
              className={(!backupToRestore || restoreConfirmation !== 'RESTORE') ? 'opacity-50 cursor-not-allowed' : ''}
            >
              Restore Backup
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BackupManagement;


import React, { useState } from 'react';
import AdminManagement from './AdminManagement';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { canManageAdmins } from '../../utils/permissions';
import Button from '../ui/Button';

type SettingsTab = 'admin-management' | 'system' | 'notifications' | 'security' | 'integrations';

interface SettingsSection {
  id: SettingsTab;
  title: string;
  description: string;
  icon: string;
  requiresSuperAdmin?: boolean;
}

const Settings: React.FC = () => {
  const { currentUser, refreshCurrentUser } = useAuth();
  const { refreshData } = useData();
  const [activeTab, setActiveTab] = useState<SettingsTab>('admin-management');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshUser = async () => {
    setIsRefreshing(true);
    try {
      // Refresh user data from database
      await refreshCurrentUser();
      // Also refresh all data context
      await refreshData();
      // Small delay to ensure state updates
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    } catch (error) {
      console.error('Error refreshing user:', error);
      setIsRefreshing(false);
      alert('Failed to refresh session. Please try logging out and back in.');
    }
  };

  const settingsSections: SettingsSection[] = [
    {
      id: 'admin-management',
      title: 'Admin Management',
      description: 'Manage user roles, permissions, and access levels',
      icon: '👥',
      requiresSuperAdmin: true,
    },
    {
      id: 'system',
      title: 'System Settings',
      description: 'Configure system preferences and defaults',
      icon: '⚙️',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Manage email and system notification preferences',
      icon: '🔔',
    },
    {
      id: 'security',
      title: 'Security',
      description: 'Password policies and security settings',
      icon: '🔒',
    },
    {
      id: 'integrations',
      title: 'Integrations',
      description: 'Third-party service connections and API keys',
      icon: '🔌',
      requiresSuperAdmin: true,
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'admin-management':
        if (!canManageAdmins(currentUser)) {
          return (
            <div className="bg-gradient-to-br from-brand-dark to-gray-900 p-8 rounded-2xl border border-gray-700 shadow-2xl">
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-900/20 border-2 border-yellow-600 mb-4">
                  <span className="text-3xl">🔒</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Access Restricted</h3>
                <p className="text-gray-300 mb-4">Only Super Admins can manage admin levels and permissions.</p>
                <div className="bg-gray-800/50 rounded-lg p-4 mb-4 inline-block">
                  <p className="text-sm text-gray-400 mb-1">Your Current Admin Level</p>
                  <p className="text-xl font-bold text-yellow-400">
                    {(currentUser as any)?.adminLevel || 'Not Set'}
                  </p>
                </div>
                <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-blue-200 text-sm mb-3">
                    <strong>Need Super Admin Access?</strong>
                  </p>
                  <p className="text-blue-300 text-xs mb-3">
                    If you've just updated your admin level in the database, refresh your session to load the changes.
                  </p>
                  <Button
                    variant="secondary"
                    onClick={handleRefreshUser}
                    disabled={isRefreshing}
                    className="w-full"
                  >
                    {isRefreshing ? 'Refreshing...' : '🔄 Refresh Session & Reload'}
                  </Button>
                </div>
              </div>
            </div>
          );
        }
        return <AdminManagement />;
      
      case 'system':
        return (
          <div className="bg-gradient-to-br from-brand-dark to-gray-900 p-8 rounded-2xl border border-gray-700 shadow-2xl">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">System Preferences</h3>
                <p className="text-gray-400 text-sm">Configure default system settings and behaviors.</p>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <p className="text-gray-300 text-sm">System settings coming soon...</p>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'notifications':
        return (
          <div className="bg-gradient-to-br from-brand-dark to-gray-900 p-8 rounded-2xl border border-gray-700 shadow-2xl">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Notification Preferences</h3>
                <p className="text-gray-400 text-sm">Manage how and when you receive notifications.</p>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <p className="text-gray-300 text-sm">Notification settings coming soon...</p>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'security':
        return (
          <div className="bg-gradient-to-br from-brand-dark to-gray-900 p-8 rounded-2xl border border-gray-700 shadow-2xl">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Security Settings</h3>
                <p className="text-gray-400 text-sm">Configure password policies and security options.</p>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <p className="text-gray-300 text-sm">Security settings coming soon...</p>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'integrations':
        if (!canManageAdmins(currentUser)) {
          return (
            <div className="bg-gradient-to-br from-brand-dark to-gray-900 p-8 rounded-2xl border border-gray-700 shadow-2xl">
              <div className="text-center py-8">
                <p className="text-gray-300">Only Super Admins can manage integrations.</p>
              </div>
            </div>
          );
        }
        return (
          <div className="bg-gradient-to-br from-brand-dark to-gray-900 p-8 rounded-2xl border border-gray-700 shadow-2xl">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Third-Party Integrations</h3>
                <p className="text-gray-400 text-sm">Manage connections to external services and APIs.</p>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <p className="text-gray-300 text-sm">Integration settings coming soon...</p>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const availableSections = settingsSections.filter(section => 
    !section.requiresSuperAdmin || canManageAdmins(currentUser)
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-brand-dark via-gray-900 to-brand-dark p-8 rounded-2xl border border-gray-700 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-brand-red/20 flex items-center justify-center border border-brand-red/30">
                <span className="text-2xl">⚙️</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Settings</h1>
                <p className="text-gray-400 text-sm mt-1">Manage system configuration and preferences</p>
              </div>
            </div>
          </div>
          {currentUser && (
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Logged in as</p>
              <p className="text-sm font-semibold text-white">{currentUser.name}</p>
              <p className="text-xs text-gray-400">
                {(currentUser as any)?.adminLevel ? (
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-1 rounded bg-green-900/30 border border-green-600/30">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="font-semibold text-green-400">{(currentUser as any).adminLevel}</span>
                  </span>
                ) : (
                  <div className="mt-2">
                    <span className="text-yellow-400 inline-block mb-2">Admin Level Not Set</span>
                    <Button
                      variant="secondary"
                      onClick={handleRefreshUser}
                      disabled={isRefreshing}
                      className="text-xs w-full py-1 px-2"
                    >
                      {isRefreshing ? 'Refreshing...' : '🔄 Refresh Session'}
                    </Button>
                  </div>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Settings Navigation */}
      <div className="bg-gradient-to-br from-brand-dark to-gray-900 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden">
        <div className="border-b border-gray-700 bg-gray-800/30">
          <div className="flex flex-wrap gap-1 p-2">
            {availableSections.map((section) => {
              const isActive = activeTab === section.id;
              const isDisabled = section.requiresSuperAdmin && !canManageAdmins(currentUser);
              
              return (
                <button
                  key={section.id}
                  onClick={() => !isDisabled && setActiveTab(section.id)}
                  disabled={isDisabled}
                  className={`
                    flex items-center gap-2 px-5 py-3 font-semibold rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20 border-2 border-brand-red'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800 border-2 border-transparent'
                    }
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <span className="text-lg">{section.icon}</span>
                  <span>{section.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings Content */}
        <div className="p-6">
          {availableSections.find(s => s.id === activeTab) && (
            <div className="mb-4 pb-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>{availableSections.find(s => s.id === activeTab)?.icon}</span>
                {availableSections.find(s => s.id === activeTab)?.title}
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {availableSections.find(s => s.id === activeTab)?.description}
              </p>
            </div>
          )}
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;

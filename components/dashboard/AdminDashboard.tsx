import React, { useState } from 'react';
import MemberManagement from './MemberManagement';
import CoachManagement from './CoachManagement';
import ClassManagement from './ClassManagement';
import AdminOverview from './AdminOverview';
import CalendarView from './CalendarView';
import ActivityLog from './ActivityLog';
import NotificationsPanel from './NotificationsPanel';
import FinancialsDashboard from './FinancialsDashboard';
import { Coach } from '../../types';
import { useAuth } from '../../context/AuthContext';

type AdminTab = 'overview' | 'members' | 'coaches' | 'classes' | 'calendar' | 'activity' | 'notifications' | 'financials';

interface AdminDashboardProps {
  setViewAsCoach: (coach: Coach | null) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ setViewAsCoach }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const { currentUser } = useAuth();

  const renderContent = () => {
    // Add a guard clause for safety
    if (!currentUser) return null;

    switch (activeTab) {
      case 'overview':
        return <AdminOverview setActiveTab={setActiveTab} />;
      case 'members':
        return <MemberManagement />;
      case 'coaches':
        return <CoachManagement onViewCoachDashboard={setViewAsCoach} />;
      case 'classes':
        return <ClassManagement />;
      case 'calendar':
        return <CalendarView />;
       case 'financials':
        // FIX: Pass the current user to display admin-specific financial data.
        return <FinancialsDashboard user={currentUser} />;
      case 'activity':
        return <ActivityLog />;
      case 'notifications':
        // FIX: Pass the current user to satisfy the 'user' prop requirement of NotificationsPanel.
        return <NotificationsPanel user={currentUser} />;
      default:
        return null;
    }
  };
  
  const TabButton:React.FC<{tabName: AdminTab, label: string}> = ({tabName, label}) => (
      <button
        onClick={() => setActiveTab(tabName)}
        className={`px-4 py-2 font-semibold rounded-t-lg transition-colors ${activeTab === tabName ? 'bg-brand-gray text-white' : 'bg-brand-dark text-gray-400 hover:bg-gray-800'}`}
      >
          {label}
      </button>
  )

  return (
    <div>
        <h2 className="text-2xl font-bold text-white mb-4">Admin Dashboard</h2>
        <div className="border-b border-gray-700 flex flex-wrap">
            <TabButton tabName='overview' label="Overview" />
            <TabButton tabName='members' label="Manage Members" />
            <TabButton tabName='coaches' label="Manage Coaches" />
            <TabButton tabName='classes' label="Manage Classes" />
            <TabButton tabName='calendar' label="Calendar" />
            <TabButton tabName='financials' label="Financials" />
            <TabButton tabName='notifications' label="Notifications" />
            <TabButton tabName='activity' label="Activity Log" />
        </div>
        <div className="bg-brand-gray p-6 rounded-b-lg">
            {renderContent()}
        </div>
    </div>
  );
};

export default AdminDashboard;
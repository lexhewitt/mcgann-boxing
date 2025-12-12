import React, { useState } from 'react';
import MemberManagement from './MemberManagement';
import CoachManagement from './CoachManagement';
import ClassManagement from './ClassManagement';
import AdminOverview from './AdminOverview';
import CalendarView from './CalendarView';
import AdminCalendarView from './AdminCalendarView';
import ReportsDashboard from './ReportsDashboard';
import SystemCheckPanel from './SystemCheckPanel';
import ActivityLog from './ActivityLog';
import NotificationsPanel from './NotificationsPanel';
import FinancialsDashboard from './FinancialsDashboard';
import CoachFinancialSummary from './CoachFinancialSummary';
import AdminWhatsAppPanel from './AdminWhatsAppPanel';
import { Coach, NotificationStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

type AdminTab = 'overview' | 'members' | 'coaches' | 'classes' | 'calendar' | 'activity' | 'notifications' | 'financials' | 'reports' | 'system' | 'whatsapp';

interface AdminDashboardProps {
  setViewAsCoach: (coach: Coach | null) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ setViewAsCoach }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [financialCoach, setFinancialCoach] = useState<Coach | null>(null);
  const { currentUser } = useAuth();
  const { bookings, classes, members, notifications, bookingAlerts } = useData();
  const pendingClassTransfers = notifications.filter(n => n.status === NotificationStatus.PENDING).length;
  const pendingBookingAlerts = (() => {
    const raw = bookingAlerts.filter(alert => alert.status === 'PENDING');
    const seen = new Set<string>();
    let count = 0;
    raw.forEach(alert => {
      const key = `${alert.transactionId ?? ''}|${alert.guestBookingId ?? ''}|${alert.referenceId ?? ''}|${alert.participantName ?? ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        count += 1;
      }
    });
    return count;
  })();
  const totalPendingNotifications = pendingClassTransfers + pendingBookingAlerts;

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
        return <AdminCalendarView />;
      case 'reports':
        return <ReportsDashboard />;
      case 'system':
        return <SystemCheckPanel />;
      case 'whatsapp':
        return <AdminWhatsAppPanel />;
      case 'financials':
        return financialCoach ? (
          <CoachFinancialSummary
            coach={financialCoach}
            bookings={bookings}
            classes={classes}
            members={members}
            onClose={() => setFinancialCoach(null)}
          />
        ) : (
          <FinancialsDashboard user={currentUser} onViewCoachFinancials={setFinancialCoach} />
        );
      case 'activity':
        return <ActivityLog />;
      case 'notifications':
        // FIX: Pass the current user to satisfy the 'user' prop requirement of NotificationsPanel.
        return <NotificationsPanel user={currentUser} />;
      default:
        return null;
    }
  };
  
  const TabButton:React.FC<{tabName: AdminTab, label: string, count?: number}> = ({tabName, label, count}) => (
      <button
        onClick={() => setActiveTab(tabName)}
        className={`px-4 py-2 font-semibold rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === tabName ? 'bg-brand-gray text-white' : 'bg-brand-dark text-gray-400 hover:bg-gray-800'}`}
      >
          {label}
          {count && count > 0 && (
            <span className="bg-brand-red text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {count > 9 ? '9+' : count}
            </span>
          )}
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
            <TabButton tabName='financials' label="Financials" />
            <TabButton tabName='reports' label="Reports" />
            <TabButton tabName='whatsapp' label="WhatsApp" />
            <TabButton tabName='system' label="System Status" />
            <TabButton tabName='notifications' label="Notifications" count={totalPendingNotifications} />
            <TabButton tabName='activity' label="Activity Log" />
        </div>
        <div className="bg-brand-gray p-6 rounded-b-lg">
            {renderContent()}
        </div>
    </div>
  );
};

export default AdminDashboard;


import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { GymClass, UserRole, NotificationStatus, Coach } from '../../types';
import CoachCard from '../ui/CoachCard';
import Button from '../ui/Button';
import CoachAvailabilityManager from './CoachAvailabilityManager';
import ClassDetailsModal from './ClassDetailsModal';
import CalendarView from './CalendarView';
import CoachScheduleView from './CoachScheduleView';
import NotificationsPanel from './NotificationsPanel';
import FinancialsDashboard from './FinancialsDashboard';
import WhatsAppControlPanel from './WhatsAppControlPanel';
import AvatarUpload from './AvatarUpload';
import CoachProfileEditor from './CoachProfileEditor';
import CoachSignupLink from './CoachSignupLink';

type CoachTab = 'classes' | 'calendar' | 'availability' | 'notifications' | 'financials' | 'whatsapp' | 'signup';

interface CoachDashboardProps {
  coachToView?: Coach;
}


const CoachDashboard: React.FC<CoachDashboardProps> = ({ coachToView }) => {
    const { currentUser } = useAuth();
    const { classes, bookings, notifications, bookingAlerts, updateCoach, coaches } = useData();
    const [selectedClass, setSelectedClass] = useState<GymClass | null>(null);
    const [activeTab, setActiveTab] = useState<CoachTab>('classes');
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    // Get the coach from the coaches array to ensure we have the latest data
    const coachForDashboard = useMemo(() => {
        const targetCoach = coachToView || (currentUser?.role !== UserRole.MEMBER ? currentUser : null);
        if (!targetCoach) {
            console.warn('[CoachDashboard] No target coach found', { coachToView, currentUser });
            return null;
        }
        // Find the latest version from the coaches array, or fall back to the passed coach
        const foundCoach = coaches.find(c => c.id === targetCoach.id);
        if (!foundCoach && coaches.length > 0) {
            console.warn('[CoachDashboard] Coach not found in coaches array, using passed coach', { 
                coachId: targetCoach.id, 
                coachName: targetCoach.name,
                coachesCount: coaches.length 
            });
        }
        return foundCoach || targetCoach;
    }, [coachToView, currentUser, coaches]);

    if (!coachForDashboard) {
        return (
            <div className="p-8 text-center">
                <p className="text-gray-400">Loading coach dashboard...</p>
                {coachToView && (
                    <p className="text-sm text-gray-500 mt-2">
                        Coach: {coachToView.name} (ID: {coachToView.id})
                    </p>
                )}
            </div>
        );
    }

    const coachClasses = classes.filter(c => c.coachId === coachForDashboard.id);
    const pendingTransferCount = notifications.filter(
        n => (coachForDashboard.role === UserRole.ADMIN ? true : n.targetCoachId === coachForDashboard.id) && n.status === NotificationStatus.PENDING
    ).length;
    const pendingBookingAlertCount = bookingAlerts.filter(alert => {
        if (coachForDashboard.role === UserRole.ADMIN) {
            return alert.status === 'PENDING';
        }
        return alert.status === 'PENDING' && alert.coachId === coachForDashboard.id;
    }).length;
    const pendingNotificationsCount = pendingTransferCount + pendingBookingAlertCount;

    const TabButton:React.FC<{tabName: CoachTab, label: string, count?: number}> = ({tabName, label, count}) => (
      <button
        onClick={() => setActiveTab(tabName)}
        className={`px-4 py-2 font-semibold rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === tabName ? 'bg-brand-gray text-white' : 'bg-brand-dark text-gray-400 hover:bg-gray-800'}`}
      >
          {label}
          {count && count > 0 && <span className="bg-brand-red text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{count}</span>}
      </button>
    );
    
    const renderContent = () => {
        switch (activeTab) {
            case 'classes':
                return (
                    <div>
                        <h2 className="text-2xl font-semibold text-white mb-4">My Classes</h2>
                        {coachClasses.length > 0 ? (
                            <div className="space-y-4">
                                {coachClasses.map(cls => {
                                    const classBookings = bookings.filter(b => b.classId === cls.id);
                                    return (
                                        <div 
                                            key={cls.id} 
                                            className="bg-brand-dark p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                                            onClick={() => setSelectedClass(cls)}
                                            aria-label={`View details for ${cls.name}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-xl font-bold text-white">{cls.name}</h3>
                                                    <p className="text-brand-red">{cls.day}, {cls.time}</p>
                                                    {cls.originalCoachId && <p className="text-xs text-yellow-400 italic">You are covering this class.</p>}
                                                </div>
                                                <div className="text-right flex-shrink-0 ml-4">
                                                     <p className="text-gray-300 font-semibold">
                                                        {classBookings.length} / {cls.capacity} Booked
                                                    </p>
                                                    <p className="text-sm text-blue-400 mt-1">Click to view details</p>
                                                </div>
                                            </div>
                                            <p className="text-gray-300 mt-2 text-sm">{cls.description}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-gray-400">You are not assigned to any classes.</p>
                        )}
                    </div>
                );
            case 'calendar':
                return (
                    <div>
                        <h2 className="text-2xl font-semibold text-white mb-4">My Schedule</h2>
                        <CoachScheduleView coachId={coachForDashboard.id} />
                    </div>
                );
            case 'availability':
                 return <CoachAvailabilityManager coach={coachForDashboard as Coach} />;
             case 'notifications':
                return <NotificationsPanel user={coachForDashboard} />;
            case 'financials':
                return <FinancialsDashboard user={coachForDashboard} />;
            case 'whatsapp':
                return (
                    <WhatsAppControlPanel 
                        coach={coachForDashboard as Coach} 
                        onUpdateCoach={updateCoach}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-8">
            
            <div>
                <h2 className="text-2xl font-semibold text-white mb-4">My Profile</h2>
                <div className="bg-brand-dark p-6 rounded-lg mb-4">
                    <AvatarUpload
                        key={coachForDashboard.id + (coachForDashboard.imageUrl || '')}
                        coach={coachForDashboard as Coach}
                        onAvatarUpdated={async (imageUrl) => {
                            const updatedCoach = { ...coachForDashboard, imageUrl } as Coach;
                            await updateCoach(updatedCoach);
                            // Force a small delay to ensure state updates
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }}
                    />
                </div>
                <div className="bg-brand-gray rounded-lg overflow-hidden shadow-lg p-6">
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-white">{coachForDashboard.name}</h3>
                        <p className="text-brand-red font-semibold">{coachForDashboard.level}</p>
                        <p className="text-gray-300 mt-2 text-sm">{coachForDashboard.bio}</p>
                    </div>
                </div>
                <div className="bg-brand-dark p-4 rounded-lg mt-4 text-sm">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-gray-300 border-b border-gray-700 pb-1">Private Details</h3>
                        <Button variant="secondary" onClick={() => setIsEditingProfile(true)}>
                            Edit Profile
                        </Button>
                    </div>
                    <div className="text-gray-400 space-y-1">
                        <p><strong>Mobile:</strong> {(coachForDashboard as Coach).mobileNumber || 'Not set'}</p>
                        <p><strong>Bank Details:</strong> {(coachForDashboard as Coach).bankDetails || 'Not set'}</p>
                    </div>
                </div>
            </div>
            
            {isEditingProfile && (
                <div className="mt-6">
                    <CoachProfileEditor
                        coach={coachForDashboard as Coach}
                        onClose={() => setIsEditingProfile(false)}
                    />
                </div>
            )}

            <div className="border-b border-gray-700 flex flex-wrap mt-8">
                <TabButton tabName="classes" label="My Classes" />
                <TabButton tabName="calendar" label="Calendar View" />
                <TabButton tabName="availability" label="Manage Availability" />
                <TabButton tabName="financials" label="Financials" />
                <TabButton tabName="notifications" label="Notifications" count={pendingNotificationsCount} />
                <TabButton tabName="whatsapp" label="WhatsApp" />
                <TabButton tabName="signup" label="Signup Link" />
            </div>
            <div className="bg-brand-gray p-6 rounded-b-lg -mt-8">
                {renderContent()}
            </div>
            
            {selectedClass && (
                <ClassDetailsModal
                    gymClass={selectedClass}
                    onClose={() => setSelectedClass(null)}
                />
            )}
        </div>
    );
};

export default CoachDashboard;

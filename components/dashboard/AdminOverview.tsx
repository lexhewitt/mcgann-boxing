import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import StatCard from '../ui/StatCard';
import Button from '../ui/Button';
import { GymClass, Member } from '../../types';
import ClassDetailsModal from './ClassDetailsModal';
import AdminCalendarView from './AdminCalendarView';

// Icons for Stat Cards
const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ClipboardListIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const UserGroupIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


interface AdminOverviewProps {
    setActiveTab: (tab: 'members' | 'coaches' | 'classes') => void;
}


const AdminOverview: React.FC<AdminOverviewProps> = ({ setActiveTab }) => {
  const { members, coaches, classes, bookings } = useData();
  const [selectedClass, setSelectedClass] = useState<GymClass | null>(null);

  const today = new Date().toLocaleString('en-US', { weekday: 'long' });
  const todaysClasses = classes
    .filter(c => c.day === today)
    .sort((a,b) => a.time.localeCompare(b.time));

  // Simulating recent members by taking the last 5
  const recentMembers = [...members].reverse().slice(0, 5);
  
  const activeMonthlyMembers = useMemo(() => {
    return members.filter(m => 
      m.membershipStatus === 'Monthly' && 
      m.membershipExpiry && 
      new Date(m.membershipExpiry) >= new Date()
    ).length;
  }, [members]);

  return (
    <>
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Members" value={members.length} icon={<UsersIcon />} />
        <StatCard title="Active Monthly" value={activeMonthlyMembers} icon={<CheckCircleIcon />} />
        <StatCard title="Active Coaches" value={coaches.length} icon={<UserGroupIcon />} />
        <StatCard title="Total Classes" value={classes.length} icon={<ClipboardListIcon />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Classes */}
        <div className="bg-brand-dark p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-bold text-white">Today's Schedule ({today})</h3>
                 <Button variant="secondary" className="text-xs" onClick={() => setActiveTab('classes')}>Manage Classes</Button>
            </div>
            {todaysClasses.length > 0 ? (
                <ul className="space-y-3">
                    {todaysClasses.map(cls => {
                        const spotsTaken = bookings.filter(b => b.classId === cls.id).length;
                        const coach = coaches.find(c => c.id === cls.coachId);
                        return (
                            <li key={cls.id} className="bg-brand-gray p-3 rounded-md flex justify-between items-center cursor-pointer hover:bg-gray-700 transition-colors" onClick={() => setSelectedClass(cls)}>
                                <div>
                                    <p className="font-semibold text-white">{cls.name}</p>
                                    <p className="text-sm text-gray-400">{cls.time} - {coach?.name}</p>
                                </div>
                                <span className="font-bold text-lg text-white">{spotsTaken} / <span className="text-gray-400">{cls.capacity}</span></span>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="text-gray-400 text-center py-4">No classes scheduled for today.</p>
            )}
        </div>
        
        {/* Recent Members */}
        <div className="bg-brand-dark p-6 rounded-lg">
             <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-bold text-white">Recent Members</h3>
                 <Button variant="secondary" className="text-xs" onClick={() => setActiveTab('members')}>Manage Members</Button>
            </div>
            {recentMembers.length > 0 ? (
                <ul className="space-y-3">
                    {recentMembers.map(member => (
                        <li key={member.id} className="bg-brand-gray p-3 rounded-md">
                            <p className="font-semibold text-white">{member.name}</p>
                            <p className="text-sm text-gray-400">{member.email}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-400">No members have joined yet.</p>
            )}
        </div>
      </div>

      {/* Calendar Section */}
      <div className="bg-brand-dark p-6 rounded-lg">
        <h3 className="text-xl font-bold text-white mb-4">Calendar</h3>
        <AdminCalendarView />
      </div>
    </div>
    {selectedClass && (
        <ClassDetailsModal
            gymClass={selectedClass}
            onClose={() => setSelectedClass(null)}
        />
    )}
    </>
  );
};

export default AdminOverview;

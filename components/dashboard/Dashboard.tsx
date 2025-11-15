import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, Coach } from '../../types';
import AdminDashboard from './AdminDashboard';
import CoachDashboard from './CoachDashboard';
import MemberDashboard from './MemberDashboard';
import Button from '../ui/Button';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [viewAsCoach, setViewAsCoach] = useState<Coach | null>(null);

  if (!currentUser) return <p>Loading...</p>;

  // If admin is viewing a specific coach's dashboard
  if (viewAsCoach) {
    return (
      <div>
        <div className="flex justify-between items-center mb-4 bg-brand-dark p-4 rounded-lg">
          <h2 className="text-2xl font-bold text-white">
            Viewing Dashboard for: <span className="text-brand-red">{viewAsCoach.name}</span>
          </h2>
          <Button variant="secondary" onClick={() => setViewAsCoach(null)}>
            &larr; Return to Admin View
          </Button>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700">
            <CoachDashboard coachToView={viewAsCoach} />
        </div>
      </div>
    );
  }

  // Default view for logged-in user
  return (
    <div>
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">Welcome back, <span className="text-brand-red">{currentUser.name}</span>!</h1>
      
      {currentUser.role === UserRole.ADMIN && <AdminDashboard setViewAsCoach={setViewAsCoach} />}
      
      {/* This block will now only show for the admin's own dashboard view, not during impersonation */}
      {(currentUser.role === UserRole.COACH || currentUser.role === UserRole.ADMIN) && (
        <div className={currentUser.role === UserRole.ADMIN ? "mt-12 pt-8 border-t border-gray-700" : ""}>
          {currentUser.role === UserRole.ADMIN && <h2 className="text-2xl font-bold text-white mb-4">My Coach Dashboard</h2>}
          <CoachDashboard />
        </div>
      )}

      {currentUser.role === UserRole.MEMBER && <MemberDashboard />}
    </div>
  );
};

export default Dashboard;
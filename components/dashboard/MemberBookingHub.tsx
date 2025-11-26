import React, { useMemo, useState } from 'react';
import BookingWizard from '../bookings/BookingWizard';
import ClassSchedule from './ClassSchedule';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

type BookingMode = 'member' | 'guest';

const MemberBookingHub: React.FC = () => {
  const { currentUser } = useAuth();
  const isMember = currentUser?.role === UserRole.MEMBER;
  const [mode, setMode] = useState<BookingMode>(isMember ? 'member' : 'guest');

  const tabOptions = useMemo(
    () => [
      { key: 'member', label: 'Book as member', description: 'Use your account & family roster.' },
      { key: 'guest', label: 'Guest checkout', description: 'Quick pay without linking to account.' },
    ],
    [],
  );

  if (!isMember) {
    return (
      <div className="bg-brand-gray p-4 rounded-3xl shadow-xl">
        <BookingWizard />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-brand-gray p-4 rounded-3xl shadow-xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Reserve a Class</h2>
            <p className="text-sm text-gray-300">Choose how you want to book.</p>
          </div>
          <div className="flex rounded-full bg-black/30 p-1">
            {tabOptions.map(option => (
              <button
                key={option.key}
                onClick={() => setMode(option.key as BookingMode)}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  mode === option.key ? 'bg-brand-red text-white' : 'text-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {mode === 'member'
            ? 'Bookings will be tied to your account so coaches can confirm inside the dashboard.'
            : 'Use this if you need to pay for someone who is not on your account yet.'}
        </p>
      </div>
      {mode === 'member' ? (
        <ClassSchedule viewMode="weekly" />
      ) : (
        <div className="bg-brand-gray p-4 rounded-3xl shadow-xl">
          <BookingWizard />
        </div>
      )}
    </div>
  );
};

export default MemberBookingHub;

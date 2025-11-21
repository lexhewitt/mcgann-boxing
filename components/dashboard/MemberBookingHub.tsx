import React, { useState } from 'react';
import ClassSchedule from './ClassSchedule';
import CoachScheduler from '../scheduling/CoachScheduler';

type BookingTab = 'classes' | 'private';

const MemberBookingHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<BookingTab>('classes');

  return (
    <div className="space-y-4">
      <div className="bg-brand-gray p-6 rounded-lg flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-gray-400 uppercase tracking-wide">Calendar Booking</p>
          <h2 className="text-2xl font-semibold text-white">Plan Classes & Sessions</h2>
          <p className="text-sm text-gray-400">
            Switch between the class timetable and private coaching calendar to reserve the slots you need.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('classes')}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              activeTab === 'classes'
                ? 'bg-brand-red text-white shadow-lg'
                : 'bg-black/30 text-gray-300 border border-gray-700 hover:bg-black/50'
            }`}
          >
            Book Classes
          </button>
          <button
            onClick={() => setActiveTab('private')}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              activeTab === 'private'
                ? 'bg-brand-red text-white shadow-lg'
                : 'bg-black/30 text-gray-300 border border-gray-700 hover:bg-black/50'
            }`}
          >
            Private Sessions
          </button>
        </div>
      </div>
      {activeTab === 'classes' ? <ClassSchedule /> : <CoachScheduler />}
    </div>
  );
};

export default MemberBookingHub;

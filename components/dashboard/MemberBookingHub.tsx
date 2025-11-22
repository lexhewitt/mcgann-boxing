import React from 'react';
import BookingWizard from '../bookings/BookingWizard';

const MemberBookingHub: React.FC = () => {
  return (
    <div className="bg-brand-gray p-4 rounded-3xl shadow-xl">
      <BookingWizard />
    </div>
  );
};

export default MemberBookingHub;

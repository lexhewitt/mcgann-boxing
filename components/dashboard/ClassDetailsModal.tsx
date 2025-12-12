
import React, { useState, useMemo } from 'react';
import { GymClass, Booking, UserRole, GuestBooking, Coach } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import TransferBookingModal from './TransferBookingModal';
import EditClassModal from './EditClassModal';
import AddMemberToClassModal from './AddMemberToClassModal';
import RequestCoverModal from './RequestCoverModal';

interface ClassDetailsModalProps {
  gymClass: GymClass;
  onClose: () => void;
  coachToView?: Coach; // Optional: when admin is viewing a specific coach's dashboard
}

const ClassDetailsModal: React.FC<ClassDetailsModalProps> = ({ gymClass, onClose, coachToView }) => {
  const { members, familyMembers, bookings, coaches, cancelBooking, cancelGuestBooking, undoClassTransfer, toggleAttendance, guestBookings } = useData();
  const { currentUser } = useAuth();
  
  // Determine the effective coach - use coachToView if provided (admin viewing coach), otherwise use currentUser
  const effectiveCoach = coachToView || currentUser;
  const [bookingToTransfer, setBookingToTransfer] = useState<Booking | null>(null);
  const [isEditingClass, setIsEditingClass] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isRequestingCover, setIsRequestingCover] = useState(false);

  const coach = coaches.find(c => c.id === gymClass.coachId);
  const originalCoach = coaches.find(c => c.id === gymClass.originalCoachId);
  const classBookings = bookings.filter(b => b.classId === gymClass.id);
  const confirmedGuestBookings = guestBookings.filter(
    gb => gb.serviceType === 'CLASS' && gb.referenceId === gymClass.id && gb.status === 'CONFIRMED'
  );
  const totalConfirmedCount = classBookings.length + confirmedGuestBookings.length;
  
  const allParticipants = useMemo(() => [...members, ...familyMembers], [members, familyMembers]);

  const bookedParticipants = classBookings.map(b => ({
    booking: b,
    participant: allParticipants.find(p => p.id === b.participantId),
  })).filter(item => !!item.participant);

  const isAuthorized = currentUser?.role === 'ADMIN' || 
                      effectiveCoach?.id === gymClass.coachId || 
                      (gymClass.coachIds && gymClass.coachIds.includes(effectiveCoach?.id || ''));
  const isClassFull = totalConfirmedCount >= gymClass.capacity;

  const handleRemove = async (bookingId: string) => {
    if (currentUser && window.confirm('Cancel this booking? Refunds are only issued 24 hours before the class.')) {
      const result = await cancelBooking(bookingId, currentUser, { allowLate: true });
      alert(result.message);
    }
  };
  
  const handleUndoTransfer = () => {
    if(currentUser && window.confirm("Are you sure you want to return this class to the original coach?")) {
        undoClassTransfer(gymClass.id, currentUser);
        onClose(); // Close modal after action
    }
  };

  const mainModalIsOpen = !bookingToTransfer && !isEditingClass && !isAddingMember && !isRequestingCover;

  return (
    <>
      <Modal isOpen={mainModalIsOpen} onClose={onClose} title={`Details for ${gymClass.name}`}>
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-white">{gymClass.name}</h3>
            <p className="text-gray-400">{gymClass.day} at {gymClass.time}</p>
            <p className="text-gray-400">Coach: {coach?.name}</p>
            {originalCoach && <p className="text-sm text-yellow-400 italic">Covering for: {originalCoach.name}</p>}
            <p className="text-gray-400">Bookings: {totalConfirmedCount} / {gymClass.capacity}</p>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <h4 className="font-semibold text-lg text-white mb-2">Booked Members</h4>
            <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
              {bookedParticipants.length > 0 ? (
                bookedParticipants.map(({ booking, participant }) => participant && (
                  <div key={booking.id} className="flex flex-col sm:flex-row justify-between sm:items-center bg-brand-dark p-3 rounded-md gap-2">
                    <div>
                      <p className="font-semibold text-white">{participant.name}</p>
                      {'email' in participant && <p className="text-xs text-gray-500">{participant.email}</p>}
                    </div>
                    {isAuthorized && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <label htmlFor={`attended-${booking.id}`} className="text-xs flex items-center gap-1 cursor-pointer text-gray-300 hover:text-white">
                            <input
                                type="checkbox"
                                id={`attended-${booking.id}`}
                                checked={!!booking.attended}
                                onChange={() => toggleAttendance(booking.id)}
                                className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-brand-red focus:ring-brand-red focus:ring-offset-brand-dark"
                            />
                            Attended
                          </label>
                          <span className={`px-2 py-1 text-xs font-bold rounded ${booking.paid ? 'bg-green-600' : 'bg-yellow-500'}`}>{booking.paid ? 'Paid' : 'Unpaid'}</span>
                          {booking.confirmationStatus === 'PENDING' && (
                            <span className="px-2 py-1 text-xs font-bold rounded bg-yellow-600 text-black">
                              Awaiting confirmation
                            </span>
                          )}
                          <Button variant="secondary" className="text-xs py-1 px-2" onClick={() => setBookingToTransfer(booking)}>Transfer</Button>
                          <Button variant="danger" className="text-xs py-1 px-2" onClick={() => handleRemove(booking.id)}>Remove</Button>
                        </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No members have booked this class yet.</p>
              )}
            </div>
            {confirmedGuestBookings.length > 0 && (
              <div className="mt-4 border-t border-gray-700 pt-3">
                <h5 className="font-semibold text-white mb-2 text-sm uppercase tracking-wide">Confirmed Guest Bookings</h5>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {confirmedGuestBookings.map((guest: GuestBooking) => (
                    <div key={guest.id} className="bg-black/40 p-3 rounded-md text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-white">{guest.participantName}</p>
                        <p className="text-xs text-gray-400">{guest.contactEmail} · {guest.contactPhone}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs font-bold rounded bg-green-600">Confirmed</span>
                        <Button variant="secondary" className="text-xs py-1 px-2" onClick={() => handleCancelGuest(guest.id)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t border-gray-700">
             <div className="flex gap-2">
                {isAuthorized && (
                    <Button onClick={() => setIsAddingMember(true)} disabled={isClassFull}>
                        {isClassFull ? 'Class Full' : 'Add Member'}
                    </Button>
                )}
                 {effectiveCoach?.role !== UserRole.MEMBER && !gymClass.originalCoachId && 
                  (effectiveCoach?.id === gymClass.coachId || (gymClass.coachIds && gymClass.coachIds.includes(effectiveCoach?.id || ''))) && (
                     <Button variant="secondary" onClick={() => setIsRequestingCover(true)}>Request Cover</Button>
                 )}
                 {gymClass.originalCoachId && (currentUser?.id === gymClass.originalCoachId || currentUser?.role === UserRole.ADMIN) && (
                     <Button variant="danger" onClick={handleUndoTransfer}>Undo Transfer</Button>
                 )}
            </div>
            <div className="flex justify-end gap-4">
                {currentUser?.role === UserRole.ADMIN && <Button variant="secondary" onClick={() => setIsEditingClass(true)}>Edit Class</Button>}
                <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        </div>
      </Modal>

      {bookingToTransfer && (
        <TransferBookingModal
          booking={bookingToTransfer}
          onClose={() => setBookingToTransfer(null)}
        />
      )}

      {isEditingClass && (
          <EditClassModal 
            isOpen={isEditingClass}
            onClose={() => setIsEditingClass(false)}
            gymClass={gymClass}
          />
      )}

      {isAddingMember && (
          <AddMemberToClassModal
            gymClass={gymClass}
            onClose={() => setIsAddingMember(false)}
          />
      )}

      {isRequestingCover && (
          <RequestCoverModal
            gymClass={gymClass}
            onClose={() => setIsRequestingCover(false)}
          />
      )}
    </>
  );
};

export default ClassDetailsModal;
  const handleCancelGuest = async (guestId: string) => {
    if (currentUser && window.confirm('Cancel this guest booking?')) {
      const result = await cancelGuestBooking(guestId, currentUser, { allowLate: true });
      alert(result.message);
    }
  };

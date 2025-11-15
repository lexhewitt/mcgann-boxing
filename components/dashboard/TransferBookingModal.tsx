
import React from 'react';
import { Booking } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface TransferBookingModalProps {
  booking: Booking;
  onClose: () => void;
}

const TransferBookingModal: React.FC<TransferBookingModalProps> = ({ booking, onClose }) => {
  const { classes, bookings, updateBooking, members } = useData();
  const { currentUser } = useAuth();

  const member = members.find(m => m.id === booking.memberId);

  const availableClasses = classes.filter(c => {
    if (c.id === booking.classId) return false;
    const spotsTaken = bookings.filter(b => b.classId === c.id).length;
    return c.capacity > spotsTaken;
  }).sort((a,b) => a.day.localeCompare(b.day) || a.time.localeCompare(b.time));

  const handleTransfer = (newClassId: string) => {
    if (!currentUser) return;
    updateBooking(booking.id, newClassId, currentUser);
    alert(`${member?.name || 'Member'} has been transferred successfully.`);
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Transfer ${member?.name || 'Booking'}`}>
        <div className="space-y-4">
            <p className="text-gray-400">Select a new class from the available options below.</p>
             <div className="max-h-80 overflow-y-auto pr-2 space-y-2">
                {availableClasses.length > 0 ? (
                    availableClasses.map(cls => {
                         const spotsTaken = bookings.filter(b => b.classId === cls.id).length;
                         const spotsLeft = cls.capacity - spotsTaken;
                        return (
                           <div key={cls.id} className="flex justify-between items-center bg-brand-dark p-3 rounded-md">
                                <div>
                                    <p className="font-semibold text-white">{cls.name}</p>
                                    <p className="text-xs text-gray-400">{cls.day} at {cls.time} ({spotsLeft} spots left)</p>
                                </div>
                                <Button className="text-xs py-1 px-2" onClick={() => handleTransfer(cls.id)}>Select</Button>
                           </div>
                        )
                    })
                ) : (
                    <p className="text-center text-gray-500 py-4">No other classes with open spots are available for transfer.</p>
                )}
             </div>
             <div className="flex justify-end pt-4">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
             </div>
        </div>
    </Modal>
  );
};

export default TransferBookingModal;
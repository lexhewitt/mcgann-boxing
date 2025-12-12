
import React, { useState, useMemo } from 'react';
import { GymClass } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { isCoachAvailable, getNextDateForDay } from '../../utils/time';

interface RequestCoverModalProps {
  gymClass: GymClass;
  onClose: () => void;
}

const RequestCoverModal: React.FC<RequestCoverModalProps> = ({ gymClass, onClose }) => {
    const { coaches, classes, coachAvailability, unavailableSlots, createClassTransferRequest } = useData();
    const { currentUser } = useAuth();
    const [targetCoachId, setTargetCoachId] = useState('');
    const [note, setNote] = useState('');
    const [error, setError] = useState('');

    // Get all coaches except the current user
    const allOtherCoaches = useMemo(() => {
        return coaches.filter(coach => coach.id !== currentUser?.id);
    }, [coaches, currentUser]);

    const availableCoaches = useMemo(() => {
        const nextClassDate = getNextDateForDay(gymClass.day);
        return coaches.filter(coach => {
            if (coach.id === currentUser?.id) return false; // Can't request self

            const availabilityCheck = isCoachAvailable({
                coachId: coach.id,
                day: gymClass.day,
                time: gymClass.time,
                allClasses: classes,
                coachAvailability,
                unavailableSlots,
                checkDate: nextClassDate,
            });
            return availabilityCheck.isAvailable;
        });
    }, [coaches, gymClass, classes, coachAvailability, unavailableSlots, currentUser]);

    // Find admin (Sean) to include as an option
    const adminCoach = useMemo(() => {
        return coaches.find(c => c.role === 'ADMIN');
    }, [coaches]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!targetCoachId) {
            setError('Please select a coach to send the request to.');
            return;
        }
        if (!currentUser) return;
        
        createClassTransferRequest(gymClass.id, targetCoachId, note, currentUser);
        alert('Cover request sent successfully!');
        onClose();
    };


    return (
        <Modal isOpen={true} onClose={onClose} title={`Request Cover for ${gymClass.name}`}>
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div>
                    <p className="font-semibold text-white">Class Details:</p>
                    <p className="text-gray-300">{gymClass.day} at {gymClass.time}</p>
                </div>
                
                <div>
                    <label htmlFor="coach-select" className="block text-sm font-medium text-gray-300 mb-1">
                        Select a coach to request cover from
                    </label>
                    <select
                        id="coach-select"
                        value={targetCoachId}
                        onChange={(e) => setTargetCoachId(e.target.value)}
                        className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white"
                        required
                    >
                        <option value="">-- Choose a coach --</option>
                        {availableCoaches.length > 0 && (
                            <optgroup label="Available Coaches">
                                {availableCoaches.map(coach => (
                                    <option key={coach.id} value={coach.id}>
                                        {coach.name} {coach.role === 'ADMIN' ? '(Admin)' : ''}
                                    </option>
                                ))}
                            </optgroup>
                        )}
                        {allOtherCoaches.length > availableCoaches.length && (
                            <optgroup label="Other Coaches (may have conflicts)">
                                {allOtherCoaches
                                    .filter(c => !availableCoaches.find(ac => ac.id === c.id))
                                    .map(coach => (
                                        <option key={coach.id} value={coach.id}>
                                            {coach.name} {coach.role === 'ADMIN' ? '(Admin)' : ''} - May have schedule conflict
                                        </option>
                                    ))}
                            </optgroup>
                        )}
                    </select>
                    {availableCoaches.length === 0 && allOtherCoaches.length > 0 && (
                        <p className="text-sm text-yellow-400 mt-2">
                            ⚠️ No coaches appear available at this time, but you can still request cover. Sean (Admin) will be notified and can assign someone.
                        </p>
                    )}
                    {allOtherCoaches.length === 0 && (
                        <p className="text-sm text-yellow-400 mt-2">
                            No other coaches in the system. Contact Sean (Admin) directly.
                        </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                        💡 Sean (Admin) will be notified and can accept/assign the request even if you select another coach.
                    </p>
                </div>
                
                <div>
                    <label htmlFor="request-note" className="block text-sm font-medium text-gray-300 mb-1">
                        Add a note (Optional)
                    </label>
                    <textarea
                        id="request-note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                        className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-red"
                        placeholder="e.g., 'Hey, something came up, would you be able to cover for me?'"
                    />
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={!targetCoachId || allOtherCoaches.length === 0}>
                        Send Request
                    </Button>
                </div>
            </form>
        </Modal>
    )
};

export default RequestCoverModal;
import React, { useState, useMemo } from 'react';
import { GymClass, Member } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { getNextClassDateTime } from '../../utils/time';

interface AddMemberToClassModalProps {
  gymClass: GymClass;
  onClose: () => void;
}

const AddMemberToClassModal: React.FC<AddMemberToClassModalProps> = ({ gymClass, onClose }) => {
    const { members, bookings, addBooking } = useData();
    const { currentUser } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');

    const availableMembers = useMemo(() => {
        // FIX: Use participantId to correctly identify who is already booked in the class.
        const bookedParticipantIds = new Set(
            bookings.filter(b => b.classId === gymClass.id).map(b => b.participantId)
        );
        return members
            .filter(m => !bookedParticipantIds.has(m.id))
            .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [members, bookings, gymClass.id, searchTerm]);

    const handleAddMember = (member: Member) => {
        if (!currentUser) return;
        
        // When an admin/coach adds a member, default payment status to 'Unpaid'
        // FIX: Added missing 'participantId' to the addBooking call.
        const nextSession = getNextClassDateTime(gymClass);
        addBooking({ memberId: member.id, participantId: member.id, classId: gymClass.id, sessionStart: nextSession.toISOString(), paid: false }, currentUser);
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Add Member to ${gymClass.name}`}>
            <div className="space-y-4">
                <Input 
                    label="Search for a member"
                    id="member-search"
                    placeholder="Type name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="max-h-80 overflow-y-auto pr-2 space-y-2">
                    {availableMembers.length > 0 ? (
                        availableMembers.map(member => (
                            <div key={member.id} className="flex justify-between items-center bg-brand-dark p-3 rounded-md">
                                <div>
                                    <p className="font-semibold text-white">{member.name}</p>
                                    <p className="text-xs text-gray-400">{member.email}</p>
                                </div>
                                <Button className="text-xs py-1 px-2" onClick={() => handleAddMember(member)}>
                                    Add
                                </Button>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-4">No available members found.</p>
                    )}
                </div>
                <div className="flex justify-end pt-4">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                </div>
            </div>
        </Modal>
    );
};

export default AddMemberToClassModal;

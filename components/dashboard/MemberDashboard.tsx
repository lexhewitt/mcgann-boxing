
import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Coach, Member, UserRole, FamilyMember } from '../../types';
import ClassSchedule from './ClassSchedule';
import Button from '../ui/Button';
import AddFamilyMemberModal from './AddFamilyMemberModal';
import { calculateAge } from '../../utils/helpers';
import GymAccess from './GymAccess';
import MemberFinancialSummary from './MemberFinancialSummary';
import CoachScheduler from '../scheduling/CoachScheduler';

const HealthAndSafetyNotice: React.FC = () => (
    <div className="bg-yellow-900/20 border-l-4 border-yellow-500 text-yellow-300 p-4 rounded-lg my-8 lg:col-span-3">
      <div className="flex">
        <div className="py-1">
          <svg className="fill-current h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-11a1 1 0 012 0v4a1 1 0 01-2 0V7zm1 6a1 1 0 110-2 1 1 0 010 2z"/>
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-white">Your Health & Safety Commitment</h3>
          <p className="text-sm mt-1">
            Your well-being is our top priority. By booking a class, you are responsible for notifying coaches that you are in good health to participate. Please review our <a href="#" className="font-semibold underline hover:text-white">Health and Safety Policy</a> for guidelines on gym etiquette.
          </p>
          <p className="text-sm mt-2">
            <strong>Important:</strong> Always ask a qualified coach for help before using any unfamiliar equipment at the gym.
          </p>
        </div>
      </div>
    </div>
);


const MemberDashboard: React.FC = () => {
    const { currentUser, updateCurrentUser } = useAuth();
    const { members, bookings, classes, coaches, familyMembers, deleteFamilyMember, transactions, coachAppointments, coachSlots, cancelBooking, cancelCoachAppointment } = useData();
    const [isEditing, setIsEditing] = useState(false);
    const [isAddFamilyMemberOpen, setAddFamilyMemberOpen] = useState(false);
    
    if (!currentUser || currentUser.role !== UserRole.MEMBER) return null;
    
    const [formData, setFormData] = useState<Member>(currentUser as Member);

    const memberBookings = bookings.filter(b => b.memberId === currentUser.id);
    const paymentHistory = bookings.filter(b => b.memberId === currentUser.id && b.paid);
    const upcomingPrivateSessions = useMemo(() => {
        const now = new Date();
        return coachAppointments
            .map(appt => ({ appt, slot: coachSlots.find(slot => slot.id === appt.slotId) }))
            .filter(item => item.slot && item.appt.memberId === currentUser.id && new Date(item.slot!.start) > now)
            .sort((a, b) => new Date(a.slot!.start).getTime() - new Date(b.slot!.start).getTime());
    }, [coachAppointments, coachSlots, currentUser.id]);
    const memberTransactions = useMemo(
        () => transactions.filter(tx => tx.memberId === currentUser.id),
        [transactions, currentUser.id],
    );
    const cancellationWindowMs = 24 * 60 * 60 * 1000;

    const memberFamily = useMemo(() => 
        familyMembers.filter(fm => fm.parentId === currentUser.id), 
    [familyMembers, currentUser.id]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value } as Member));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateCurrentUser(formData);
        setIsEditing(false);
    };

    const allParticipants = useMemo(() => 
        [...members, ...familyMembers], [members, familyMembers]);
        
    const getMembershipDisplay = () => {
        const member = currentUser as Member;
        if (member.membershipStatus === 'Monthly') {
            const expiry = member.membershipExpiry ? new Date(member.membershipExpiry) : null;
            if (expiry && expiry >= new Date()) {
                return <p><strong>Membership:</strong> <span className="text-green-400">Monthly (Renews on {expiry.toLocaleDateString()})</span></p>;
            }
            return <p><strong>Membership:</strong> <span className="text-yellow-400">Monthly (Expired)</span></p>;
        }
        if (member.membershipStatus === 'PAYG') {
            return <p><strong>Membership:</strong> <span className="text-blue-400">Pay As You Go</span></p>;
        }
        return <p><strong>Membership:</strong> <span className="text-gray-400">None</span></p>;
    }

    const canCancelBooking = (sessionStart?: string) => {
        if (!sessionStart) return false;
        return new Date(sessionStart).getTime() - Date.now() >= cancellationWindowMs;
    };

    const handleCancelClassBooking = async (bookingId: string) => {
        const result = await cancelBooking(bookingId, currentUser);
        alert(result.message);
    };

    const handleCancelSession = async (appointmentId: string) => {
        const result = await cancelCoachAppointment(appointmentId, currentUser);
        alert(result.message);
    };

    return (
        <div className="space-y-8">
        <MemberFinancialSummary
            member={currentUser as Member}
            transactions={transactions}
            embedded
        />
        <HealthAndSafetyNotice />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <CoachScheduler />
                <div>
                    <h2 className="text-2xl font-semibold text-white mb-4">Book a Class</h2>
                    <ClassSchedule />
                </div>
                 <div>
                    <h2 className="text-2xl font-semibold text-white mb-4">My Upcoming Bookings</h2>
                    <div className="bg-brand-gray p-4 rounded-lg">
                        {memberBookings.length > 0 ? (
                            <ul className="space-y-2">
                                {memberBookings.map(booking => {
                                    const cls = classes.find(c => c.id === booking.classId);
                                    const participant = allParticipants.find(p => p.id === booking.participantId);
                                    const bookingTransaction = memberTransactions.find(tx => tx.bookingId === booking.id);
                                    const confirmationStatus = bookingTransaction?.confirmationStatus ?? booking.confirmationStatus;
                                    const statusLabel = !booking.paid
                                        ? 'Unpaid'
                                        : confirmationStatus === 'PENDING'
                                            ? 'Awaiting confirmation'
                                            : confirmationStatus === 'CANCELED'
                                                ? 'Canceled'
                                                : 'Confirmed';
                                    const statusClass = !booking.paid
                                        ? 'bg-yellow-500 text-black'
                                        : confirmationStatus === 'PENDING'
                                            ? 'bg-yellow-600 text-black'
                                            : confirmationStatus === 'CANCELED'
                                                ? 'bg-gray-600'
                                                : 'bg-green-600';
                                    const showCancel = booking.paid && confirmationStatus !== 'CANCELED' && canCancelBooking(booking.sessionStart);
                                    return (
                                        <li key={booking.id} className="flex flex-col gap-2 bg-brand-dark p-3 rounded md:flex-row md:items-center md:justify-between">
                                            <div>
                                                <p className="font-bold">{cls?.name}</p>
                                                <p className="text-sm text-gray-400">
                                                    {cls?.day} at {cls?.time} {booking.participantId !== currentUser.id && `(for ${participant?.name})`}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 text-xs font-bold rounded ${statusClass}`}>{statusLabel}</span>
                                                {showCancel && (
                                                    <Button variant="secondary" className="text-xs py-1 px-2" onClick={() => handleCancelClassBooking(booking.id)}>
                                                        Cancel
                                                    </Button>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className="text-gray-400">You have no upcoming classes booked.</p>
                        )}
                    </div>
                </div>
                <div>
                    <h2 className="text-2xl font-semibold text-white mb-4">Booking History</h2>
                    <div className="bg-brand-gray p-4 rounded-lg">
                        {paymentHistory.length > 0 ? (
                            <ul className="space-y-2">
                                {paymentHistory.map(booking => {
                                    const cls = classes.find(c => c.id === booking.classId);
                                    const bookingTransaction = memberTransactions.find(tx => tx.bookingId === booking.id);
                                    const confirmationStatus = bookingTransaction?.confirmationStatus === 'PENDING' ? 'Awaiting confirmation' : 'Confirmed';
                                    return (
                                        <li key={booking.id} className="flex justify-between items-center bg-brand-dark p-3 rounded">
                                            <div>
                                                <p className="font-bold">{cls?.name}</p>
                                                <p className="text-sm text-gray-400">
                                                    Paid on: {new Date(booking.bookingDate).toLocaleDateString()}
                                                </p>
                                                <p className="text-xs text-gray-500">{confirmationStatus}</p>
                                            </div>
                                            <span className="font-semibold text-green-400">
                                                £{cls?.price?.toFixed(2) || 'N/A'}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className="text-gray-400">You have no payment history.</p>
                        )}
                    </div>
                </div>
                {upcomingPrivateSessions.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-semibold text-white mb-4">My Private Sessions</h2>
                        <div className="bg-brand-gray p-4 rounded-lg">
                            <ul className="space-y-2">
                                {upcomingPrivateSessions.map(({ appt, slot }) => {
                                    if (!slot) return null;
                                    const coach = coaches.find(c => c.id === slot.coachId);
                                    const canCancel = new Date(slot.start).getTime() - Date.now() >= cancellationWindowMs;
                                    return (
                                        <li key={appt.id} className="flex flex-col gap-2 bg-brand-dark p-3 rounded md:flex-row md:items-center md:justify-between">
                                            <div>
                                                <p className="font-bold">{slot.title}</p>
                                                <p className="text-sm text-gray-400">
                                                    {new Date(slot.start).toLocaleString()} with {coach?.name ?? 'Coach'}
                                                </p>
                                            </div>
                        <div className="flex items-center gap-2">
                                                <span className="px-2 py-1 text-xs font-bold rounded bg-yellow-600 text-black">
                                                    Awaiting confirmation
                                                </span>
                                                {canCancel && (
                                                    <Button variant="secondary" className="text-xs py-1 px-2" onClick={() => handleCancelSession(appt.id)}>
                                                        Cancel
                                                    </Button>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                <div className="bg-brand-gray p-6 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold text-white">My Profile</h2>
                        <Button onClick={() => setIsEditing(!isEditing)} variant="secondary">{isEditing ? 'Cancel' : 'Edit'}</Button>
                    </div>
                    {isEditing ? (
                        <form onSubmit={handleSave} className="space-y-4">
                            <input name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-brand-dark p-2 rounded" />
                            <label className="text-sm text-gray-400">Date of Birth</label>
                            <input name="dob" type="date" value={formData.dob} onChange={handleInputChange} className="w-full bg-brand-dark p-2 rounded" />
                            <select name="sex" value={formData.sex} onChange={handleInputChange} className="w-full bg-brand-dark p-2 rounded">
                                <option value="M">Male</option>
                                <option value="F">Female</option>
                            </select>
                            <select name="ability" value={formData.ability} onChange={handleInputChange} className="w-full bg-brand-dark p-2 rounded">
                                <option>Beginner</option>
                                <option>Intermediate</option>
                                <option>Advanced</option>
                                <option>Competitive</option>
                            </select>
                            <textarea name="bio" value={formData.bio} onChange={handleInputChange} className="w-full bg-brand-dark p-2 rounded" rows={3}></textarea>
                            <select name="coachId" value={formData.coachId || ''} onChange={handleInputChange} className="w-full bg-brand-dark p-2 rounded">
                                <option value="">Select a coach</option>
                                {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <Button type="submit">Save Changes</Button>
                        </form>
                    ) : (
                        <div className="space-y-3 text-gray-300">
                            <p><strong>Email:</strong> {currentUser.email}</p>
                            {getMembershipDisplay()}
                            <p><strong>Age:</strong> {calculateAge(currentUser.dob)}</p>
                            <p><strong>Sex:</strong> {currentUser.sex}</p>
                            <p><strong>Ability:</strong> {currentUser.ability}</p>
                             {currentUser.isCarded && <p><strong>Status:</strong> <span className="font-bold text-brand-red">Carded Boxer</span></p>}
                            <p><strong>Bio:</strong> {currentUser.bio}</p>
                            <p><strong>Coach:</strong> {coaches.find(c=>c.id === currentUser.coachId)?.name || 'None selected'}</p>
                        </div>
                    )}
                </div>

                <GymAccess />

                <div className="bg-brand-gray p-6 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold text-white">Family Members</h2>
                        <Button onClick={() => setAddFamilyMemberOpen(true)}>Add Child</Button>
                    </div>
                    <div className="space-y-3">
                        {memberFamily.length > 0 ? (
                            memberFamily.map(child => (
                                <div key={child.id} className="flex justify-between items-center bg-brand-dark p-3 rounded">
                                    <div>
                                        <p className="font-semibold">{child.name}</p>
                                        <p className="text-sm text-gray-400">Age: {calculateAge(child.dob)}</p>
                                    </div>
                                    <Button variant="danger" className="text-xs py-1 px-2" onClick={() => window.confirm(`Remove ${child.name}?`) && deleteFamilyMember(child.id)}>Remove</Button>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400">No family members added yet. Add children to book them into kids classes.</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
        <AddFamilyMemberModal 
            isOpen={isAddFamilyMemberOpen} 
            onClose={() => setAddFamilyMemberOpen(false)} 
        />
        </div>
    );
};

export default MemberDashboard;

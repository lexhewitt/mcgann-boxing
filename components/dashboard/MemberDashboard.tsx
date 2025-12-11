
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Coach, Member, UserRole, FamilyMember } from '../../types';
import MemberBookingHub from './MemberBookingHub';
import Button from '../ui/Button';
import AddFamilyMemberModal from './AddFamilyMemberModal';
import { calculateAge } from '../../utils/helpers';
import GymAccess from './GymAccess';
import MemberFinancialSummary from './MemberFinancialSummary';

const HealthAndSafetyNotice: React.FC = () => (
    <div className="bg-yellow-900/20 border-l-4 border-yellow-500 text-yellow-300 p-4 rounded-lg">
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
    const { members, bookings, classes, coaches, familyMembers, deleteFamilyMember, transactions, coachAppointments, coachSlots, cancelBooking, cancelCoachAppointment, refreshData } = useData();
    const [isEditing, setIsEditing] = useState(false);
    const [isAddFamilyMemberOpen, setAddFamilyMemberOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            refreshData();
        }, 30000);
        return () => clearInterval(interval);
    }, [refreshData]);
    
    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshData();
        setIsRefreshing(false);
    };
    
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
        <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-brand-gray p-6 rounded-3xl">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white">{currentUser.name}</h1>
                        <p className="text-gray-400 mt-1">{currentUser.email}</p>
                        <div className="mt-2 text-sm text-gray-300">
                            {getMembershipDisplay()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial Summary Section */}
            <div className="bg-brand-gray p-6 rounded-3xl">
                <MemberFinancialSummary
                    member={currentUser as Member}
                    transactions={transactions}
                    embedded
                />
            </div>

            {/* Health & Safety Notice */}
            <HealthAndSafetyNotice />

            {/* Refresh Button */}
            <div className="flex justify-end mb-4">
                <Button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="text-sm"
                >
                    {isRefreshing ? 'Refreshing...' : '🔄 Refresh'}
                </Button>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Bookings & Activities */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Book a Class Section */}
                    <div className="bg-brand-gray p-6 rounded-3xl">
                        <MemberBookingHub />
                    </div>

                    {/* Upcoming Bookings Section */}
                    <div className="bg-brand-gray p-6 rounded-3xl">
                        <h2 className="text-2xl font-semibold text-white mb-4">Upcoming Bookings</h2>
                        <div className="space-y-3">
                            {memberBookings.length > 0 ? (
                                memberBookings.map(booking => {
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
                                        <div key={booking.id} className="bg-brand-dark p-4 rounded-xl border border-gray-700 hover:border-gray-600 transition">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-white text-lg">{cls?.name}</h3>
                                                    <p className="text-sm text-gray-400 mt-1">
                                                        {cls?.day} at {cls?.time}
                                                        {booking.participantId !== currentUser.id && ` · For ${participant?.name}`}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-3 py-1 text-xs font-bold rounded ${statusClass}`}>
                                                        {statusLabel}
                                                    </span>
                                                    {showCancel && (
                                                        <Button 
                                                            variant="secondary" 
                                                            className="text-xs py-1.5 px-3" 
                                                            onClick={() => handleCancelClassBooking(booking.id)}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="bg-brand-dark p-6 rounded-xl text-center border border-gray-700">
                                    <p className="text-gray-400">No upcoming classes booked.</p>
                                    <p className="text-sm text-gray-500 mt-2">Book a class using the booking hub above.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Private Sessions Section */}
                    {upcomingPrivateSessions.length > 0 && (
                        <div className="bg-brand-gray p-6 rounded-3xl">
                            <h2 className="text-2xl font-semibold text-white mb-4">Private Sessions</h2>
                            <div className="space-y-3">
                                {upcomingPrivateSessions.map(({ appt, slot }) => {
                                    if (!slot) return null;
                                    const coach = coaches.find(c => c.id === slot.coachId);
                                    const canCancel = new Date(slot.start).getTime() - Date.now() >= cancellationWindowMs;
                                    return (
                                        <div key={appt.id} className="bg-brand-dark p-4 rounded-xl border border-gray-700 hover:border-gray-600 transition">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-white text-lg">{slot.title}</h3>
                                                    <p className="text-sm text-gray-400 mt-1">
                                                        {new Date(slot.start).toLocaleString()} with {coach?.name ?? 'Coach'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="px-3 py-1 text-xs font-bold rounded bg-yellow-600 text-black">
                                                        Awaiting confirmation
                                                    </span>
                                                    {canCancel && (
                                                        <Button 
                                                            variant="secondary" 
                                                            className="text-xs py-1.5 px-3" 
                                                            onClick={() => handleCancelSession(appt.id)}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Booking History Section */}
                    <div className="bg-brand-gray p-6 rounded-3xl">
                        <h2 className="text-2xl font-semibold text-white mb-4">Booking History</h2>
                        <div className="space-y-3">
                            {paymentHistory.length > 0 ? (
                                paymentHistory.map(booking => {
                                    const cls = classes.find(c => c.id === booking.classId);
                                    const bookingTransaction = memberTransactions.find(tx => tx.bookingId === booking.id);
                                    const confirmationStatus = bookingTransaction?.confirmationStatus === 'PENDING' ? 'Awaiting confirmation' : 'Confirmed';
                                    return (
                                        <div key={booking.id} className="bg-brand-dark p-4 rounded-xl border border-gray-700">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h3 className="font-semibold text-white">{cls?.name}</h3>
                                                    <p className="text-sm text-gray-400 mt-1">
                                                        Paid on {new Date(booking.bookingDate).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">{confirmationStatus}</p>
                                                </div>
                                                <span className="font-semibold text-green-400 text-lg">
                                                    £{cls?.price?.toFixed(2) || 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="bg-brand-dark p-6 rounded-xl text-center border border-gray-700">
                                    <p className="text-gray-400">No booking history yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Profile & Settings */}
                <div className="space-y-6">
                    {/* Profile Section */}
                    <div className="bg-brand-gray p-6 rounded-3xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold text-white">My Profile</h2>
                            <Button onClick={() => setIsEditing(!isEditing)} variant="secondary" className="text-sm">
                                {isEditing ? 'Cancel' : 'Edit'}
                            </Button>
                        </div>
                        {isEditing ? (
                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Name</label>
                                    <input 
                                        name="name" 
                                        value={formData.name} 
                                        onChange={handleInputChange} 
                                        className="w-full bg-brand-dark p-2 rounded text-white" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Date of Birth</label>
                                    <input 
                                        name="dob" 
                                        type="date" 
                                        value={formData.dob} 
                                        onChange={handleInputChange} 
                                        className="w-full bg-brand-dark p-2 rounded text-white" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Sex</label>
                                    <select 
                                        name="sex" 
                                        value={formData.sex} 
                                        onChange={handleInputChange} 
                                        className="w-full bg-brand-dark p-2 rounded text-white"
                                    >
                                        <option value="M">Male</option>
                                        <option value="F">Female</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Ability Level</label>
                                    <select 
                                        name="ability" 
                                        value={formData.ability} 
                                        onChange={handleInputChange} 
                                        className="w-full bg-brand-dark p-2 rounded text-white"
                                    >
                                        <option>Beginner</option>
                                        <option>Intermediate</option>
                                        <option>Advanced</option>
                                        <option>Competitive</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Bio</label>
                                    <textarea 
                                        name="bio" 
                                        value={formData.bio} 
                                        onChange={handleInputChange} 
                                        className="w-full bg-brand-dark p-2 rounded text-white" 
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Coach</label>
                                    <select 
                                        name="coachId" 
                                        value={formData.coachId || ''} 
                                        onChange={handleInputChange} 
                                        className="w-full bg-brand-dark p-2 rounded text-white"
                                    >
                                        <option value="">Select a coach</option>
                                        {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <Button type="submit" className="w-full">Save Changes</Button>
                            </form>
                        ) : (
                            <div className="space-y-3 text-gray-300">
                                <div className="grid grid-cols-1 gap-3">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email</p>
                                        <p className="text-white">{currentUser.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Age</p>
                                        <p className="text-white">{calculateAge(currentUser.dob)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Sex</p>
                                        <p className="text-white">{currentUser.sex}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Ability</p>
                                        <p className="text-white">{currentUser.ability}</p>
                                    </div>
                                    {currentUser.isCarded && (
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</p>
                                            <p className="text-brand-red font-bold">Carded Boxer</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Bio</p>
                                        <p className="text-white">{currentUser.bio || 'No bio provided'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Coach</p>
                                        <p className="text-white">{coaches.find(c=>c.id === currentUser.coachId)?.name || 'None selected'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Gym Access Section */}
                    <div className="bg-brand-gray p-6 rounded-3xl">
                        <GymAccess />
                    </div>

                    {/* Family Members Section */}
                    <div className="bg-brand-gray p-6 rounded-3xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold text-white">Family Members</h2>
                            <Button onClick={() => setAddFamilyMemberOpen(true)} className="text-sm">Add Child</Button>
                        </div>
                        <div className="space-y-3">
                            {memberFamily.length > 0 ? (
                                memberFamily.map(child => (
                                    <div key={child.id} className="bg-brand-dark p-4 rounded-xl border border-gray-700 flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-white">{child.name}</p>
                                            <p className="text-sm text-gray-400">Age: {calculateAge(child.dob)}</p>
                                        </div>
                                        <Button 
                                            variant="danger" 
                                            className="text-xs py-1.5 px-3" 
                                            onClick={() => window.confirm(`Remove ${child.name}?`) && deleteFamilyMember(child.id)}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-brand-dark p-6 rounded-xl text-center border border-gray-700">
                                    <p className="text-gray-400 text-sm">No family members added yet.</p>
                                    <p className="text-xs text-gray-500 mt-2">Add children to book them into kids classes.</p>
                                </div>
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

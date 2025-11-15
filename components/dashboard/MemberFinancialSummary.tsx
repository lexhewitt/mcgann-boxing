import React, { useMemo } from 'react';
import { Member, Booking, GymClass, FamilyMember } from '../../types';
import StatCard from '../ui/StatCard';

interface MemberFinancialSummaryProps {
    member: Member;
    bookings: Booking[];
    classes: GymClass[];
    familyMembers: FamilyMember[];
    onClose?: () => void;
    embedded?: boolean;
}

const MemberFinancialSummary: React.FC<MemberFinancialSummaryProps> = ({
    member,
    bookings,
    classes,
    familyMembers,
    onClose,
    embedded = false,
}) => {
    const allParticipants = useMemo(
        () => [member, ...familyMembers.filter(fm => fm.parentId === member.id)],
        [member, familyMembers]
    );

    const memberBookings = useMemo(() => bookings
        .filter(booking => booking.memberId === member.id)
        .map(booking => {
            const cls = classes.find(c => c.id === booking.classId);
            const participant = allParticipants.find(p => p.id === booking.participantId);
            return { booking, cls, participant };
        })
        .filter(entry => entry.cls && entry.participant)
        .sort((a, b) => new Date(b.booking.bookingDate).getTime() - new Date(a.booking.bookingDate).getTime()),
    [bookings, classes, allParticipants, member.id]);

    const paidBookings = memberBookings.filter(entry => entry.booking.paid);
    const unpaidBookings = memberBookings.filter(entry => !entry.booking.paid);

    const startOfMonth = useMemo(() => {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        return start;
    }, []);

    const totalPaid = paidBookings.reduce((sum, entry) => sum + (entry.cls?.price || 0), 0);
    const paidThisMonth = paidBookings
        .filter(entry => new Date(entry.booking.bookingDate) >= startOfMonth)
        .reduce((sum, entry) => sum + (entry.cls?.price || 0), 0);
    const outstanding = unpaidBookings.reduce((sum, entry) => sum + (entry.cls?.price || 0), 0);

    const renderOutstanding = () => (
        <div className="bg-brand-dark p-5 rounded-lg">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">Outstanding Balance</h3>
                <span className="text-brand-red font-bold text-xl">£{outstanding.toFixed(2)}</span>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
                {unpaidBookings.length ? unpaidBookings.map(({ booking, cls, participant }) => (
                    <div key={booking.id} className="bg-brand-gray p-3 rounded-md flex items-center justify-between">
                        <div>
                            <p className="font-semibold">{cls?.name}</p>
                            <p className="text-xs text-gray-400">
                                Participant: {participant?.name} • Booked {new Date(booking.bookingDate).toLocaleDateString()}
                            </p>
                        </div>
                        <span className="font-bold text-brand-red text-lg">£{cls?.price.toFixed(2)}</span>
                    </div>
                )) : (
                    <p className="text-gray-400 text-sm text-center py-4">No outstanding payments. Great job staying up to date!</p>
                )}
            </div>
        </div>
    );

    const renderPaymentHistory = () => (
        <div className="bg-brand-dark p-5 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Payment History</h3>
            <div className="max-h-64 overflow-y-auto">
                {paidBookings.length ? (
                    <table className="min-w-full text-sm">
                        <thead className="text-left text-gray-400 text-xs uppercase">
                            <tr>
                                <th className="py-2 pr-3">Date</th>
                                <th className="py-2 pr-3">Class</th>
                                <th className="py-2 pr-3">Participant</th>
                                <th className="py-2 pr-3 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paidBookings.map(({ booking, cls, participant }) => (
                                <tr key={booking.id} className="border-b border-gray-800">
                                    <td className="py-2 pr-3">{new Date(booking.bookingDate).toLocaleDateString()}</td>
                                    <td className="py-2 pr-3">{cls?.name}</td>
                                    <td className="py-2 pr-3">{participant?.name}</td>
                                    <td className="py-2 pr-3 text-right font-semibold">£{cls?.price.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-gray-400 text-sm text-center py-4">No payments recorded yet.</p>
                )}
            </div>
        </div>
    );

    const wrapperClass = embedded ? '' : 'bg-brand-gray p-6 rounded-lg space-y-6';

    return (
        <div className={wrapperClass}>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wide">Member Financials</p>
                    <h2 className="text-2xl font-bold text-white">{member.name}</h2>
                    <p className="text-sm text-gray-400">{member.email}</p>
                </div>
                {!embedded && (
                    <button
                        className="text-sm text-brand-red font-semibold hover:underline"
                        onClick={onClose}
                    >
                        ← Back to Members
                    </button>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard title="Outstanding Balance" value={`£${outstanding.toFixed(2)}`} />
                <StatCard title="Paid This Month" value={`£${paidThisMonth.toFixed(2)}`} />
                <StatCard title="Lifetime Spend" value={`£${totalPaid.toFixed(2)}`} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {renderOutstanding()}
                {renderPaymentHistory()}
            </div>
        </div>
    );
};

export default MemberFinancialSummary;

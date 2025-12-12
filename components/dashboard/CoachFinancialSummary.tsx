import React, { useMemo } from 'react';
import { Coach, Booking, GymClass, Member } from '../../types';
import StatCard from '../ui/StatCard';

interface CoachFinancialSummaryProps {
    coach: Coach;
    bookings: Booking[];
    classes: GymClass[];
    members: Member[];
    onClose: () => void;
}

const CoachFinancialSummary: React.FC<CoachFinancialSummaryProps> = ({ coach, bookings, classes, members, onClose }) => {
    const paidBookings = useMemo(() => bookings.filter(b => b.paid), [bookings]);

    const coachBookings = useMemo(() => {
        return paidBookings
            .map(booking => {
                const gymClass = classes.find(c => c.id === booking.classId);
                const member = members.find(m => m.id === booking.memberId);
                return { booking, gymClass, member };
            })
            .filter(item => 
              item.gymClass && item.member && 
              (item.gymClass.coachId === coach.id || 
               (item.gymClass.coachIds && item.gymClass.coachIds.includes(coach.id)))
            )
            .sort((a, b) => new Date(b.booking.bookingDate).getTime() - new Date(a.booking.bookingDate).getTime());
    }, [paidBookings, coach.id, classes, members]);

    const startOfWeek = useMemo(() => {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
    }, []);

    const startOfMonth = useMemo(() => {
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        monthStart.setHours(0, 0, 0, 0);
        return monthStart;
    }, []);

    const weeklyBookings = useMemo(
        () => coachBookings.filter(item => new Date(item.booking.bookingDate) >= startOfWeek),
        [coachBookings, startOfWeek]
    );

    const monthlyBookings = useMemo(
        () => coachBookings.filter(item => new Date(item.booking.bookingDate) >= startOfMonth),
        [coachBookings, startOfMonth]
    );

    const totalTakings = (bookingsArr: typeof coachBookings) =>
        bookingsArr.reduce((sum, item) => sum + (item.gymClass?.price || 0), 0);

    const renderItemizedTable = (title: string, data: typeof coachBookings) => (
        <div className="bg-brand-dark p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <span className="text-brand-red font-bold">£{totalTakings(data).toFixed(2)}</span>
            </div>
            <div className="overflow-x-auto max-h-64 overflow-y-auto pr-2">
                {data.length ? (
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-400 text-xs uppercase">
                                <th className="py-2 px-2">Date</th>
                                <th className="py-2 px-2">Class</th>
                                <th className="py-2 px-2">Member</th>
                                <th className="py-2 px-2 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(({ booking, gymClass, member }) => (
                                <tr key={booking.id} className="border-b border-gray-800">
                                    <td className="py-2 px-2">{new Date(booking.bookingDate).toLocaleDateString()}</td>
                                    <td className="py-2 px-2">{gymClass?.name}</td>
                                    <td className="py-2 px-2">{member?.name}</td>
                                    <td className="py-2 px-2 text-right font-semibold">£{gymClass?.price?.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-gray-500 text-sm">No data available.</p>
                )}
            </div>
        </div>
    );

    return (
        <div className="bg-brand-gray p-6 rounded-lg space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wide">Financial Summary</p>
                    <h2 className="text-3xl font-bold text-white">{coach.name}</h2>
                </div>
                <button
                    className="text-sm text-brand-red hover:underline font-semibold"
                    onClick={onClose}
                >
                    ← Back to Financials
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="This Week" value={`£${totalTakings(weeklyBookings).toFixed(2)}`} />
                <StatCard title="This Month" value={`£${totalTakings(monthlyBookings).toFixed(2)}`} />
                <StatCard title="All Time" value={`£${totalTakings(coachBookings).toFixed(2)}`} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {renderItemizedTable('This Week', weeklyBookings)}
                {renderItemizedTable('This Month', monthlyBookings)}
            </div>
            <div>
                <h3 className="text-xl font-bold text-white mb-3">All Paid Bookings</h3>
                <div className="bg-brand-dark rounded-lg max-h-96 overflow-y-auto">
                    {coachBookings.length ? (
                        <table className="min-w-full text-sm">
                            <thead className="bg-black text-xs uppercase text-gray-400">
                                <tr>
                                    <th className="py-2 px-3 text-left">Date</th>
                                    <th className="py-2 px-3 text-left">Class</th>
                                    <th className="py-2 px-3 text-left">Member</th>
                                    <th className="py-2 px-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coachBookings.map(({ booking, gymClass, member }) => (
                                    <tr key={booking.id} className="border-b border-gray-800">
                                        <td className="py-2 px-3">{new Date(booking.bookingDate).toLocaleDateString()}</td>
                                        <td className="py-2 px-3">{gymClass?.name}</td>
                                        <td className="py-2 px-3">{member?.name}</td>
                                        <td className="py-2 px-3 text-right font-semibold">£{gymClass?.price?.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-center text-gray-500 py-6">No paid bookings recorded yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CoachFinancialSummary;

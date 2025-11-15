
import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { UserRole, Coach, Member, FamilyMember, AppUser } from '../../types';
import StatCard from '../ui/StatCard';

interface FinancialsDashboardProps {
    user?: AppUser | null;
}

const FinancialsDashboard: React.FC<FinancialsDashboardProps> = ({ user }) => {
    const { bookings, classes, coaches, members } = useData();

    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Monday as start
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const paidBookings = useMemo(() => bookings.filter(b => b.paid), [bookings]);
    
    const unpaidBookings = useMemo(() => {
        return bookings
            .filter(b => !b.paid)
            .map(booking => {
                const gymClass = classes.find(c => c.id === booking.classId);
                const coach = coaches.find(c => c.id === gymClass?.coachId);
                const member = members.find(m => m.id === booking.memberId);
                return { ...booking, gymClass, coach, member };
            })
            .filter(b => b.gymClass && b.coach && b.member);
    }, [bookings, classes, coaches, members]);

    const takingsByCoach = useMemo(() => {
        const coachMap = new Map<string, { weekly: number, monthly: number, allTime: number }>();
        coaches.forEach(c => coachMap.set(c.id, { weekly: 0, monthly: 0, allTime: 0 }));

        paidBookings.forEach(booking => {
            const gymClass = classes.find(c => c.id === booking.classId);
            if (!gymClass) return;

            const coachTakings = coachMap.get(gymClass.coachId);
            if (coachTakings) {
                coachTakings.allTime += gymClass.price;
                const bookingDate = new Date(booking.bookingDate);
                if (bookingDate >= startOfMonth) {
                    coachTakings.monthly += gymClass.price;
                }
                if (bookingDate >= startOfWeek) {
                    coachTakings.weekly += gymClass.price;
                }
            }
        });

        return coachMap;
    }, [paidBookings, classes, coaches, startOfWeek, startOfMonth]);

    if (!user) return null;

    const renderCoachTakings = () => (
        <div className="bg-brand-dark p-6 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-4">Takings by Coach</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-brand-dark text-sm">
                    <thead className="bg-black">
                        <tr>
                            <th className="py-2 px-4 text-left">Coach</th>
                            <th className="py-2 px-4 text-right">This Week</th>
                            <th className="py-2 px-4 text-right">This Month</th>
                            <th className="py-2 px-4 text-right">All Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {coaches.filter(c => c.role !== UserRole.ADMIN).map(coach => {
                            const takings = takingsByCoach.get(coach.id) || { weekly: 0, monthly: 0, allTime: 0 };
                            return (
                                <tr key={coach.id} className="border-b border-gray-800 hover:bg-gray-800">
                                    <td className="py-2 px-4">{coach.name}</td>
                                    <td className="py-2 px-4 text-right font-semibold">£{takings.weekly.toFixed(2)}</td>
                                    <td className="py-2 px-4 text-right font-semibold">£{takings.monthly.toFixed(2)}</td>
                                    <td className="py-2 px-4 text-right font-semibold">£{takings.allTime.toFixed(2)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
    
    const renderOutstandingPayments = (coachId?: string) => {
        const filteredUnpaid = coachId 
            ? unpaidBookings.filter(b => b.coach?.id === coachId)
            : unpaidBookings;
        
        const totalOwed = filteredUnpaid.reduce((sum, b) => sum + (b.gymClass?.price || 0), 0);

        return (
            <div className="bg-brand-dark p-6 rounded-lg">
                <h3 className="text-xl font-bold text-white mb-4">Outstanding Payments</h3>
                <p className="text-gray-400 mb-4">Total Owed: <span className="font-bold text-brand-red text-lg">£{totalOwed.toFixed(2)}</span></p>
                <div className="max-h-80 overflow-y-auto pr-2 space-y-2">
                    {filteredUnpaid.length > 0 ? (
                        filteredUnpaid.map(b => (
                            <div key={b.id} className="flex justify-between items-center bg-brand-gray p-3 rounded-md">
                                <div>
                                    <p className="font-semibold">{b.member?.name} - {b.gymClass?.name}</p>
                                    <p className="text-xs text-gray-400">Coach: {b.coach?.name}</p>
                                </div>
                                <span className="font-bold text-brand-red">£{b.gymClass?.price.toFixed(2)}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-4">No outstanding payments.</p>
                    )}
                </div>
            </div>
        );
    }
    
    // Admin View
    if (user.role === UserRole.ADMIN) {
        const totalWeekly = Array.from(takingsByCoach.values()).reduce((sum, t) => sum + t.weekly, 0);
        const totalMonthly = Array.from(takingsByCoach.values()).reduce((sum, t) => sum + t.monthly, 0);

        return (
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatCard title="Total Takings (This Week)" value={`£${totalWeekly.toFixed(2)}`} />
                    <StatCard title="Total Takings (This Month)" value={`£${totalMonthly.toFixed(2)}`} />
                </div>
                {renderCoachTakings()}
                {renderOutstandingPayments()}
            </div>
        )
    }

    // Coach View
    if (user.role === UserRole.COACH) {
        const myTakings = takingsByCoach.get(user.id) || { weekly: 0, monthly: 0, allTime: 0 };
        
        return (
            <div className="space-y-8">
                <h2 className="text-2xl font-bold text-white">My Earnings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatCard title="This Week's Earnings" value={`£${myTakings.weekly.toFixed(2)}`} />
                    <StatCard title="This Month's Earnings" value={`£${myTakings.monthly.toFixed(2)}`} />
                </div>
                {renderOutstandingPayments(user.id)}
            </div>
        )
    }

    return null;
}

export default FinancialsDashboard;
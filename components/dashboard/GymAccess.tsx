import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Member, UserRole } from '../../types';
import Button from '../ui/Button';

const GymAccess: React.FC = () => {
    const { currentUser } = useAuth();
    const { gymAccessLogs, logGymAccess } = useData();
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    if (!currentUser || currentUser.role !== UserRole.MEMBER) return null;

    const member = currentUser as Member;

    const myAccessLogs = useMemo(() => 
        gymAccessLogs.filter(log => log.memberId === member.id)
    , [gymAccessLogs, member.id]);

    const todayKey = new Date().toISOString().split('T')[0];

    const hasCheckedInToday = useMemo(() => {
        return myAccessLogs.some(log => log.accessDate.startsWith(todayKey));
    }, [myAccessLogs, todayKey]);
    
    const canCheckIn = member.membershipStatus === 'PAYG' && !hasCheckedInToday;

    const handleCheckIn = () => {
        if (!canCheckIn) return;
        logGymAccess(member.id, 5.00, false);
        setStatusMessage('£5.00 charge raised. Please complete payment via Stripe (coming soon).');
        alert(`Thank you, ${member.name}! You're checked in for today. A £5 charge has been recorded.`);
    };

    return (
        <div className="bg-brand-gray p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-white mb-4">Gym-Only Access</h2>
            {member.membershipStatus === 'Monthly' && (
                 <p className="text-gray-400">Your monthly membership includes full gym access.</p>
            )}
            {member.membershipStatus === 'PAYG' && (
                <>
                    <p className="text-gray-400 mb-4">As a PAYG member, you can use the gym facilities for £5.00 per day.</p>
                    <Button 
                        onClick={handleCheckIn}
                        disabled={!canCheckIn}
                        className="w-full text-lg py-3"
                        title={hasCheckedInToday ? 'You have already checked in today.' : 'Check-in for today'}
                    >
                        {hasCheckedInToday ? 'Charge Raised for Today' : 'Check-in & Raise £5 Charge'}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                        Charges are recorded instantly. Stripe will be used to settle payments automatically when live.
                    </p>
                    {statusMessage && (
                        <p className="text-sm text-yellow-400 mt-2">{statusMessage}</p>
                    )}
                </>
            )}
            {member.membershipStatus === 'None' && (
                 <p className="text-gray-400">Please select a membership plan to access the gym.</p>
            )}
            
            {myAccessLogs.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-white mb-2">Recent Check-ins</h3>
                    <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
                        {myAccessLogs.slice(0, 5).map(log => (
                            <li key={log.id} className="flex justify-between items-center bg-brand-dark p-2 rounded">
                                <p className="text-sm text-gray-300">
                                    {new Date(log.accessDate).toLocaleDateString()}
                                </p>
                                <span className="text-sm font-semibold text-green-400">
                                    £{log.amountPaid.toFixed(2)}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
};

export default GymAccess;

import React, { useMemo } from 'react';
import { Member, Booking, GymClass, FamilyMember, GymAccessLog } from '../../types';
import StatCard from '../ui/StatCard';

interface MemberFinancialSummaryProps {
  member: Member;
  bookings: Booking[];
  classes: GymClass[];
  familyMembers: FamilyMember[];
  gymAccessLogs: GymAccessLog[];
  onClose?: () => void;
  embedded?: boolean;
}

const MemberFinancialSummary: React.FC<MemberFinancialSummaryProps> = ({
  member,
  bookings,
  classes,
  familyMembers,
  gymAccessLogs,
  onClose,
  embedded = false,
}) => {
  const householdParticipants = useMemo(
    () => [member, ...familyMembers.filter(fm => fm.parentId === member.id)],
    [member, familyMembers],
  );

  const memberBookings = useMemo(
    () =>
      bookings
        .filter(booking => booking.memberId === member.id)
        .map(booking => {
          const cls = classes.find(c => c.id === booking.classId);
          const participant = householdParticipants.find(p => p.id === booking.participantId);
          return { booking, cls, participant };
        })
        .filter(entry => entry.cls && entry.participant)
        .sort(
          (a, b) =>
            new Date(b.booking.bookingDate).getTime() - new Date(a.booking.bookingDate).getTime(),
        ),
    [bookings, classes, householdParticipants, member.id],
  );

  const paidBookings = memberBookings.filter(entry => entry.booking.paid);
  const unpaidBookings = memberBookings.filter(entry => !entry.booking.paid);

  const myAccessLogs = useMemo(
    () => gymAccessLogs.filter(log => log.memberId === member.id),
    [gymAccessLogs, member.id],
  );

  const startOfMonth = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    return start;
  }, []);

  const mapBookingCharge = (entry: typeof memberBookings[number]) => ({
    id: entry.booking.id,
    label: entry.cls?.name || 'Class Booking',
    date: entry.booking.bookingDate,
    amount: entry.cls?.price || 0,
    detail: entry.participant?.name ? `Participant: ${entry.participant.name}` : 'Class booking',
    type: 'Class' as const,
  });

  const mapGymCharge = (log: GymAccessLog) => ({
    id: log.id,
    label: 'Gym Access Day Pass',
    date: log.accessDate,
    amount: log.amountPaid,
    detail: log.notes || 'PAYG access',
    type: 'Gym' as const,
    paid: log.paid,
  });

  const outstandingCharges = [
    ...unpaidBookings.map(mapBookingCharge),
    ...myAccessLogs
      .filter(log => !log.paid)
      .map(log => ({ ...mapGymCharge(log), detail: 'Charge raised - awaiting Stripe payment' })),
  ];

  const paidCharges = [
    ...paidBookings.map(mapBookingCharge),
    ...myAccessLogs.filter(log => log.paid).map(mapGymCharge),
  ];

  const totalPaid = paidCharges.reduce((sum, charge) => sum + charge.amount, 0);
  const paidThisMonth = paidCharges
    .filter(charge => new Date(charge.date) >= startOfMonth)
    .reduce((sum, charge) => sum + charge.amount, 0);
  const outstanding = outstandingCharges.reduce((sum, charge) => sum + charge.amount, 0);

  const renderOutstanding = () => (
    <div className="bg-brand-dark p-5 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Outstanding Balance</h3>
        <span className="text-brand-red font-bold text-xl">£{outstanding.toFixed(2)}</span>
      </div>
      <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
        {outstandingCharges.length ? (
          outstandingCharges.map(charge => (
            <div key={charge.id} className="bg-brand-gray p-3 rounded-md flex justify-between gap-4">
              <div>
                <p className="font-semibold">{charge.label}</p>
                <p className="text-xs text-gray-400 flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-black/40 text-white uppercase tracking-wide text-[10px]">
                    {charge.type}
                  </span>
                  {charge.detail} • Raised {new Date(charge.date).toLocaleDateString()}
                </p>
              </div>
              <span className="font-bold text-brand-red text-lg whitespace-nowrap">
                £{charge.amount.toFixed(2)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-sm text-center py-4">
            No outstanding payments. Great job staying up to date!
          </p>
        )}
      </div>
      {outstandingCharges.some(charge => charge.type === 'Gym') && (
        <p className="text-xs text-yellow-300 mt-3">
          Stripe automation will settle gym access charges automatically when it goes live.
        </p>
      )}
    </div>
  );

  const renderPaymentHistory = () => (
    <div className="bg-brand-dark p-5 rounded-lg">
      <h3 className="text-lg font-semibold text-white mb-3">Payment History</h3>
      <div className="max-h-64 overflow-y-auto">
        {paidCharges.length ? (
          <table className="min-w-full text-sm">
            <thead className="text-left text-gray-400 text-xs uppercase">
              <tr>
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Description</th>
                <th className="py-2 pr-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {paidCharges.map(charge => (
                <tr key={charge.id} className="border-b border-gray-800">
                  <td className="py-2 pr-3">{new Date(charge.date).toLocaleDateString()}</td>
                  <td className="py-2 pr-3">
                    <span className="mr-2 px-2 py-0.5 rounded bg-black/40 text-[10px] uppercase tracking-wide">
                      {charge.type}
                    </span>
                    {charge.label}
                  </td>
                  <td className="py-2 pr-3 text-right font-semibold">£{charge.amount.toFixed(2)}</td>
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

  const containerClasses = embedded ? '' : 'bg-brand-gray p-6 rounded-lg space-y-6';

  return (
    <div className={containerClasses}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-400 uppercase tracking-wide">Member Financials</p>
          <h2 className="text-2xl font-bold text-white">{member.name}</h2>
          <p className="text-sm text-gray-400">{member.email}</p>
        </div>
        {!embedded && (
          <button className="text-sm text-brand-red font-semibold hover:underline" onClick={onClose}>
            ← Back to Members
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Live preview – Stripe auto-settlement will mark gym access charges as paid as soon as the
        integration goes live.
      </p>
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

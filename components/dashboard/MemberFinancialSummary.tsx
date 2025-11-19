import React, { useMemo } from 'react';
import { Member, Transaction, TransactionSource, TransactionStatus } from '../../types';
import StatCard from '../ui/StatCard';

interface MemberFinancialSummaryProps {
  member: Member;
  transactions: Transaction[];
  onClose?: () => void;
  embedded?: boolean;
}

const sourceLabel: Record<TransactionSource, string> = {
  [TransactionSource.CLASS]: 'Class',
  [TransactionSource.PRIVATE_SESSION]: 'Private',
  [TransactionSource.GROUP_SESSION]: 'Group',
  [TransactionSource.GYM_PASS]: 'Gym Pass',
  [TransactionSource.MANUAL]: 'Manual'
};

const MemberFinancialSummary: React.FC<MemberFinancialSummaryProps> = ({
  member,
  transactions,
  onClose,
  embedded = false,
}) => {
  const memberTransactions = useMemo(
    () =>
      transactions
        .filter(tx => tx.memberId === member.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [transactions, member.id],
  );

  const outstanding = memberTransactions.filter(tx => tx.status === TransactionStatus.PENDING);
  const pendingConfirmation = memberTransactions.filter(tx => tx.confirmationStatus === 'PENDING');
  const settled = memberTransactions.filter(
    tx => tx.status === TransactionStatus.PAID && tx.confirmationStatus !== 'PENDING',
  );

  const startOfMonth = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    return start;
  }, []);

  const outstandingTotal = outstanding.reduce((sum, tx) => sum + tx.amount, 0);
  const paidThisMonth = settled
    .filter(tx => new Date(tx.createdAt) >= startOfMonth)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const lifetimeSpend = settled.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="bg-brand-gray p-6 rounded-lg space-y-6">
      <div className="flex items-center justify-between mb-2">
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Outstanding Balance" value={`£${outstandingTotal.toFixed(2)}`} />
        <StatCard title="Paid This Month" value={`£${paidThisMonth.toFixed(2)}`} />
        <StatCard title="Lifetime Spend" value={`£${lifetimeSpend.toFixed(2)}`} />
        <StatCard title="Awaiting Confirmation" value={`£${pendingConfirmation.reduce((sum, tx) => sum + tx.amount, 0).toFixed(2)}`} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-brand-dark p-5 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">Outstanding Charges</h3>
            <span className="text-brand-red font-bold text-xl">£{outstandingTotal.toFixed(2)}</span>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
            {outstanding.length ? outstanding.map(tx => (
              <div key={tx.id} className="bg-brand-gray p-3 rounded-md flex justify-between gap-4">
                <div>
                  <p className="font-semibold">{tx.description || sourceLabel[tx.source]}</p>
                  <p className="text-xs text-gray-400 flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-black/40 text-white uppercase tracking-wide text-[10px]">
                      {sourceLabel[tx.source]}
                    </span>
                    Raised {new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="font-bold text-brand-red text-lg whitespace-nowrap">
                  £{tx.amount.toFixed(2)}
                </span>
              </div>
            )) : (
              <p className="text-gray-400 text-sm text-center py-4">No outstanding payments.</p>
            )}
          </div>
        </div>
        <div className="bg-brand-dark p-5 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-3">Recent Payments</h3>
          <div className="max-h-64 overflow-y-auto">
            {settled.length ? (
              <table className="min-w-full text-sm">
                <thead className="text-left text-gray-400 text-xs uppercase">
                  <tr>
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Description</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {settled.map(tx => (
                    <tr key={tx.id} className="border-b border-gray-800">
                      <td className="py-2 pr-3">{new Date(tx.createdAt).toLocaleDateString()}</td>
                      <td className="py-2 pr-3">
                        <span className="mr-2 px-2 py-0.5 rounded bg-black/40 text-[10px] uppercase tracking-wide">
                          {sourceLabel[tx.source]}
                        </span>
                        {tx.description || 'Payment'}
                      </td>
                      <td className="py-2 pr-3">
                        <span className="px-2 py-0.5 rounded bg-green-600 text-xs text-white uppercase tracking-wide">
                          Confirmed
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-right font-semibold">£{tx.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-400 text-sm text-center py-4">No payments recorded yet.</p>
            )}
          </div>
        </div>
      </div>
      {pendingConfirmation.length > 0 && (
        <div className="bg-brand-dark p-5 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-3">Awaiting Coach Confirmation</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {pendingConfirmation.map(tx => (
              <div key={tx.id} className="bg-brand-gray p-3 rounded-md flex justify-between gap-4">
                <div>
                  <p className="font-semibold">{tx.description || sourceLabel[tx.source]}</p>
                  <p className="text-xs text-gray-400">
                    Paid on {new Date(tx.createdAt).toLocaleString()} · Waiting for coach to confirm
                  </p>
                </div>
                <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-500 text-black self-start">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberFinancialSummary;

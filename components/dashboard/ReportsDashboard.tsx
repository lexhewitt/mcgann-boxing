import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import Button from '../ui/Button';
import StatCard from '../ui/StatCard';

type ReportPeriod = 'week' | 'month' | 'custom';

const ReportsDashboard: React.FC = () => {
  const { bookings, classes, transactions, coaches, members, coachSlots, coachAppointments } = useData();
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('week');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const getDateRange = () => {
    const now = new Date();
    let start: Date, end: Date;

    if (reportPeriod === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      start = new Date(now.setDate(diff));
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (reportPeriod === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    } else {
      start = new Date(customStartDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  };

  const reportData = useMemo(() => {
    const { start, end } = getDateRange();

    // Filter bookings in date range
    const periodBookings = bookings.filter(b => {
      const bookingDate = new Date(b.bookingDate);
      return bookingDate >= start && bookingDate <= end;
    });

    // Filter transactions in date range
    const periodTransactions = transactions.filter(t => {
      const txDate = new Date(t.createdAt);
      return txDate >= start && txDate <= end;
    });

    // Calculate stats
    const totalBookings = periodBookings.length;
    const confirmedBookings = periodBookings.filter(b => b.confirmationStatus !== 'CANCELED').length;
    const cancelledBookings = periodBookings.filter(b => b.confirmationStatus === 'CANCELED').length;
    const attendedBookings = periodBookings.filter(b => b.attended).length;

    // Calculate takings
    const totalTakings = periodTransactions
      .filter(t => t.status === 'PAID' && t.confirmationStatus !== 'CANCELED')
      .reduce((sum, t) => sum + t.amount, 0);

    const cancelledTakings = periodTransactions
      .filter(t => t.confirmationStatus === 'CANCELED')
      .reduce((sum, t) => sum + t.amount, 0);

    // Group by class
    const bookingsByClass = periodBookings.reduce((acc, booking) => {
      const gymClass = classes.find(c => c.id === booking.classId);
      if (!gymClass) return acc;
      if (!acc[gymClass.id]) {
        acc[gymClass.id] = {
          class: gymClass,
          bookings: 0,
          cancelled: 0,
          revenue: 0,
        };
      }
      acc[gymClass.id].bookings++;
      if (booking.confirmationStatus === 'CANCELED') {
        acc[gymClass.id].cancelled++;
      } else {
        const tx = periodTransactions.find(t => t.bookingId === booking.id && t.status === 'PAID');
        if (tx) acc[gymClass.id].revenue += tx.amount;
      }
      return acc;
    }, {} as Record<string, { class: typeof classes[0]; bookings: number; cancelled: number; revenue: number }>);

    // Group by coach
    const bookingsByCoach = periodBookings.reduce((acc, booking) => {
      const gymClass = classes.find(c => c.id === booking.classId);
      if (!gymClass) return acc;
      if (!acc[gymClass.coachId]) {
        acc[gymClass.coachId] = {
          coach: coaches.find(c => c.id === gymClass.coachId),
          bookings: 0,
          cancelled: 0,
          revenue: 0,
        };
      }
      acc[gymClass.coachId].bookings++;
      if (booking.confirmationStatus === 'CANCELED') {
        acc[gymClass.coachId].cancelled++;
      } else {
        const tx = periodTransactions.find(t => t.bookingId === booking.id && t.status === 'PAID');
        if (tx) acc[gymClass.coachId].revenue += tx.amount;
      }
      return acc;
    }, {} as Record<string, { coach: typeof coaches[0] | undefined; bookings: number; cancelled: number; revenue: number }>);

    // Private sessions
    const periodAppointments = coachAppointments.filter(apt => {
      const slot = coachSlots.find(s => s.id === apt.slotId);
      if (!slot) return false;
      const slotDate = new Date(slot.start);
      return slotDate >= start && slotDate <= end;
    });

    const privateSessionRevenue = periodAppointments
      .filter(apt => apt.status !== 'CANCELED')
      .reduce((sum, apt) => {
        const slot = coachSlots.find(s => s.id === apt.slotId);
        return sum + (slot?.price || 0);
      }, 0);

    return {
      start,
      end,
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      attendedBookings,
      totalTakings,
      cancelledTakings,
      netTakings: totalTakings - cancelledTakings,
      bookingsByClass: Object.values(bookingsByClass),
      bookingsByCoach: Object.values(bookingsByCoach),
      privateSessions: periodAppointments.length,
      privateSessionRevenue,
    };
  }, [bookings, classes, transactions, coaches, coachSlots, coachAppointments, reportPeriod, customStartDate, customEndDate]);

  const handleExport = () => {
    const csv = [
      ['Report Period', `${reportData.start.toLocaleDateString()} - ${reportData.end.toLocaleDateString()}`],
      [''],
      ['Summary'],
      ['Total Bookings', reportData.totalBookings],
      ['Confirmed Bookings', reportData.confirmedBookings],
      ['Cancelled Bookings', reportData.cancelledBookings],
      ['Attended Bookings', reportData.attendedBookings],
      [''],
      ['Revenue'],
      ['Total Takings', `£${reportData.totalTakings.toFixed(2)}`],
      ['Cancelled Refunds', `£${reportData.cancelledTakings.toFixed(2)}`],
      ['Net Takings', `£${reportData.netTakings.toFixed(2)}`],
      ['Private Session Revenue', `£${reportData.privateSessionRevenue.toFixed(2)}`],
      [''],
      ['Bookings by Class'],
      ['Class Name', 'Bookings', 'Cancelled', 'Revenue'],
      ...reportData.bookingsByClass.map(b => [
        b.class.name,
        b.bookings,
        b.cancelled,
        `£${b.revenue.toFixed(2)}`
      ]),
      [''],
      ['Bookings by Coach'],
      ['Coach Name', 'Bookings', 'Cancelled', 'Revenue'],
      ...reportData.bookingsByCoach.map(b => [
        b.coach?.name || 'Unknown',
        b.bookings,
        b.cancelled,
        `£${b.revenue.toFixed(2)}`
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${reportData.start.toISOString().split('T')[0]}-${reportData.end.toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="bg-brand-dark p-4 rounded-lg">
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Report Period</label>
            <select
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value as ReportPeriod)}
              className="bg-brand-gray border border-gray-600 rounded-md px-3 py-2 text-white"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          {reportPeriod === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-brand-gray border border-gray-600 rounded-md px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-brand-gray border border-gray-600 rounded-md px-3 py-2 text-white"
                />
              </div>
            </>
          )}
          <Button onClick={handleExport}>Export CSV</Button>
        </div>
        <p className="text-sm text-gray-400 mt-2">
          Period: {reportData.start.toLocaleDateString()} - {reportData.end.toLocaleDateString()}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Bookings" value={reportData.totalBookings} />
        <StatCard title="Confirmed" value={reportData.confirmedBookings} />
        <StatCard title="Cancelled" value={reportData.cancelledBookings} />
        <StatCard title="Attended" value={reportData.attendedBookings} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Takings" value={`£${reportData.totalTakings.toFixed(2)}`} />
        <StatCard title="Cancelled Refunds" value={`£${reportData.cancelledTakings.toFixed(2)}`} />
        <StatCard title="Net Takings" value={`£${reportData.netTakings.toFixed(2)}`} />
        <StatCard title="Private Sessions" value={`£${reportData.privateSessionRevenue.toFixed(2)}`} />
      </div>

      {/* Bookings by Class */}
      <div className="bg-brand-dark p-6 rounded-lg">
        <h3 className="text-xl font-bold text-white mb-4">Bookings by Class</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2 px-4 text-gray-300">Class</th>
                <th className="text-right py-2 px-4 text-gray-300">Bookings</th>
                <th className="text-right py-2 px-4 text-gray-300">Cancelled</th>
                <th className="text-right py-2 px-4 text-gray-300">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {reportData.bookingsByClass.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-800">
                  <td className="py-2 px-4 text-white">{item.class.name}</td>
                  <td className="py-2 px-4 text-right text-white">{item.bookings}</td>
                  <td className="py-2 px-4 text-right text-red-400">{item.cancelled}</td>
                  <td className="py-2 px-4 text-right text-white">£{item.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bookings by Coach */}
      <div className="bg-brand-dark p-6 rounded-lg">
        <h3 className="text-xl font-bold text-white mb-4">Bookings by Coach</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2 px-4 text-gray-300">Coach</th>
                <th className="text-right py-2 px-4 text-gray-300">Bookings</th>
                <th className="text-right py-2 px-4 text-gray-300">Cancelled</th>
                <th className="text-right py-2 px-4 text-gray-300">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {reportData.bookingsByCoach.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-800">
                  <td className="py-2 px-4 text-white">{item.coach?.name || 'Unknown'}</td>
                  <td className="py-2 px-4 text-right text-white">{item.bookings}</td>
                  <td className="py-2 px-4 text-right text-red-400">{item.cancelled}</td>
                  <td className="py-2 px-4 text-right text-white">£{item.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsDashboard;




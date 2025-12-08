import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { GymClass, CoachSlot, Booking, CoachAppointment } from '../../types';
import Button from '../ui/Button';
import ClassDetailsModal from './ClassDetailsModal';

type ViewMode = 'day' | 'week' | 'month';

const AdminCalendarView: React.FC = () => {
  const { classes, bookings, coachSlots, coachAppointments, coaches, members } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedClass, setSelectedClass] = useState<GymClass | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<string | null>(null);

  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
    return new Date(d.setDate(diff));
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.toDateString() === date2.toDateString();
  };

  const formatTime = (timeString: string): string => {
    if (timeString.includes('T')) {
      return new Date(timeString).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }
    return timeString;
  };

  const getTimeSlot = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  };

  // Get all events (classes + private sessions) for a specific date
  const getEventsForDate = (date: Date) => {
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
    const dateString = date.toISOString().split('T')[0];

    const dayClasses = classes
      .filter(c => {
        if (selectedCoach && c.coachId !== selectedCoach) return false;
        return c.day === dayName;
      })
      .map(cls => {
        const classBookings = bookings.filter(b => b.classId === cls.id);
        const cancelledBookings = classBookings.filter(b => b.confirmationStatus === 'CANCELED');
        const coach = coaches.find(c => c.id === cls.coachId);
        const [startTime] = cls.time.split(' – ');
        return {
          type: 'class' as const,
          id: cls.id,
          title: cls.name,
          time: cls.time,
          startTime: getTimeSlot(startTime),
          endTime: getTimeSlot(cls.time.split(' – ')[1] || startTime),
          data: cls,
          coach: coach?.name || 'Unknown',
          bookings: classBookings.length - cancelledBookings.length,
          capacity: cls.capacity,
          cancelled: cancelledBookings.length,
        };
      });

    const daySlots = coachSlots
      .filter(slot => {
        if (selectedCoach && slot.coachId !== selectedCoach) return false;
        const slotDate = new Date(slot.start);
        return isSameDay(slotDate, date);
      })
      .map(slot => {
        const appointment = coachAppointments.find(apt => apt.slotId === slot.id);
        const isCancelled = appointment?.status === 'CANCELED';
        const coach = coaches.find(c => c.id === slot.coachId);
        const startTime = getTimeSlot(new Date(slot.start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
        const endTime = getTimeSlot(new Date(slot.end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
        return {
          type: 'private' as const,
          id: slot.id,
          title: slot.title,
          time: `${formatTime(slot.start)} - ${formatTime(slot.end)}`,
          startTime,
          endTime,
          data: slot,
          coach: coach?.name || 'Unknown',
          participant: appointment?.participantName,
          booked: !!appointment && !isCancelled,
          cancelled: isCancelled,
        };
      });

    return [...dayClasses, ...daySlots].sort((a, b) => a.startTime - b.startTime);
  };

  // Day view
  const renderDayView = () => {
    const events = getEventsForDate(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="bg-brand-dark rounded-lg p-4">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-white mb-2">
            {currentDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => {
              const prev = new Date(currentDate);
              prev.setDate(prev.getDate() - 1);
              setCurrentDate(prev);
            }}>← Previous Day</Button>
            <Button variant="secondary" onClick={() => setCurrentDate(new Date())}>Today</Button>
            <Button variant="secondary" onClick={() => {
              const next = new Date(currentDate);
              next.setDate(next.getDate() + 1);
              setCurrentDate(next);
            }}>Next Day →</Button>
          </div>
        </div>

        <div className="relative">
          <div className="grid grid-cols-[80px_1fr] gap-2">
            <div className="space-y-0">
              {hours.map(hour => (
                <div key={hour} className="h-16 border-b border-gray-700 flex items-start pt-1">
                  <span className="text-xs text-gray-500">{hour.toString().padStart(2, '0')}:00</span>
                </div>
              ))}
            </div>
            <div className="relative">
              {hours.map(hour => (
                <div key={hour} className="h-16 border-b border-gray-700"></div>
              ))}
              
              {events.map(event => {
                const top = (event.startTime / 60) * 64;
                const height = ((event.endTime - event.startTime) / 60) * 64;
                
                return (
                  <div
                    key={event.id}
                    className={`absolute left-0 right-0 rounded-lg p-2 cursor-pointer hover:opacity-90 transition-opacity ${
                      event.type === 'class' 
                        ? event.cancelled ? 'bg-red-600/50 border-l-4 border-red-400' : 'bg-blue-600 border-l-4 border-blue-400'
                        : event.cancelled ? 'bg-red-600/50 border-l-4 border-red-400' : 'bg-purple-600 border-l-4 border-purple-400'
                    }`}
                    style={{ top: `${top}px`, height: `${Math.max(height, 40)}px` }}
                    onClick={() => event.type === 'class' && setSelectedClass(event.data)}
                  >
                    <div className="text-white text-sm font-semibold truncate">{event.title}</div>
                    <div className="text-xs text-white/80">{event.time}</div>
                    <div className="text-xs text-white/70 mt-1">{event.coach}</div>
                    {event.type === 'class' && (
                      <div className="text-xs text-white/70 mt-1">
                        {event.bookings}/{event.capacity} booked
                        {event.cancelled > 0 && <span className="text-red-300 ml-1">({event.cancelled} cancelled)</span>}
                      </div>
                    )}
                    {event.type === 'private' && (
                      <div className="text-xs text-white/70 mt-1">
                        {event.cancelled ? '❌ Cancelled' : event.booked ? `👤 ${event.participant}` : 'Available'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Week view
  const renderWeekView = () => {
    const weekStart = getWeekStart(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      return date;
    });

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="bg-brand-dark rounded-lg p-4">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white">
              {weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - {weekDays[6].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </h3>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => {
              const prev = new Date(weekStart);
              prev.setDate(prev.getDate() - 7);
              setCurrentDate(prev);
            }}>← Previous Week</Button>
            <Button variant="secondary" onClick={() => setCurrentDate(new Date())}>This Week</Button>
            <Button variant="secondary" onClick={() => {
              const next = new Date(weekStart);
              next.setDate(next.getDate() + 7);
              setCurrentDate(next);
            }}>Next Week →</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-2 min-w-[1200px]">
            <div className="space-y-0">
              <div className="h-12"></div>
              {hours.map(hour => (
                <div key={hour} className="h-12 border-b border-gray-700 flex items-start pt-1">
                  <span className="text-xs text-gray-500">{hour.toString().padStart(2, '0')}:00</span>
                </div>
              ))}
            </div>

            {weekDays.map((date, dayIdx) => {
              const isToday = isSameDay(date, new Date());
              const events = getEventsForDate(date);
              const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

              return (
                <div key={dayIdx} className="relative">
                  <div className={`h-12 border-b border-gray-700 flex flex-col items-center justify-center ${isToday ? 'bg-brand-red/20' : ''}`}>
                    <div className={`text-xs font-semibold ${isToday ? 'text-brand-red' : 'text-gray-400'}`}>
                      {daysOfWeek[date.getDay()].substring(0, 3).toUpperCase()}
                    </div>
                    <div className={`text-sm font-bold ${isToday ? 'text-white' : 'text-gray-300'}`}>
                      {date.getDate()}
                    </div>
                  </div>

                  <div className="relative">
                    {hours.map(hour => (
                      <div key={hour} className="h-12 border-b border-gray-700"></div>
                    ))}

                    {events.map(event => {
                      const top = (event.startTime / 60) * 48;
                      const height = ((event.endTime - event.startTime) / 60) * 48;
                      
                      return (
                        <div
                          key={event.id}
                          className={`absolute left-1 right-1 rounded p-1.5 cursor-pointer hover:opacity-90 transition-opacity text-xs ${
                            event.type === 'class' 
                              ? event.cancelled ? 'bg-red-600/50 border-l-2 border-red-400' : 'bg-blue-600 border-l-2 border-blue-400'
                              : event.cancelled ? 'bg-red-600/50 border-l-2 border-red-400' : 'bg-purple-600 border-l-2 border-purple-400'
                          }`}
                          style={{ top: `${top}px`, height: `${Math.max(height, 32)}px` }}
                          onClick={() => event.type === 'class' && setSelectedClass(event.data)}
                        >
                          <div className="text-white font-semibold truncate">{event.title}</div>
                          <div className="text-white/80 text-[10px]">{event.time}</div>
                          <div className="text-white/70 text-[10px]">{event.coach}</div>
                          {event.type === 'class' && (
                            <div className="text-white/70 text-[10px]">
                              {event.bookings}/{event.capacity}
                              {event.cancelled > 0 && <span className="text-red-300"> ({event.cancelled}✗)</span>}
                            </div>
                          )}
                          {event.type === 'private' && (
                            <div className="text-white/70 text-[10px]">
                              {event.cancelled ? '✗' : event.booked ? '👤' : '○'}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Month view
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const getEventsForDate = (date: Date) => {
      const dayName = daysOfWeek[date.getDay()];
      const dayClasses = classes.filter(c => {
        if (selectedCoach && c.coachId !== selectedCoach) return false;
        return c.day === dayName;
      });
      const daySlots = coachSlots.filter(slot => {
        if (selectedCoach && slot.coachId !== selectedCoach) return false;
        const slotDate = new Date(slot.start);
        return isSameDay(slotDate, date);
      });
      return { classes: dayClasses.length, slots: daySlots.length };
    };

    const blanks = Array(firstDayOfMonth).fill(null);
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const calendarCells = [...blanks, ...daysArray];

    return (
      <div className="bg-brand-dark rounded-lg p-4">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">
            {currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => {
              setCurrentDate(new Date(year, month - 1, 1));
            }}>← Previous</Button>
            <Button variant="secondary" onClick={() => setCurrentDate(new Date())}>Today</Button>
            <Button variant="secondary" onClick={() => {
              setCurrentDate(new Date(year, month + 1, 1));
            }}>Next →</Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center py-2 text-sm font-semibold text-gray-400">
              {day}
            </div>
          ))}

          {calendarCells.map((day, index) => {
            if (day === null) {
              return <div key={`blank-${index}`} className="border border-gray-800 bg-brand-dark/30 min-h-[100px]"></div>;
            }

            const date = new Date(year, month, day);
            const isToday = isSameDay(date, new Date());
            const events = getEventsForDate(date);

            return (
              <div
                key={day}
                className={`border border-gray-800 p-2 min-h-[100px] flex flex-col ${
                  isToday ? 'bg-brand-red/10 border-brand-red' : 'bg-brand-dark'
                }`}
              >
                <div className={`font-bold mb-1 ${isToday ? 'text-brand-red' : 'text-white'}`}>
                  {day}
                </div>
                <div className="flex-grow space-y-1">
                  {events.classes > 0 && (
                    <div className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">
                      {events.classes} {events.classes === 1 ? 'Class' : 'Classes'}
                    </div>
                  )}
                  {events.slots > 0 && (
                    <div className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded">
                      {events.slots} {events.slots === 1 ? 'Session' : 'Sessions'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'day' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('day')}
          >
            Day
          </Button>
          <Button
            variant={viewMode === 'week' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('week')}
          >
            Week
          </Button>
          <Button
            variant={viewMode === 'month' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('month')}
          >
            Month
          </Button>
        </div>
        <div>
          <select
            value={selectedCoach || ''}
            onChange={(e) => setSelectedCoach(e.target.value || null)}
            className="bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white"
          >
            <option value="">All Coaches</option>
            {coaches.map(coach => (
              <option key={coach.id} value={coach.id}>{coach.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-600 rounded"></div>
          <span className="text-gray-300">Classes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-600 rounded"></div>
          <span className="text-gray-300">Private Sessions</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-600/50 rounded"></div>
          <span className="text-gray-300">Cancelled</span>
        </div>
      </div>

      {/* Render selected view */}
      {viewMode === 'day' && renderDayView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'month' && renderMonthView()}

      {/* Class details modal */}
      {selectedClass && (
        <ClassDetailsModal
          gymClass={selectedClass}
          onClose={() => setSelectedClass(null)}
        />
      )}
    </div>
  );
};

export default AdminCalendarView;


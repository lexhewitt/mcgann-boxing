import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { GymClass, CoachSlot, CoachAppointment, Booking } from '../../types';
import ClassDetailsModal from './ClassDetailsModal';
import Button from '../ui/Button';

interface CoachScheduleViewProps {
  coachId: string;
}

type ViewMode = 'day' | 'week' | 'month';

const CoachScheduleView: React.FC<CoachScheduleViewProps> = ({ coachId }) => {
  const { classes, bookings, coachSlots, coachAppointments, members } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedClass, setSelectedClass] = useState<GymClass | null>(null);

  // Filter data for this coach
  const coachClasses = useMemo(() => 
    classes.filter(c => c.coachId === coachId),
    [classes, coachId]
  );

  const coachPrivateSlots = useMemo(() =>
    coachSlots.filter(slot => slot.coachId === coachId),
    [coachSlots, coachId]
  );

  const coachPrivateAppointments = useMemo(() =>
    coachAppointments.filter(apt => {
      const slot = coachSlots.find(s => s.id === apt.slotId);
      return slot?.coachId === coachId;
    }),
    [coachAppointments, coachSlots, coachId]
  );

  // Get bookings for coach's classes
  const classBookings = useMemo(() => {
    const classIds = coachClasses.map(c => c.id);
    return bookings.filter(b => classIds.includes(b.classId));
  }, [bookings, coachClasses]);

  // Helper functions
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
    // Handle both "HH:mm" and ISO strings
    if (timeString.includes('T')) {
      return new Date(timeString).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }
    return timeString;
  };

  const getTimeSlot = (timeString: string): number => {
    // Convert time to minutes since midnight for positioning
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  };

  // Day view
  const renderDayView = () => {
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDate.getDay()];
    const dayClasses = coachClasses.filter(c => c.day === dayOfWeek);
    const daySlots = coachPrivateSlots.filter(slot => {
      const slotDate = new Date(slot.start);
      return isSameDay(slotDate, currentDate);
    });

    const allEvents = [
      ...dayClasses.map(cls => ({
        type: 'class' as const,
        id: cls.id,
        title: cls.name,
        time: cls.time,
        startTime: getTimeSlot(cls.time.split(' - ')[0]),
        endTime: getTimeSlot(cls.time.split(' - ')[1] || cls.time.split(' - ')[0]),
        data: cls,
        bookings: classBookings.filter(b => b.classId === cls.id).length,
        capacity: cls.capacity,
      })),
      ...daySlots.map(slot => {
        const appointment = coachPrivateAppointments.find(apt => apt.slotId === slot.id);
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
          participant: appointment?.participantName,
          booked: !!appointment,
        };
      }),
    ].sort((a, b) => a.startTime - b.startTime);

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
          {/* Time grid */}
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
              
              {/* Events */}
              {allEvents.map(event => {
                const top = (event.startTime / 60) * 64; // 64px per hour
                const height = ((event.endTime - event.startTime) / 60) * 64;
                
                // For private sessions, use different styling for available vs booked
                const isAvailablePrivate = event.type === 'private' && !event.booked;
                
                return (
                  <div
                    key={event.id}
                    className={`absolute left-0 right-0 rounded-lg p-2 cursor-pointer hover:opacity-90 transition-opacity ${
                      event.type === 'class' 
                        ? 'bg-blue-600 border-l-4 border-blue-400' 
                        : isAvailablePrivate
                        ? 'bg-purple-500 border-l-4 border-purple-300 shadow-lg shadow-purple-500/50' // Available: brighter purple with glow
                        : 'bg-purple-700 border-l-4 border-purple-500' // Booked: darker purple
                    }`}
                    style={{ top: `${top}px`, height: `${Math.max(height, 40)}px` }}
                    onClick={() => event.type === 'class' && setSelectedClass(event.data)}
                  >
                    <div className="text-white text-sm font-semibold truncate">{event.title}</div>
                    <div className="text-xs text-white/80">{event.time}</div>
                    {event.type === 'class' && (
                      <div className="text-xs text-white/70 mt-1">
                        {event.bookings}/{event.capacity} booked
                      </div>
                    )}
                    {event.type === 'private' && (
                      <div className={`text-xs mt-1 font-semibold ${isAvailablePrivate ? 'text-white' : 'text-white/70'}`}>
                        {event.booked ? `👤 ${event.participant}` : '✓ Available'}
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

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const getEventsForDay = (date: Date) => {
      const dayName = daysOfWeek[date.getDay()];
      const dayClasses = coachClasses.filter(c => c.day === dayName);
      const daySlots = coachPrivateSlots.filter(slot => {
        const slotDate = new Date(slot.start);
        return isSameDay(slotDate, date);
      });

      return [
        ...dayClasses.map(cls => ({
          type: 'class' as const,
          id: cls.id,
          title: cls.name,
          time: cls.time,
          startTime: getTimeSlot(cls.time.split(' - ')[0]),
          endTime: getTimeSlot(cls.time.split(' - ')[1] || cls.time.split(' - ')[0]),
          data: cls,
          bookings: classBookings.filter(b => b.classId === cls.id).length,
          capacity: cls.capacity,
        })),
        ...daySlots.map(slot => {
          const appointment = coachPrivateAppointments.find(apt => apt.slotId === slot.id);
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
            participant: appointment?.participantName,
            booked: !!appointment,
          };
        }),
      ].sort((a, b) => a.startTime - b.startTime);
    };

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
            {/* Time column */}
            <div className="space-y-0">
              <div className="h-12"></div>
              {hours.map(hour => (
                <div key={hour} className="h-12 border-b border-gray-700 flex items-start pt-1">
                  <span className="text-xs text-gray-500">{hour.toString().padStart(2, '0')}:00</span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((date, dayIdx) => {
              const isToday = isSameDay(date, new Date());
              const events = getEventsForDay(date);

              return (
                <div key={dayIdx} className="relative">
                  {/* Day header */}
                  <div className={`h-12 border-b border-gray-700 flex flex-col items-center justify-center ${isToday ? 'bg-brand-red/20' : ''}`}>
                    <div className={`text-xs font-semibold ${isToday ? 'text-brand-red' : 'text-gray-400'}`}>
                      {daysOfWeek[date.getDay()].substring(0, 3).toUpperCase()}
                    </div>
                    <div className={`text-sm font-bold ${isToday ? 'text-white' : 'text-gray-300'}`}>
                      {date.getDate()}
                    </div>
                  </div>

                  {/* Time slots */}
                  <div className="relative">
                    {hours.map(hour => (
                      <div key={hour} className="h-12 border-b border-gray-700"></div>
                    ))}

                    {/* Events for this day */}
                    {events.map(event => {
                      const top = (event.startTime / 60) * 48; // 48px per hour
                      const height = ((event.endTime - event.startTime) / 60) * 48;
                      
                      // For private sessions, use different styling for available vs booked
                      const isAvailablePrivate = event.type === 'private' && !event.booked;
                      
                      return (
                        <div
                          key={event.id}
                          className={`absolute left-1 right-1 rounded p-1.5 cursor-pointer hover:opacity-90 transition-opacity text-xs ${
                            event.type === 'class' 
                              ? 'bg-blue-600 border-l-2 border-blue-400' 
                              : isAvailablePrivate
                              ? 'bg-purple-500 border-l-2 border-purple-300 shadow-md shadow-purple-500/50' // Available: brighter purple with glow
                              : 'bg-purple-700 border-l-2 border-purple-500' // Booked: darker purple
                          }`}
                          style={{ top: `${top}px`, height: `${Math.max(height, 32)}px` }}
                          onClick={() => event.type === 'class' && setSelectedClass(event.data)}
                        >
                          <div className="text-white font-semibold truncate">{event.title}</div>
                          <div className="text-white/80 text-[10px]">{event.time}</div>
                          {event.type === 'class' && (
                            <div className="text-white/70 text-[10px]">{event.bookings}/{event.capacity}</div>
                          )}
                          {event.type === 'private' && (
                            <div className={`text-[10px] font-semibold ${isAvailablePrivate ? 'text-white' : 'text-white/70'}`}>
                              {event.booked ? '👤' : '✓'}
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
      const dayClasses = coachClasses.filter(c => c.day === dayName);
      const daySlots = coachPrivateSlots.filter(slot => {
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
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center py-2 text-sm font-semibold text-gray-400">
              {day}
            </div>
          ))}

          {/* Calendar days */}
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
                    <div className="bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded shadow shadow-purple-500/50">
                      {events.slots} {events.slots === 1 ? 'Private Session' : 'Private Sessions'}
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

  // Calculate summary stats for current view period
  const summaryStats = useMemo(() => {
    let startDate: Date, endDate: Date;
    
    if (viewMode === 'day') {
      startDate = new Date(currentDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(currentDate);
      endDate.setHours(23, 59, 59, 999);
    } else if (viewMode === 'week') {
      startDate = getWeekStart(currentDate);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    const periodClasses = coachClasses.filter(cls => {
      // For month view, check if class day falls in month
      if (viewMode === 'month') {
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const monthDays = Array.from({ length: endDate.getDate() }, (_, i) => {
          const date = new Date(startDate);
          date.setDate(i + 1);
          return daysOfWeek[date.getDay()];
        });
        return monthDays.includes(cls.day);
      }
      // For day/week, check specific dates
      return true; // Simplified - classes repeat weekly
    });

    const periodSlots = coachPrivateSlots.filter(slot => {
      const slotDate = new Date(slot.start);
      return slotDate >= startDate && slotDate <= endDate;
    });

    const bookedSlots = periodSlots.filter(slot => 
      coachPrivateAppointments.some(apt => apt.slotId === slot.id)
    );

    const totalBookings = classBookings.filter(b => {
      const classItem = coachClasses.find(c => c.id === b.classId);
      return classItem && periodClasses.includes(classItem);
    }).length;

    return {
      classes: periodClasses.length,
      totalBookings,
      privateSlots: periodSlots.length,
      bookedPrivate: bookedSlots.length,
      availablePrivate: periodSlots.length - bookedSlots.length,
    };
  }, [viewMode, currentDate, coachClasses, coachPrivateSlots, coachPrivateAppointments, classBookings]);

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-brand-dark p-4 rounded-lg border-l-4 border-blue-500">
          <div className="text-sm text-gray-400 uppercase tracking-wide">Classes</div>
          <div className="text-2xl font-bold text-white">{summaryStats.classes}</div>
          <div className="text-xs text-gray-500 mt-1">{summaryStats.totalBookings} bookings</div>
        </div>
        <div className="bg-brand-dark p-4 rounded-lg border-l-4 border-purple-500">
          <div className="text-sm text-gray-400 uppercase tracking-wide">Private Sessions</div>
          <div className="text-2xl font-bold text-white">{summaryStats.privateSlots}</div>
          <div className="text-xs text-gray-500 mt-1">{summaryStats.bookedPrivate} booked, {summaryStats.availablePrivate} available</div>
        </div>
        <div className="bg-brand-dark p-4 rounded-lg border-l-4 border-green-500">
          <div className="text-sm text-gray-400 uppercase tracking-wide">Total Sessions</div>
          <div className="text-2xl font-bold text-white">{summaryStats.classes + summaryStats.privateSlots}</div>
          <div className="text-xs text-gray-500 mt-1">This {viewMode}</div>
        </div>
        <div className="bg-brand-dark p-4 rounded-lg border-l-4 border-yellow-500">
          <div className="text-sm text-gray-400 uppercase tracking-wide">Utilization</div>
          <div className="text-2xl font-bold text-white">
            {summaryStats.privateSlots > 0 
              ? Math.round((summaryStats.bookedPrivate / summaryStats.privateSlots) * 100)
              : 0}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Private slots</div>
        </div>
      </div>

      {/* View mode selector */}
      <div className="flex gap-2 mb-4">
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

      {/* Legend */}
      <div className="flex gap-4 text-sm mb-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-600 rounded"></div>
          <span className="text-gray-300">Classes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-500 rounded shadow shadow-purple-500/50"></div>
          <span className="text-gray-300">Available Private Sessions</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-700 rounded"></div>
          <span className="text-gray-300">Booked Private Sessions</span>
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

export default CoachScheduleView;


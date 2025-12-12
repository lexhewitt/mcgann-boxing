
import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { GymClass } from '../../types';
import ClassDetailsModal from './ClassDetailsModal';
import Button from '../ui/Button';

interface CalendarViewProps {
  coachId?: string;
}

const CalendarView: React.FC<CalendarViewProps> = ({ coachId }) => {
  const { classes, coaches } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState<GymClass | null>(null);

  const filteredClasses = useMemo(() => {
    if (coachId) {
      return classes.filter(c => 
        c.coachId === coachId || 
        (c.coachIds && c.coachIds.includes(coachId))
      );
    }
    return classes;
  }, [classes, coachId]);

  const daysOfWeekNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  const handleClassClick = (cls: GymClass) => {
    setSelectedClass(cls);
  };

  const renderCalendarDays = () => {
    const blanks = Array(firstDayOfMonth).fill(null);
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const calendarCells = [...blanks, ...daysArray];

    return calendarCells.map((day, index) => {
      if (day === null) {
        return <div key={`blank-${index}`} className="border border-gray-800 bg-brand-dark/50"></div>;
      }
      
      const date = new Date(year, month, day);
      const dayOfWeekName = daysOfWeekNames[date.getDay()];
      const dayClasses = filteredClasses
        .filter(c => c.day === dayOfWeekName)
        .sort((a,b) => a.time.localeCompare(b.time));

      const isToday = new Date().toDateString() === date.toDateString();

      return (
        <div key={day} className="border border-gray-800 p-2 min-h-[120px] flex flex-col relative">
          <span className={`font-bold ${isToday ? 'bg-brand-red rounded-full h-6 w-6 flex items-center justify-center text-white' : 'text-white'}`}>
            {day}
          </span>
          <div className="flex-grow space-y-1 mt-1 overflow-y-auto">
            {dayClasses.map(cls => {
                const coach = coaches.find(c => c.id === cls.coachId);
                return (
                  <div 
                    key={`${cls.id}-${day}`} 
                    className="bg-brand-dark p-1 rounded-md text-xs cursor-pointer hover:bg-brand-red transition-colors"
                    onClick={() => handleClassClick(cls)}
                    aria-label={`View details for ${cls.name}`}
                  >
                    <p className="font-semibold truncate text-white">{cls.name}</p>
                    <p className="text-gray-400">{cls.time}</p>
                     <p className="text-gray-400 truncate">{coach?.name} {cls.originalCoachId && <span className="text-yellow-400">(Cover)</span>}</p>
                  </div>
                )
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="bg-brand-gray p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <Button onClick={handlePrevMonth}>&lt; Prev</Button>
        <h2 className="text-xl font-bold text-white">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
        <Button onClick={handleNextMonth}>Next &gt;</Button>
      </div>
      <div className="grid grid-cols-7 text-center font-bold text-brand-red mb-2">
        {daysOfWeekNames.map(day => (
          <div key={day} className="py-2">{day.substring(0,3)}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 auto-rows-[120px]">
        {renderCalendarDays()}
      </div>
      {selectedClass && (
        <ClassDetailsModal 
          gymClass={selectedClass} 
          onClose={() => setSelectedClass(null)} 
        />
      )}
    </div>
  );
};

export default CalendarView;
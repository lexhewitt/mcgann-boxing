
import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { AvailabilitySlot, UserRole, GymClass, Coach } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { timeToMinutes, parseClassTime } from '../../utils/time';
import AvailabilityWizard from './AvailabilityWizard';

interface CoachAvailabilityManagerProps {
    coach: Coach;
}

const CoachAvailabilityManager: React.FC<CoachAvailabilityManagerProps> = ({ coach }) => {
    const { classes, coachAvailability, addAvailabilitySlot, deleteAvailabilitySlot, unavailableSlots, addUnavailableSlot, deleteUnavailableSlot } = useData();
    const [showWizard, setShowWizard] = useState(false);
    
    // State for one-off unavailability
    const [unavailableDate, setUnavailableDate] = useState(new Date().toISOString().split('T')[0]);
    const [isAllDay, setIsAllDay] = useState(true);
    const [unavailableStartTime, setUnavailableStartTime] = useState('09:00');
    const [unavailableEndTime, setUnavailableEndTime] = useState('17:00');
    const [unavailableError, setUnavailableError] = useState('');
    
    const myAvailability = coachAvailability.filter(slot => slot.coachId === coach.id);
    const myUnavailableSlots = unavailableSlots.filter(slot => slot.coachId === coach.id);
    
    const handleUnavailableSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setUnavailableError('');
        if (!isAllDay && unavailableStartTime >= unavailableEndTime) {
            setUnavailableError('End time must be after start time.');
            return;
        }
        if(!unavailableDate){
            setUnavailableError('Please select a date.');
            return;
        }

        const slotData = {
            coachId: coach.id,
            date: unavailableDate,
            ...( !isAllDay && { startTime: unavailableStartTime, endTime: unavailableEndTime })
        };
        addUnavailableSlot(slotData);
    };


    const daysOfWeek: AvailabilitySlot['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
        <div className="bg-brand-gray p-6 rounded-lg mt-8 space-y-12">
            {/* Recurring Availability Section */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-semibold text-white mb-2">Manage Recurring Availability</h2>
                        <p className="text-sm text-gray-400">Set your general weekly schedule. Classes can only be assigned to you during these times.</p>
                    </div>
                    <Button onClick={() => setShowWizard(true)}>Create Availability (Wizard)</Button>
                </div>
                

                <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Current Recurring Slots</h3>
                    {myAvailability.length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {myAvailability.map(slot => {
                                const slotStartMinutes = timeToMinutes(slot.startTime);
                                const slotEndMinutes = timeToMinutes(slot.endTime);

                                const classesInSlot = classes.filter(cls => {
                                    if (cls.coachId !== coach.id || cls.day !== slot.day) {
                                        return false;
                                    }
                                    const classTime = parseClassTime(cls.time);
                                    if (!classTime) return false;

                                    return classTime.startMinutes >= slotStartMinutes && classTime.endMinutes <= slotEndMinutes;
                                });
                                
                                return (
                                    <div key={slot.id} className="flex justify-between items-start bg-brand-dark p-3 rounded">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <p className="font-semibold text-white">{slot.day}: {slot.startTime} – {slot.endTime}</p>
                                                <button
                                                    onClick={() => {
                                                        const newStart = prompt('Enter new start time (HH:MM):', slot.startTime);
                                                        const newEnd = prompt('Enter new end time (HH:MM):', slot.endTime);
                                                        if (newStart && newEnd && newStart < newEnd) {
                                                            // Update the slot - we'll need to delete and recreate
                                                            deleteAvailabilitySlot(slot.id);
                                                            setTimeout(() => {
                                                                addAvailabilitySlot({
                                                                    coachId: coach.id,
                                                                    day: slot.day,
                                                                    startTime: newStart,
                                                                    endTime: newEnd,
                                                                });
                                                            }, 100);
                                                        } else if (newStart && newEnd) {
                                                            alert('End time must be after start time');
                                                        }
                                                    }}
                                                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                                                >
                                                    Edit Times
                                                </button>
                                            </div>
                                             {classesInSlot.length > 0 ? (
                                                <ul className="mt-2 pl-4 list-disc list-inside space-y-1">
                                                    {classesInSlot.map(cls => (
                                                        <li key={cls.id} className="text-sm text-gray-300">
                                                            {cls.name} <span className="text-gray-500">({cls.time})</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-gray-500 italic mt-1">No classes scheduled in this slot.</p>
                                            )}
                                        </div>
                                        <Button variant="danger" className="text-xs py-1 px-2 flex-shrink-0" onClick={() => deleteAvailabilitySlot(slot.id)}>Remove</Button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-gray-400">You have no recurring availability slots set. Use the wizard above to create availability.</p>
                    )}
                </div>
            </div>
            
            {/* Unavailability Section */}
            <div>
                 <h2 className="text-2xl font-semibold text-white mb-2">Block Out Time</h2>
                <p className="text-sm text-gray-400 mb-6">Add specific dates or times you are unavailable (e.g., holidays, appointments). This will override your recurring availability.</p>

                <form onSubmit={handleUnavailableSubmit} className="bg-brand-dark p-4 rounded-lg mb-6 space-y-4">
                     <Input label="Date" id="unavailable-date" type="date" value={unavailableDate} onChange={e => setUnavailableDate(e.target.value)} />
                     <div className="flex items-center gap-2">
                        <input type="checkbox" id="all-day-check" checked={isAllDay} onChange={e => setIsAllDay(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red" />
                        <label htmlFor="all-day-check" className="text-sm text-gray-300">All Day</label>
                     </div>
                     {!isAllDay && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Start Time" id="unavailable-start" type="time" value={unavailableStartTime} onChange={e => setUnavailableStartTime(e.target.value)} />
                            <Input label="End Time" id="unavailable-end" type="time" value={unavailableEndTime} onChange={e => setUnavailableEndTime(e.target.value)} />
                        </div>
                     )}
                     <Button type="submit" className="w-full md:w-auto">Block Time</Button>
                     {unavailableError && <p className="text-red-500 text-sm mt-2">{unavailableError}</p>}
                </form>

                <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Upcoming Blocked Time</h3>
                    {myUnavailableSlots.length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {myUnavailableSlots.map(slot => (
                                <div key={slot.id} className="flex justify-between items-center bg-brand-dark p-3 rounded">
                                    <div>
                                        <p className="font-semibold">{new Date(slot.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                        <p className="text-sm text-gray-400">{slot.startTime && slot.endTime ? `${slot.startTime} – ${slot.endTime}` : 'All Day'}</p>
                                    </div>
                                    <Button variant="danger" className="text-xs py-1 px-2" onClick={() => deleteUnavailableSlot(slot.id)}>Remove</Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400">You have no upcoming time blocked out.</p>
                    )}
                </div>
            </div>

            <AvailabilityWizard
                isOpen={showWizard}
                onClose={() => setShowWizard(false)}
                coach={coach}
            />
        </div>
    );
}

export default CoachAvailabilityManager;
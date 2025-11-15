
import React, { useState, useMemo } from 'react';
import { Coach, AvailabilitySlot, GymClass } from '../../types';
import { useData } from '../../context/DataContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { isCoachAvailable, getNextDateForDay, parseClassTime } from '../../utils/time';

interface CoachSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  coach: Coach;
}

type TempAvailabilitySlot = Omit<AvailabilitySlot, 'id' | 'coachId'>;

const CoachSetupWizard: React.FC<CoachSetupWizardProps> = ({ isOpen, onClose, coach }) => {
  const { classes, coaches, addClass, updateClass, addAvailabilitySlot: saveAvailabilitySlot, coachAvailability, unavailableSlots } = useData();
  const [step, setStep] = useState(1);
  const [availability, setAvailability] = useState<TempAvailabilitySlot[]>([]);
  const [error, setError] = useState('');
  
  // States for Step 1
  const [day, setDay] = useState<AvailabilitySlot['day']>('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  // States for Step 2
  const [assignClassId, setAssignClassId] = useState('');
  const [newClassData, setNewClassData] = useState({
      name: '',
      description: '',
      day: 'Monday' as GymClass['day'],
      startTime: '17:00',
      endTime: '18:00',
      capacity: '10',
      price: '10'
  });

  const daysOfWeek: AvailabilitySlot['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleAddSlot = () => {
    setError('');
    if (startTime >= endTime) {
      setError('End time must be after start time.');
      return;
    }
    const newSlot = { day, startTime, endTime };
    // Prevent duplicate slots
    if (!availability.some(s => s.day === newSlot.day && s.startTime === newSlot.startTime && s.endTime === newSlot.endTime)) {
        setAvailability([...availability, newSlot].sort((a, b) => daysOfWeek.indexOf(a.day) - daysOfWeek.indexOf(b.day) || a.startTime.localeCompare(b.startTime)));
    }
  };

  const handleDeleteSlot = (index: number) => {
    setAvailability(availability.filter((_, i) => i !== index));
  };
  
  const handleAssignClass = () => {
      setError('');
      if (!assignClassId) {
          setError('Please select a class to assign.');
          return;
      }
      const classToAssign = classes.find(c => c.id === assignClassId);
      if (!classToAssign) {
          setError('Selected class not found.');
          return;
      }

      // We need to check against the temporary availability we are setting
      const availabilityCheck = isCoachAvailable({
          coachId: coach.id,
          day: classToAssign.day,
          time: classToAssign.time,
          allClasses: classes,
          coachAvailability: availability.map(a => ({...a, id: '', coachId: coach.id})), // Use temp availability
          unavailableSlots: unavailableSlots,
          checkDate: getNextDateForDay(classToAssign.day),
      });

      if (!availabilityCheck.isAvailable) {
          setError(`Cannot assign: ${availabilityCheck.reason}`);
          return;
      }

      updateClass({ ...classToAssign, coachId: coach.id });
      setAssignClassId(''); // Reset dropdown
      alert(`${classToAssign.name} assigned to ${coach.name}.`);
  };
  
  const handleCreateClass = () => {
      setError('');
      if (newClassData.startTime >= newClassData.endTime) {
          setError('End time must be after start time for the new class.');
          return;
      }
      const combinedTime = `${newClassData.startTime} – ${newClassData.endTime}`;
      const availabilityCheck = isCoachAvailable({
          coachId: coach.id,
          day: newClassData.day,
          time: combinedTime,
          allClasses: classes,
          coachAvailability: availability.map(a => ({...a, id: '', coachId: coach.id})),
          unavailableSlots: unavailableSlots,
          checkDate: getNextDateForDay(newClassData.day),
      });

      if (!availabilityCheck.isAvailable) {
          setError(`Cannot create class: ${availabilityCheck.reason}`);
          return;
      }

      addClass({
          name: newClassData.name,
          description: newClassData.description,
          day: newClassData.day,
          time: combinedTime,
          coachId: coach.id,
          capacity: parseInt(newClassData.capacity, 10),
          price: parseFloat(newClassData.price),
      });
      alert(`New class "${newClassData.name}" created and assigned to ${coach.name}.`);
      setNewClassData({ name: '', description: '', day: 'Monday', startTime: '17:00', endTime: '18:00', capacity: '10', price: '10' }); // Reset form
  };

  const handleFinish = () => {
    // Save all the temporary availability slots
    availability.forEach(slot => {
      saveAvailabilitySlot({
        coachId: coach.id,
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
      });
    });
    onClose();
  };

  const timeOptions = useMemo(() => {
    const options = [];
    for (let h = 6; h <= 21; h++) {
        for (let m = 0; m < 60; m += 15) {
            const hour = String(h).padStart(2, '0');
            const minute = String(m).padStart(2, '0');
            options.push(`${hour}:${minute}`);
        }
    }
    return options;
  }, []);
  

  return (
    <Modal isOpen={isOpen} onClose={handleFinish} title={`Setup for ${coach.name}`}>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-center text-brand-red">Step {step} of 2: {step === 1 ? 'Set Weekly Availability' : 'Assign Classes'}</h3>

        {error && <p className="text-red-500 text-sm bg-red-900/20 p-2 rounded">{error}</p>}

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-brand-dark p-4 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Day</label>
                <select value={day} onChange={e => setDay(e.target.value as AvailabilitySlot['day'])} className="w-full bg-brand-gray border border-gray-600 rounded-md px-3 py-2 text-white">
                  {daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <Input label="Start Time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
              <Input label="End Time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
              <Button type="button" onClick={handleAddSlot}>Add Slot</Button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {availability.map((slot, index) => (
                <div key={index} className="flex justify-between items-center bg-brand-dark p-2 rounded">
                  <p>{slot.day}: {slot.startTime} – {slot.endTime}</p>
                  <Button variant="danger" className="text-xs py-1 px-2" onClick={() => handleDeleteSlot(index)}>Remove</Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            {/* Assign Existing Class */}
            <div className="bg-brand-dark p-4 rounded-lg space-y-3">
                <h4 className="font-semibold text-white">Assign an Existing Class</h4>
                <select value={assignClassId} onChange={e => setAssignClassId(e.target.value)} className="w-full bg-brand-gray border border-gray-600 rounded-md px-3 py-2 text-white">
                    <option value="">-- Select a class to re-assign --</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({coaches.find(co => co.id === c.coachId)?.name})</option>)}
                </select>
                <Button type="button" onClick={handleAssignClass} disabled={!assignClassId}>Assign Class</Button>
            </div>
            {/* Create New Class */}
            <div className="bg-brand-dark p-4 rounded-lg space-y-3">
                 <h4 className="font-semibold text-white">Or, Create a New Class</h4>
                 <Input label="Class Name" value={newClassData.name} onChange={e => setNewClassData({...newClassData, name: e.target.value})} />
                 <select value={newClassData.day} onChange={e => setNewClassData({...newClassData, day: e.target.value as GymClass['day']})} className="w-full bg-brand-gray border border-gray-600 rounded-md px-3 py-2 text-white">
                    {daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}
                 </select>
                 <div className="grid grid-cols-2 gap-4">
                     <select value={newClassData.startTime} onChange={e => setNewClassData({...newClassData, startTime: e.target.value})} className="w-full bg-brand-gray border border-gray-600 rounded-md px-3 py-2 text-white">
                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                     <select value={newClassData.endTime} onChange={e => setNewClassData({...newClassData, endTime: e.target.value})} className="w-full bg-brand-gray border border-gray-600 rounded-md px-3 py-2 text-white">
                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                 </div>
                 <Input label="Capacity" type="number" value={newClassData.capacity} onChange={e => setNewClassData({...newClassData, capacity: e.target.value})} />
                 <Input label="Price (£)" type="number" value={newClassData.price} onChange={e => setNewClassData({...newClassData, price: e.target.value})} />
                 <Button type="button" onClick={handleCreateClass} disabled={!newClassData.name}>Create Class</Button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-gray-700">
          <div>
            {step === 2 && <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>}
          </div>
          <div>
            {step === 1 && <Button onClick={() => { setError(''); setStep(2); }}>Next</Button>}
            {step === 2 && <Button onClick={handleFinish}>Finish Setup</Button>}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CoachSetupWizard;

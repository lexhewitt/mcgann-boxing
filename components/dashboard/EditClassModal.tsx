import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { GymClass } from '../../types';
import { isCoachAvailable, getNextDateForDay } from '../../utils/time';

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  gymClass: GymClass | null;
}

const EditClassModal: React.FC<EditClassModalProps> = ({ isOpen, onClose, gymClass }) => {
  const { updateClass, coaches, classes, coachAvailability, unavailableSlots } = useData();
  const [formData, setFormData] = useState<GymClass | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState('');

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

  useEffect(() => {
    if (gymClass) {
      setFormData(gymClass);
      const timeParts = gymClass.time.split('–').map(s => s.trim());
      if (timeParts.length === 2 && timeParts[0] && timeParts[1]) {
          setStartTime(timeParts[0]);
          setEndTime(timeParts[1]);
      } else {
          // Fallback for malformed data
          setStartTime('17:00');
          setEndTime('18:00');
      }
    }
  }, [gymClass]);

  if (!isOpen || !formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.day || !formData.coachId || !formData.capacity || !formData.price) {
      setError("All fields are required.");
      return;
    }
    
    if (startTime >= endTime) {
      setError('End time must be after start time.');
      return;
    }
    
    const combinedTime = `${startTime} – ${endTime}`;

    const nextClassDate = getNextDateForDay(formData.day);
    const coachIsAvailableCheck = isCoachAvailable({
        coachId: formData.coachId,
        day: formData.day,
        time: combinedTime,
        allClasses: classes,
        coachAvailability,
        unavailableSlots,
        checkDate: nextClassDate,
        classIdToIgnore: formData.id, // Important for edit checks
    });

    if (!coachIsAvailableCheck.isAvailable) {
        setError(coachIsAvailableCheck.reason);
        return;
    }

    updateClass({
      ...formData,
      time: combinedTime,
      capacity: parseInt(String(formData.capacity), 10),
      price: parseFloat(String(formData.price)),
    });
    onClose();
  };

  const daysOfWeek: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Class: ${gymClass?.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-500 text-sm bg-red-900/20 p-2 rounded">{error}</p>}
        <Input label="Class Name" id="edit-class-name" name="name" type="text" value={formData.name} onChange={handleChange} required />
        <div>
          <label htmlFor="edit-class-desc" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
          <textarea id="edit-class-desc" name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500"></textarea>
        </div>
        <div>
          <label htmlFor="edit-class-day" className="block text-sm font-medium text-gray-300 mb-1">Day</label>
          <select id="edit-class-day" name="day" value={formData.day} onChange={handleChange} className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white">
            {daysOfWeek.map(day => <option key={day} value={day}>{day}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit-class-start-time" className="block text-sm font-medium text-gray-300 mb-1">Start Time</label>
            <select id="edit-class-start-time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white">
              {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="edit-class-end-time" className="block text-sm font-medium text-gray-300 mb-1">End Time</label>
            <select id="edit-class-end-time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white">
              {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="edit-class-coach" className="block text-sm font-medium text-gray-300 mb-1">Coach</label>
          <select id="edit-class-coach" name="coachId" value={formData.coachId} onChange={handleChange} className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white" required>
            <option value="">Select a coach</option>
            {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <Input label="Capacity" id="edit-class-capacity" name="capacity" type="number" value={formData.capacity} onChange={handleChange} required />
        <Input label="Price (£)" id="edit-class-price" name="price" type="number" value={formData.price} onChange={handleChange} required step="0.01" />
        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditClassModal;

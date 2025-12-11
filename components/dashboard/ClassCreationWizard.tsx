import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Coach } from '../../types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { isCoachAvailable, getNextDateForDay } from '../../utils/time';

interface ClassCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

type WizardStep = 'details' | 'schedule' | 'coach' | 'review';

const ClassCreationWizard: React.FC<ClassCreationWizardProps> = ({ isOpen, onClose }) => {
  const { addClass, coaches, classes, coachAvailability, unavailableSlots } = useData();
  const [step, setStep] = useState<WizardStep>('details');
  const [error, setError] = useState('');

  // Step 1: Class details
  const [className, setClassName] = useState('');
  const [description, setDescription] = useState('');

  // Step 2: Schedule
  const [isRecurring, setIsRecurring] = useState(true);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('18:00');
  const [dayTimes, setDayTimes] = useState<Record<string, { start: string; end: string }>>({});

  // Step 3: Coach and capacity
  const [coachId, setCoachId] = useState(''); // Primary coach (for backward compatibility)
  const [coachIds, setCoachIds] = useState<string[]>([]); // Multiple coaches
  const [capacity, setCapacity] = useState('');
  const [price, setPrice] = useState('');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

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

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev => {
      const newDays = prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day];
      
      // Initialize default times for newly added days
      if (!prev.includes(day) && newDays.includes(day)) {
        setDayTimes(prevTimes => ({
          ...prevTimes,
          [day]: { start: startTime, end: endTime }
        }));
      } else if (prev.includes(day) && !newDays.includes(day)) {
        // Remove times for deselected days
        setDayTimes(prevTimes => {
          const newTimes = { ...prevTimes };
          delete newTimes[day];
          return newTimes;
        });
      }
      
      return newDays;
    });
  };

  const updateDayTime = (day: string, field: 'start' | 'end', value: string) => {
    setDayTimes(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleNext = () => {
    setError('');
    
    if (step === 'details') {
      if (!className.trim()) {
        setError('Class name is required');
        return;
      }
    }
    
    if (step === 'schedule') {
      if (isRecurring && selectedDays.length === 0) {
        setError('Please select at least one day for recurring classes');
        return;
      }
      if (!isRecurring && selectedDays.length === 0) {
        setError('Please select a day');
        return;
      }
      
      // Validate all day times
      const daysToCheck = isRecurring ? selectedDays : selectedDays;
      for (const day of daysToCheck) {
        const times = dayTimes[day] || { start: startTime, end: endTime };
        if (times.start >= times.end) {
          setError(`End time must be after start time for ${day}`);
          return;
        }
      }
    }
    
    if (step === 'coach') {
      if (coachIds.length === 0) {
        setError('Please select at least one coach');
        return;
      }
      if (!capacity || parseInt(capacity) <= 0) {
        setError('Please enter a valid capacity');
        return;
      }
      if (!price || parseFloat(price) < 0) {
        setError('Please enter a valid price');
        return;
      }
    }
    
    if (step === 'details') setStep('schedule');
    else if (step === 'schedule') setStep('coach');
    else if (step === 'coach') setStep('review');
  };

  const handleBack = () => {
    if (step === 'schedule') setStep('details');
    else if (step === 'coach') setStep('schedule');
    else if (step === 'review') setStep('coach');
  };

  const handleFinish = () => {
    setError('');

    // Validate coaches selected
    if (coachIds.length === 0) {
      setError('Please select at least one coach');
      return;
    }

    // Ensure primary coach is set
    if (!coachId && coachIds.length > 0) {
      setCoachId(coachIds[0]);
    }

    const daysToCreate = isRecurring ? selectedDays : selectedDays;
    
    // Check availability for each coach and each day
    for (const coachIdToCheck of coachIds) {
      for (const day of daysToCreate) {
        const times = dayTimes[day] || { start: startTime, end: endTime };
        const combinedTime = `${times.start} – ${times.end}`;
        
        const nextClassDate = getNextDateForDay(day as typeof daysOfWeek[number]);
        const coachIsAvailableCheck = isCoachAvailable({
          coachId: coachIdToCheck,
          day: day as typeof daysOfWeek[number],
          time: combinedTime,
          allClasses: classes,
          coachAvailability,
          unavailableSlots,
          checkDate: nextClassDate,
        });

        if (!coachIsAvailableCheck.isAvailable) {
          const coachName = coaches.find(c => c.id === coachIdToCheck)?.name || 'Coach';
          setError(`${coachName} unavailable on ${day}: ${coachIsAvailableCheck.reason}`);
          return;
        }
      }
    }

    // Create class for each selected day
    daysToCreate.forEach(day => {
      const times = dayTimes[day] || { start: startTime, end: endTime };
      const combinedTime = `${times.start} – ${times.end}`;
      
      addClass({
        name: className,
        description,
        day: day as typeof daysOfWeek[number],
        time: combinedTime,
        coachId: coachId || coachIds[0], // Primary coach
        coachIds: coachIds.length > 1 ? coachIds : undefined, // Multiple coaches if more than one
        capacity: parseInt(capacity, 10),
        price: parseFloat(price),
      });
    });
    
    // Reset and close
    setStep('details');
    setClassName('');
    setDescription('');
    setIsRecurring(true);
    setSelectedDays([]);
    setStartTime('17:00');
    setEndTime('18:00');
    setDayTimes({});
    setCoachId('');
    setCoachIds([]);
    setCapacity('');
    setPrice('');
    setError('');
    onClose();
  };

  const handleCancel = () => {
    setStep('details');
    setClassName('');
    setDescription('');
    setIsRecurring(true);
    setSelectedDays([]);
    setStartTime('17:00');
    setEndTime('18:00');
    setDayTimes({});
    setCoachId('');
    setCoachIds([]);
    setCapacity('');
    setPrice('');
    setError('');
    onClose();
  };

  const renderStep = () => {
    switch (step) {
      case 'details':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Class Details</h3>
              <p className="text-gray-400 text-sm mb-4">Enter the basic information about your class.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Class Name *</label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g., Beginner Boxing"
                className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this class covers..."
                rows={4}
                className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500"
              />
            </div>
          </div>
        );

      case 'schedule':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Schedule</h3>
              <p className="text-gray-400 text-sm mb-4">Set when this class occurs.</p>
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="is-recurring"
                checked={isRecurring}
                onChange={(e) => {
                  setIsRecurring(e.target.checked);
                  if (!e.target.checked && selectedDays.length > 1) {
                    setSelectedDays([selectedDays[0]]);
                  }
                }}
                className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
              />
              <label htmlFor="is-recurring" className="text-sm font-medium text-gray-300">
                This is a recurring class
              </label>
            </div>

            {isRecurring ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Select Days (can select multiple)</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {daysOfWeek.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDayToggle(day)}
                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                          selectedDays.includes(day)
                            ? 'border-brand-red bg-brand-red/20 text-white'
                            : 'border-gray-600 bg-brand-dark text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  {selectedDays.length > 0 && (
                    <p className="text-sm text-gray-400 mt-2">Selected: {selectedDays.join(', ')}</p>
                  )}
                </div>

                {selectedDays.length > 0 && (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    <p className="text-sm font-medium text-gray-300">Set times for each day:</p>
                    {selectedDays.map(day => {
                      const times = dayTimes[day] || { start: startTime, end: endTime };
                      return (
                        <div key={day} className="bg-brand-dark p-4 rounded-lg">
                          <h4 className="text-white font-semibold mb-3">{day}</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                              <select
                                value={times.start}
                                onChange={(e) => updateDayTime(day, 'start', e.target.value)}
                                className="w-full bg-brand-gray border border-gray-600 rounded-md px-3 py-2 text-white"
                              >
                                {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
                              <select
                                value={times.end}
                                onChange={(e) => updateDayTime(day, 'end', e.target.value)}
                                className="w-full bg-brand-gray border border-gray-600 rounded-md px-3 py-2 text-white"
                              >
                                {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
                              </select>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">Class time: {times.start} - {times.end}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Select Day</label>
                  <select
                    value={selectedDays[0] || ''}
                    onChange={(e) => {
                      const day = e.target.value;
                      setSelectedDays(day ? [day] : []);
                      if (day) {
                        setDayTimes({ [day]: { start: startTime, end: endTime } });
                      }
                    }}
                    className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white"
                  >
                    <option value="">Select a day</option>
                    {daysOfWeek.map(day => <option key={day} value={day}>{day}</option>)}
                  </select>
                </div>
                {selectedDays.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                      <select
                        value={startTime}
                        onChange={(e) => {
                          setStartTime(e.target.value);
                          if (selectedDays[0]) {
                            updateDayTime(selectedDays[0], 'start', e.target.value);
                          }
                        }}
                        className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white"
                      >
                        {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
                      <select
                        value={endTime}
                        onChange={(e) => {
                          setEndTime(e.target.value);
                          if (selectedDays[0]) {
                            updateDayTime(selectedDays[0], 'end', e.target.value);
                          }
                        }}
                        className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white"
                      >
                        {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 'coach':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Coaches & Capacity</h3>
              <p className="text-gray-400 text-sm mb-4">Select one or more coaches for this class. Large classes can have multiple coaches.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Select Coaches *</label>
              <div className="bg-brand-dark border border-gray-600 rounded-md p-4 max-h-64 overflow-y-auto">
                {coaches.map(coach => {
                  const isSelected = coachIds.includes(coach.id);
                  return (
                    <label
                      key={coach.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-brand-red/20 border-2 border-brand-red'
                          : 'bg-brand-gray/50 border-2 border-transparent hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const newCoachIds = [...coachIds, coach.id];
                            setCoachIds(newCoachIds);
                            // Set primary coach if none selected
                            if (!coachId) {
                              setCoachId(coach.id);
                            }
                          } else {
                            const newCoachIds = coachIds.filter(id => id !== coach.id);
                            setCoachIds(newCoachIds);
                            // Update primary coach if it was removed
                            if (coachId === coach.id && newCoachIds.length > 0) {
                              setCoachId(newCoachIds[0]);
                            } else if (newCoachIds.length === 0) {
                              setCoachId('');
                            }
                          }
                        }}
                        className="h-5 w-5 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                      />
                      <div className="flex-1">
                        <p className="text-white font-medium">{coach.name}</p>
                        {coach.level && <p className="text-xs text-gray-400">{coach.level}</p>}
                      </div>
                      {coachIds.includes(coach.id) && coachIds[0] === coach.id && (
                        <span className="text-xs text-brand-red font-semibold">Primary</span>
                      )}
                    </label>
                  );
                })}
              </div>
              {coachIds.length > 0 && (
                <p className="text-sm text-gray-400 mt-2">
                  Selected: {coachIds.map(id => coaches.find(c => c.id === id)?.name).filter(Boolean).join(', ')}
                </p>
              )}
              {coachIds.length === 0 && (
                <p className="text-sm text-yellow-400 mt-2">Please select at least one coach</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Capacity *</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="e.g., 15"
                  min="1"
                  className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Price (£) *</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g., 10.00"
                  min="0"
                  step="0.01"
                  className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 'review':
        const selectedCoaches = coachIds.map(id => coaches.find(c => c.id === id)).filter(Boolean);
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Review Your Class</h3>
              <p className="text-gray-400 text-sm mb-4">Please review all details before creating.</p>
            </div>
            <div className="bg-brand-dark p-6 rounded-lg space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Class Name</p>
                <p className="text-white font-semibold">{className}</p>
              </div>
              {description && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Description</p>
                  <p className="text-white">{description}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-400 mb-1">Recurring</p>
                <p className="text-white font-semibold">{isRecurring ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Schedule</p>
                <div className="space-y-2 mt-2">
                  {selectedDays.map(day => {
                    const times = dayTimes[day] || { start: startTime, end: endTime };
                    return (
                      <p key={day} className="text-white">
                        <span className="font-semibold">{day}:</span> {times.start} - {times.end}
                      </p>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Coaches {coachIds.length > 1 && `(${coachIds.length})`}</p>
                <div className="space-y-1 mt-2">
                  {coachIds.map(id => {
                    const coach = coaches.find(c => c.id === id);
                    return coach ? (
                      <div key={coach.id} className="bg-brand-gray p-2 rounded flex items-center justify-between">
                        <p className="text-white font-medium">
                          {coach.name}
                          {coach.id === coachId && <span className="text-brand-red ml-2 text-xs">(Primary)</span>}
                        </p>
                      </div>
                    ) : null;
                  })}
                  {coachIds.length === 0 && (
                    <p className="text-yellow-400">No coaches selected</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Capacity</p>
                  <p className="text-white font-semibold">{capacity}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Price</p>
                  <p className="text-white font-semibold">£{price}</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'details': return 'Step 1: Class Details';
      case 'schedule': return 'Step 2: Schedule';
      case 'coach': return 'Step 3: Coach & Capacity';
      case 'review': return 'Step 4: Review';
      default: return '';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title={getStepTitle()}>
      <div className="space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-6">
          {['details', 'schedule', 'coach', 'review'].map((s, index) => (
            <React.Fragment key={s}>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  step === s
                    ? 'bg-brand-red text-white'
                    : ['details', 'schedule', 'coach', 'review'].indexOf(step) > index
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-600 text-gray-300'
                }`}>
                  {index + 1}
                </div>
              </div>
              {index < 3 && <div className={`flex-1 h-1 mx-2 ${['details', 'schedule', 'coach', 'review'].indexOf(step) > index ? 'bg-green-600' : 'bg-gray-600'}`} />}
            </React.Fragment>
          ))}
        </div>

        {error && <div className="bg-red-900/20 border border-red-500 text-red-300 p-3 rounded">{error}</div>}

        {renderStep()}

        <div className="flex justify-between pt-4 border-t border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={step === 'details' ? handleCancel : handleBack}
          >
            {step === 'details' ? 'Cancel' : 'Back'}
          </Button>
          <Button
            type="button"
            onClick={step === 'review' ? handleFinish : handleNext}
          >
            {step === 'review' ? 'Create Class' : 'Next'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ClassCreationWizard;


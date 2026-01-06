import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Coach, SlotType } from '../../types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface AvailabilityWizardProps {
  isOpen: boolean;
  onClose: () => void;
  coach: Coach;
}

type WizardStep = 'type' | 'days' | 'times' | 'review';

const AvailabilityWizard: React.FC<AvailabilityWizardProps> = ({ isOpen, onClose, coach }) => {
  const { addAvailabilitySlot } = useData();
  const [step, setStep] = useState<WizardStep>('type');
  const [sessionType, setSessionType] = useState<SlotType | 'CLASS' | 'GENERAL' | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [dayTimes, setDayTimes] = useState<Record<string, { start: string; end: string }>>({});
  const [error, setError] = useState('');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev => {
      const newDays = prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day];
      
      // Initialize default times for newly added days
      if (!prev.includes(day) && newDays.includes(day)) {
        setDayTimes(prevTimes => ({
          ...prevTimes,
          [day]: { start: '09:00', end: '17:00' }
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
    
    if (step === 'type' && !sessionType) {
      setError('Please select a session type');
      return;
    }
    
    if (step === 'days' && selectedDays.length === 0) {
      setError('Please select at least one day');
      return;
    }
    
    if (step === 'times') {
      // Validate all day times
      for (const day of selectedDays) {
        const times = dayTimes[day] || { start: '09:00', end: '17:00' };
        if (times.start >= times.end) {
          setError(`End time must be after start time for ${day}`);
          return;
        }
      }
    }
    
    if (step === 'type') setStep('days');
    else if (step === 'days') setStep('times');
    else if (step === 'times') setStep('review');
  };

  const handleBack = () => {
    if (step === 'days') setStep('type');
    else if (step === 'times') setStep('days');
    else if (step === 'review') setStep('times');
  };

  const handleFinish = async () => {
    // Map sessionType to availabilityType
    let availabilityType: 'GENERAL' | 'CLASS' | 'PRIVATE' | 'GROUP' = 'GENERAL';
    if (sessionType === SlotType.PRIVATE) {
      availabilityType = 'PRIVATE';
    } else if (sessionType === SlotType.GROUP) {
      availabilityType = 'GROUP';
    } else if (sessionType === 'CLASS') {
      availabilityType = 'CLASS';
    } else if (sessionType === 'GENERAL') {
      availabilityType = 'GENERAL';
    }

    // Create availability slots for each selected day with their specific times
    try {
      await Promise.all(selectedDays.map(day => {
        const times = dayTimes[day] || { start: '09:00', end: '17:00' };
        return addAvailabilitySlot({
          coachId: coach.id,
          day: day as typeof daysOfWeek[number],
          startTime: times.start,
          endTime: times.end,
          availabilityType,
        });
      }));
      
      // Reset and close
      setStep('type');
      setSessionType(null);
      setSelectedDays([]);
      setDayTimes({});
      setError('');
      onClose();
    } catch (err) {
      setError('Failed to save availability. Please try again.');
      console.error('Error saving availability:', err);
    }
  };

  const handleCancel = () => {
    setStep('type');
    setSessionType(null);
    setSelectedDays([]);
    setDayTimes({});
    setError('');
    onClose();
  };

  const renderStep = () => {
    switch (step) {
      case 'type':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">What type of session?</h3>
              <p className="text-gray-400 text-sm mb-4">Choose whether you're setting availability for private one-on-one sessions or group sessions.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSessionType(SlotType.PRIVATE)}
                className={`p-6 rounded-lg border-2 transition-all ${
                  sessionType === SlotType.PRIVATE
                    ? 'border-brand-red bg-brand-red/20'
                    : 'border-gray-600 bg-brand-dark hover:border-gray-500'
                }`}
              >
                <div className="text-4xl mb-2">👤</div>
                <h4 className="text-lg font-semibold text-white mb-1">Private 1-on-1</h4>
                <p className="text-sm text-gray-400">One-on-one training sessions</p>
              </button>
              <button
                type="button"
                onClick={() => setSessionType(SlotType.GROUP)}
                className={`p-6 rounded-lg border-2 transition-all ${
                  sessionType === SlotType.GROUP
                    ? 'border-brand-red bg-brand-red/20'
                    : 'border-gray-600 bg-brand-dark hover:border-gray-500'
                }`}
              >
                <div className="text-4xl mb-2">👥</div>
                <h4 className="text-lg font-semibold text-white mb-1">Group Session</h4>
                <p className="text-sm text-gray-400">Small group training</p>
              </button>
              <button
                type="button"
                onClick={() => setSessionType('CLASS' as any)}
                className={`p-6 rounded-lg border-2 transition-all ${
                  sessionType === 'CLASS'
                    ? 'border-brand-red bg-brand-red/20'
                    : 'border-gray-600 bg-brand-dark hover:border-gray-500'
                }`}
              >
                <div className="text-4xl mb-2">📚</div>
                <h4 className="text-lg font-semibold text-white mb-1">Group Class</h4>
                <p className="text-sm text-gray-400">Scheduled group classes</p>
              </button>
              <button
                type="button"
                onClick={() => setSessionType('GENERAL' as any)}
                className={`p-6 rounded-lg border-2 transition-all ${
                  sessionType === 'GENERAL'
                    ? 'border-brand-red bg-brand-red/20'
                    : 'border-gray-600 bg-brand-dark hover:border-gray-500'
                }`}
              >
                <div className="text-4xl mb-2">⏰</div>
                <h4 className="text-lg font-semibold text-white mb-1">General Availability</h4>
                <p className="text-sm text-gray-400">Any booking type</p>
              </button>
            </div>
          </div>
        );

      case 'days':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Which days are you available?</h3>
              <p className="text-gray-400 text-sm mb-4">Select all days when you're free for {
                sessionType === SlotType.PRIVATE ? 'private 1-on-1' : 
                sessionType === SlotType.GROUP ? 'group' :
                sessionType === 'CLASS' ? 'group class' :
                'general'} sessions.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {daysOfWeek.map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayToggle(day)}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    selectedDays.includes(day)
                      ? 'border-brand-red bg-brand-red/20 text-white'
                      : 'border-gray-600 bg-brand-dark text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="font-semibold">{day}</div>
                </button>
              ))}
            </div>
            {selectedDays.length > 0 && (
              <div className="bg-brand-dark p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Selected days:</p>
                <p className="text-white font-semibold">{selectedDays.join(', ')}</p>
              </div>
            )}
          </div>
        );

      case 'times':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">What times are you available?</h3>
              <p className="text-gray-400 text-sm mb-4">Set your available hours for each selected day.</p>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {selectedDays.map(day => {
                const times = dayTimes[day] || { start: '09:00', end: '17:00' };
                return (
                  <div key={day} className="bg-brand-dark p-4 rounded-lg">
                    <h4 className="text-white font-semibold mb-3">{day}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                        <input
                          type="time"
                          value={times.start}
                          onChange={(e) => updateDayTime(day, 'start', e.target.value)}
                          className="w-full bg-brand-gray border border-gray-600 rounded-md px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
                        <input
                          type="time"
                          value={times.end}
                          onChange={(e) => updateDayTime(day, 'end', e.target.value)}
                          className="w-full bg-brand-gray border border-gray-600 rounded-md px-3 py-2 text-white"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Available from {times.start} to {times.end}</p>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Review Your Availability</h3>
              <p className="text-gray-400 text-sm mb-4">Please review your settings before creating.</p>
            </div>
            <div className="bg-brand-dark p-6 rounded-lg space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Session Type</p>
                <p className="text-white font-semibold">
                  {sessionType === SlotType.PRIVATE ? 'Private 1-on-1' : 
                   sessionType === SlotType.GROUP ? 'Group Session' :
                   sessionType === 'CLASS' ? 'Group Class' :
                   'General Availability'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Available Days & Times</p>
                <div className="space-y-2 mt-2">
                  {selectedDays.map(day => {
                    const times = dayTimes[day] || { start: '09:00', end: '17:00' };
                    return (
                      <p key={day} className="text-white">
                        <span className="font-semibold">{day}:</span> {times.start} - {times.end}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'type': return 'Step 1: Session Type';
      case 'days': return 'Step 2: Select Days';
      case 'times': return 'Step 3: Set Times';
      case 'review': return 'Step 4: Review';
      default: return '';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title={getStepTitle()}>
      <div className="space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-6">
          {['type', 'days', 'times', 'review'].map((s, index) => (
            <React.Fragment key={s}>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  step === s
                    ? 'bg-brand-red text-white'
                    : ['type', 'days', 'times', 'review'].indexOf(step) > index
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-600 text-gray-300'
                }`}>
                  {index + 1}
                </div>
              </div>
              {index < 3 && <div className={`flex-1 h-1 mx-2 ${['type', 'days', 'times', 'review'].indexOf(step) > index ? 'bg-green-600' : 'bg-gray-600'}`} />}
            </React.Fragment>
          ))}
        </div>

        {error && <div className="bg-red-900/20 border border-red-500 text-red-300 p-3 rounded">{error}</div>}

        {renderStep()}

        <div className="flex justify-between pt-4 border-t border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={step === 'type' ? handleCancel : handleBack}
          >
            {step === 'type' ? 'Cancel' : 'Back'}
          </Button>
          <Button
            type="button"
            onClick={step === 'review' ? handleFinish : handleNext}
          >
            {step === 'review' ? 'Create Availability' : 'Next'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AvailabilityWizard;


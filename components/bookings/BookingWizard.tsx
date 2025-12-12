import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { CoachSlot, SlotType, GuestBooking, Coach } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { handleGuestCheckout, finalizeStripeCheckoutSession } from '../../services/stripeService';
import { getNextDateForDay } from '../../utils/time';

interface BookableItem {
  id: string;
  type: 'CLASS' | 'PRIVATE' | 'GROUP';
  title: string;
  subtitle: string;
  date: Date;
  price: number;
  coachName?: string;
  coachId?: string;
  classId?: string;
  slotId?: string;
}

type PaymentMethod = 'ONE_OFF' | 'PER_SESSION' | 'WEEKLY' | 'MONTHLY';
type ServiceType = 'CLASS' | 'PRIVATE' | 'GROUP';

const dayNames: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const formatDate = (date: Date) =>
  date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

const formatTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const BookingWizard: React.FC = () => {
  const { classes, coaches, coachSlots, coachAvailability, unavailableSlots, coachAppointments, guestBookings, addGuestBooking } = useData();
  
  // Step 1: Coach selection
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  
  // Step 2: Service type
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null);
  
  // Step 3: Availability selection
  const [selectedItem, setSelectedItem] = useState<BookableItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Step 4: Participant details
  const [participantName, setParticipantName] = useState('');
  const [participantDob, setParticipantDob] = useState('');
  
  // Step 5: Contact info
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  
  // Step 6: Payment method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ONE_OFF');
  
  const [step, setStep] = useState(1);
  const [isProcessing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [monthAnchor, setMonthAnchor] = useState<Date>(new Date());
  const startOfToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);

  // Filter items by selected coach and service type
  const classItems = useMemo(() => {
    const occurrences: BookableItem[] = [];
    const monthStart = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1);
    const monthEnd = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 0);

    // Debug logging
    console.log('[BookingWizard] Filtering classes:', {
      totalClasses: classes.length,
      selectedCoachId: selectedCoach?.id,
      selectedCoachName: selectedCoach?.name,
      monthStart: monthStart.toISOString(),
      monthEnd: monthEnd.toISOString(),
    });

    classes.forEach(cls => {
      // Filter by selected coach if one is selected
      if (selectedCoach && cls.coachId !== selectedCoach.id) {
        console.log(`[BookingWizard] Skipping class ${cls.name} - coach mismatch: ${cls.coachId} !== ${selectedCoach.id}`);
        return;
      }
      
      const coach = coaches.find(c => c.id === cls.coachId);
      let iterator = new Date(monthStart);
      while (iterator <= monthEnd) {
        if (iterator.getDay() === dayNames[cls.day]) {
          const timeSegment = cls.time.split('–')[0].trim();
          const [hours, minutes] = timeSegment.replace('–', '-').split(':');
          const startDate = new Date(iterator);
          startDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
          if (startDate >= startOfToday) {
            occurrences.push({
              id: `class-${cls.id}-${startDate.toISOString()}`,
              type: 'CLASS',
              title: cls.name,
              subtitle: `${coach?.name ?? 'Coach'} · ${cls.time}`,
              date: startDate,
              price: cls.price,
              coachName: coach?.name,
              coachId: cls.coachId,
              classId: cls.id,
            });
          }
        }
        iterator.setDate(iterator.getDate() + 1);
      }
    });
    
    console.log(`[BookingWizard] Found ${occurrences.length} class occurrences for month`);
    return occurrences;
  }, [classes, coaches, monthAnchor, startOfToday, selectedCoach]);

  const slotItems = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);
    
    if (!selectedCoach) return [];
    
    // Debug logging
    console.log('[BookingWizard] Filtering slots:', {
      totalSlots: coachSlots.length,
      totalAvailability: coachAvailability.length,
      selectedCoachId: selectedCoach?.id,
      selectedServiceType,
      monthStart: monthStart.toISOString(),
      monthEnd: monthEnd.toISOString(),
    });

    const items: BookableItem[] = [];
    
    // 1. Add one-off slots (existing coach_slots)
    const oneOffSlots = coachSlots
      .filter(slot => {
        // Filter by selected coach
        if (slot.coachId !== selectedCoach.id) return false;
        // Filter by service type
        if (selectedServiceType === 'PRIVATE' && slot.type !== SlotType.PRIVATE) return false;
        if (selectedServiceType === 'GROUP' && slot.type !== SlotType.GROUP) return false;
        return true;
      })
      .filter(slot => {
        const slotDate = new Date(slot.start);
        const inMonth = slotDate >= monthStart && slotDate <= monthEnd;
        const isFuture = slotDate >= now;
        return inMonth && isFuture;
      })
      .map(slot => {
        const coach = coaches.find(c => c.id === slot.coachId);
        const slotDate = new Date(slot.start);
        // Check if already booked
        const isBooked = coachAppointments.some(apt => apt.slotId === slot.id);
        return {
          id: `slot-${slot.id}`,
          type: slot.type === SlotType.GROUP ? 'GROUP' : 'PRIVATE',
          title: isBooked ? `${slot.title} (Booked)` : slot.title,
          subtitle: `${coach?.name ?? 'Coach'} · ${formatTime(slotDate)}`,
          date: slotDate,
          price: slot.price,
          coachName: coach?.name,
          coachId: slot.coachId,
          slotId: slot.id,
        } as BookableItem;
      });
    items.push(...oneOffSlots);
    
    // 2. Generate slots from recurring availability (for private sessions)
    if (selectedServiceType === 'PRIVATE') {
      const coachAvail = coachAvailability.filter(av => av.coachId === selectedCoach.id);
      const dayNames: Record<string, number> = {
        'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
        'Thursday': 4, 'Friday': 5, 'Saturday': 6
      };
      
      // Generate slots for each day in the month
      let iterator = new Date(monthStart);
      while (iterator <= monthEnd) {
        const dayName = iterator.toLocaleDateString('en-US', { weekday: 'long' });
        const dayAvail = coachAvail.filter(av => av.day === dayName);
        
        dayAvail.forEach(av => {
          const [startHour, startMin] = av.startTime.split(':').map(Number);
          const [endHour, endMin] = av.endTime.split(':').map(Number);
          
          // Create 1-hour slots within the availability window
          let slotStart = new Date(iterator);
          slotStart.setHours(startHour, startMin, 0, 0);
          
          const availabilityEnd = new Date(iterator);
          availabilityEnd.setHours(endHour, endMin, 0, 0);
          
          // Generate slots in 1-hour increments
          while (slotStart < availabilityEnd && slotStart >= now) {
            const slotEnd = new Date(slotStart);
            slotEnd.setHours(slotEnd.getHours() + 1);
            
            if (slotEnd <= availabilityEnd) {
              // Check if this time is blocked by unavailable slot
              const dateString = iterator.toISOString().split('T')[0];
              const isBlocked = unavailableSlots.some(blocked => {
                if (blocked.coachId !== selectedCoach.id || blocked.date !== dateString) return false;
                if (!blocked.startTime || !blocked.endTime) return true; // All-day block
                const [blockStartH, blockStartM] = blocked.startTime.split(':').map(Number);
                const [blockEndH, blockEndM] = blocked.endTime.split(':').map(Number);
                const blockStart = new Date(iterator);
                blockStart.setHours(blockStartH, blockStartM, 0, 0);
                const blockEnd = new Date(iterator);
                blockEnd.setHours(blockEndH, blockEndM, 0, 0);
                return slotStart < blockEnd && slotEnd > blockStart;
              });
              
              // Check if there's a conflicting class
              const hasClassConflict = classes.some(cls => {
                if (cls.coachId !== selectedCoach.id && !(cls.coachIds && cls.coachIds.includes(selectedCoach.id))) return false;
                if (dayNames[cls.day] !== iterator.getDay()) return false;
                const timeParts = cls.time.split('–');
                const [classStartH, classStartM] = timeParts[0].trim().split(':').map(Number);
                const classStart = new Date(iterator);
                classStart.setHours(classStartH, classStartM, 0, 0);
                const classEnd = new Date(classStart);
                const timeEndPart = timeParts[1]?.trim();
                if (timeEndPart) {
                  const [classEndH, classEndM] = timeEndPart.split(':').map(Number);
                  classEnd.setHours(classEndH, classEndM, 0, 0);
                } else {
                  classEnd.setHours(classStartH + 1, classStartM, 0, 0);
                }
                return slotStart < classEnd && slotEnd > classStart;
              });
              
              // Check if there's already a one-off slot at this time
              const hasExistingSlot = coachSlots.some(slot => {
                if (slot.coachId !== selectedCoach.id) return false;
                const existingStart = new Date(slot.start);
                return existingStart.toDateString() === slotStart.toDateString() &&
                       existingStart.getHours() === slotStart.getHours() &&
                       existingStart.getMinutes() === slotStart.getMinutes();
              });
              
              if (!isBlocked && !hasClassConflict && !hasExistingSlot && slotStart >= now) {
                items.push({
                  id: `avail-${selectedCoach.id}-${slotStart.toISOString()}`,
                  type: 'PRIVATE',
                  title: 'Private Session',
                  subtitle: `${selectedCoach.name} · ${formatTime(slotStart)}`,
                  date: new Date(slotStart),
                  price: 30, // Default price, could be from coach settings
                  coachName: selectedCoach.name,
                  coachId: selectedCoach.id,
                  slotId: undefined, // Generated slot, not an existing one
                } as BookableItem);
              }
            }
            
            slotStart.setHours(slotStart.getHours() + 1);
          }
        });
        
        iterator.setDate(iterator.getDate() + 1);
      }
    }
    
    // Sort by date
    items.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    console.log(`[BookingWizard] Found ${items.length} total slots for month (${oneOffSlots.length} one-off, ${items.length - oneOffSlots.length} from availability)`);
    return items;
  }, [coachSlots, coachAvailability, unavailableSlots, classes, coachAppointments, coaches, monthAnchor, selectedCoach, selectedServiceType]);

  const availableItems = useMemo(() => {
    if (selectedServiceType === 'CLASS') {
      return classItems;
    } else {
      return slotItems;
    }
  }, [selectedServiceType, classItems, slotItems]);

  const groupedByDay = useMemo(() => {
    const map: Record<string, BookableItem[]> = {};
    availableItems.forEach(item => {
      const key = item.date.toDateString();
      map[key] = map[key] ? [...map[key], item] : [item];
    });
    return map;
  }, [availableItems]);

  // Initialize from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const coachParam = params.get('coach');
    const classParam = params.get('class');
    
    if (coachParam) {
      const coach = coaches.find(c => c.id === coachParam);
      if (coach) {
        setSelectedCoach(coach);
        setStep(2); // Skip to service type selection
        
        // If a specific class is provided, pre-select it
        if (classParam) {
          const cls = classes.find(c => c.id === classParam && c.coachId === coachParam);
          if (cls) {
            setSelectedServiceType('CLASS');
            // Find the next occurrence of this class
            const nextDate = getNextDateForDay(cls.day);
            const classItem = classItems.find(item => 
              item.classId === cls.id && 
              item.date >= nextDate
            );
            if (classItem) {
              setSelectedItem(classItem);
              setSelectedDate(classItem.date);
              setStep(3); // Skip to date/time selection
            }
          }
        }
      }
    }
  }, [coaches, classes, classItems]);

  useEffect(() => {
    const finalizeGuestFlow = async () => {
      const query = new URLSearchParams(window.location.search);
      if (!query.get('stripe_success')) {
        return;
      }
      let handled = false;
      const pending = localStorage.getItem('pendingGuestBooking');
      if (pending) {
        try {
          const payload = JSON.parse(pending);
          const entry: Omit<GuestBooking, 'id' | 'status' | 'createdAt'> = {
            serviceType: payload.type === 'CLASS' ? 'CLASS' : 'PRIVATE',
            referenceId: payload.referenceId,
            title: payload.title,
            date: payload.date,
            participantName: payload.participantName,
            contactName: payload.contactName,
            contactEmail: payload.contactEmail,
            contactPhone: payload.contactPhone,
            paymentMethod: payload.paymentMethod,
            billingFrequency: payload.billingFrequency,
          };
          addGuestBooking(entry);
          setSuccessMessage(
            `Thanks ${payload.contactName}! Your booking for ${payload.title} on ${formatDate(new Date(payload.date))} is confirmed.`,
          );
          handled = true;
        } catch (error) {
          console.error('Failed to finalize guest booking from localStorage', error);
        } finally {
          localStorage.removeItem('pendingGuestBooking');
        }
      }

      if (!handled) {
        const sessionId = query.get('session_id');
        if (sessionId) {
          const result = await finalizeStripeCheckoutSession(sessionId);
          if (result.success && result.session?.metadata) {
            try {
              const metadata = result.session.metadata;
              const guestPayload = metadata.guestBooking ? JSON.parse(metadata.guestBooking) : null;
              if (guestPayload) {
                const entry: Omit<GuestBooking, 'id' | 'status' | 'createdAt'> = {
                  serviceType: metadata.classId ? 'CLASS' : 'PRIVATE',
                  referenceId: metadata.classId || metadata.slotId || '',
                  title: metadata.className || metadata.slotTitle || 'Guest Booking',
                  date: metadata.sessionStart,
                  participantName: guestPayload.participantName || metadata.participantName,
                  contactName: guestPayload.contactName,
                  contactEmail: guestPayload.contactEmail,
                  contactPhone: guestPayload.contactPhone,
                  paymentMethod: guestPayload.paymentMethod,
                  billingFrequency: guestPayload.billingFrequency,
                };
                addGuestBooking(entry);
                if (entry.title && entry.date) {
                  setSuccessMessage(
                    `Thanks ${entry.contactName}! Your booking for ${entry.title} on ${formatDate(new Date(entry.date))} is confirmed.`,
                  );
                } else {
                  setSuccessMessage('Thanks! Your booking and payment have been received.');
                }
                handled = true;
              }
            } catch (error) {
              console.error('Failed to parse guest booking metadata', error);
            }
          } else if (result.error) {
            console.error('Unable to finalize guest booking session:', result.error);
          }
        }
      }

      window.history.replaceState(null, '', '/book');
    };

    finalizeGuestFlow();
  }, [addGuestBooking]);

  const startCheckout = async () => {
    if (!selectedItem) return;
    setProcessing(true);
    
    const billingFrequency = paymentMethod === 'WEEKLY' ? 'WEEKLY' : 
                            paymentMethod === 'MONTHLY' ? 'MONTHLY' : 
                            paymentMethod === 'PER_SESSION' ? undefined : undefined;
    
    const guestPayload = {
      type: selectedItem.type,
      referenceId: selectedItem.classId || selectedItem.slotId,
      title: selectedItem.title,
      date: selectedItem.date,
      participantName,
      contactName,
      contactEmail,
      contactPhone,
      paymentMethod,
      billingFrequency,
    };
    localStorage.setItem('pendingGuestBooking', JSON.stringify(guestPayload));

    // For generated slots from availability (no slotId), we need to pass the date/time info
    // The server will handle creating the slot if needed
    const result = await handleGuestCheckout({
      price: selectedItem.price,
      className: selectedItem.type === 'CLASS' ? selectedItem.title : undefined,
      classId: selectedItem.classId,
      slotTitle: selectedItem.type !== 'CLASS' ? selectedItem.title : undefined,
      slotId: selectedItem.slotId, // undefined for generated slots from availability
      coachId: selectedItem.coachId,
      sessionStart: selectedItem.date.toISOString(),
      guestBooking: {
        participantName,
        participantDob: participantDob || undefined,
        contactName,
        contactEmail,
        contactPhone,
      },
      paymentMethod,
      billingFrequency,
      successPath: '/book',
    });

    if (!result.success && result.error) {
      alert(result.error);
      localStorage.removeItem('pendingGuestBooking');
      setProcessing(false);
    }
  };

  const canAdvanceStep = () => {
    if (step === 1) return Boolean(selectedCoach);
    if (step === 2) return Boolean(selectedServiceType);
    if (step === 3) return Boolean(selectedItem);
    if (step === 4) return participantName.length > 1;
    if (step === 5) return contactName && contactEmail && contactPhone;
    if (step === 6) return Boolean(paymentMethod);
    return true;
  };

  const goNext = () => {
    if (!canAdvanceStep()) return;
    setStep(prev => Math.min(prev + 1, 7));
  };

  const goBack = () => {
    setStep(prev => {
      const newStep = Math.max(prev - 1, 1);
      // Reset dependent selections when going back
      if (newStep < 3) setSelectedItem(null);
      if (newStep < 2) setSelectedServiceType(null);
      return newStep;
    });
  };

  if (successMessage) {
    return (
      <div className="bg-brand-gray p-8 rounded-3xl shadow-xl text-white space-y-4">
        <h2 className="text-3xl font-bold">Booking Confirmed!</h2>
        <p>{successMessage}</p>
        <p className="text-sm text-gray-300">We've sent a confirmation email to your inbox. A coach will contact you if more information is needed.</p>
        <Button onClick={() => { setSuccessMessage(null); window.location.href = '/'; }}>Return Home</Button>
      </div>
    );
  }

  const totalSteps = 7;
  const stepLabels = [
    'Choose Coach',
    'Service Type',
    'Select Time',
    'Participant',
    'Contact Info',
    'Payment',
    'Confirm'
  ];

  return (
    <div className="bg-brand-gray p-6 rounded-3xl shadow-xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Book with Fleetwood Boxing Gym</h1>
        <p className="text-sm text-gray-300">Choose your coach, select a session, and complete your booking with flexible payment options.</p>
      </header>

      <div className="flex items-center gap-2 text-sm text-gray-400 overflow-x-auto pb-2">
        {stepLabels.map((label, idx) => {
          const stepNum = idx + 1;
          return (
            <div key={stepNum} className={`flex items-center gap-2 flex-shrink-0 ${stepNum === step ? 'text-white' : ''}`}>
              <span className={`w-8 h-8 flex items-center justify-center rounded-full border ${stepNum === step ? 'bg-brand-red border-brand-red text-white' : stepNum < step ? 'bg-green-600 border-green-600 text-white' : 'border-gray-500'}`}>
                {stepNum < step ? '✓' : stepNum}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </div>
          );
        })}
      </div>

      {/* Step 1: Choose Coach */}
      {step === 1 && (
        <div className="space-y-6 bg-black/20 rounded-3xl p-6">
          <h2 className="text-2xl font-semibold text-white">Choose Your Coach</h2>
          <p className="text-sm text-gray-400">Select a coach to view their availability</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coaches.map(coach => (
              <button
                key={coach.id}
                onClick={() => {
                  setSelectedCoach(coach);
                  setStep(2);
                }}
                className={`p-4 rounded-2xl border-2 transition ${
                  selectedCoach?.id === coach.id
                    ? 'border-brand-red bg-brand-red/20 text-white'
                    : 'border-gray-700 bg-black/30 text-gray-200 hover:border-brand-red/70'
                }`}
              >
                {coach.imageUrl && (
                  <img src={coach.imageUrl} alt={coach.name} className="w-16 h-16 rounded-full mx-auto mb-2 object-cover" />
                )}
                <h3 className="font-semibold text-lg">{coach.name}</h3>
                {coach.level && <p className="text-sm text-gray-400">{coach.level}</p>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Service Type */}
      {step === 2 && selectedCoach && (
        <div className="space-y-6 bg-black/20 rounded-3xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <button className="text-sm text-gray-400" onClick={() => { setSelectedCoach(null); setStep(1); }}>← Change Coach</button>
            <div>
              <h2 className="text-2xl font-semibold text-white">What would you like to book?</h2>
              <p className="text-sm text-gray-400">Coach: {selectedCoach.name}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                setSelectedServiceType('CLASS');
                setStep(3);
              }}
              className={`p-6 rounded-2xl border-2 transition ${
                selectedServiceType === 'CLASS'
                  ? 'border-brand-red bg-brand-red/20 text-white'
                  : 'border-gray-700 bg-black/30 text-gray-200 hover:border-brand-red/70'
              }`}
            >
              <div className="text-4xl mb-2">👥</div>
              <h3 className="font-semibold text-lg mb-1">Group Class</h3>
              <p className="text-sm text-gray-400">Join a scheduled class</p>
            </button>
            <button
              onClick={() => {
                setSelectedServiceType('PRIVATE');
                setStep(3);
              }}
              className={`p-6 rounded-2xl border-2 transition ${
                selectedServiceType === 'PRIVATE'
                  ? 'border-brand-red bg-brand-red/20 text-white'
                  : 'border-gray-700 bg-black/30 text-gray-200 hover:border-brand-red/70'
              }`}
            >
              <div className="text-4xl mb-2">👤</div>
              <h3 className="font-semibold text-lg mb-1">Private 1-on-1</h3>
              <p className="text-sm text-gray-400">One-to-one session</p>
            </button>
            <button
              onClick={() => {
                setSelectedServiceType('GROUP');
                setStep(3);
              }}
              className={`p-6 rounded-2xl border-2 transition ${
                selectedServiceType === 'GROUP'
                  ? 'border-brand-red bg-brand-red/20 text-white'
                  : 'border-gray-700 bg-black/30 text-gray-200 hover:border-brand-red/70'
              }`}
            >
              <div className="text-4xl mb-2">👨‍👩‍👧‍👦</div>
              <h3 className="font-semibold text-lg mb-1">Group Session</h3>
              <p className="text-sm text-gray-400">Small group training</p>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Select Time */}
      {step === 3 && selectedCoach && selectedServiceType && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <button className="text-sm text-gray-400" onClick={() => { setSelectedServiceType(null); setStep(2); }}>← Change Service</button>
            <div>
              <h2 className="text-2xl font-semibold text-white">Select Date & Time</h2>
              <p className="text-sm text-gray-400">{selectedCoach.name} · {selectedServiceType === 'CLASS' ? 'Group Class' : selectedServiceType === 'PRIVATE' ? 'Private 1-on-1' : 'Group Session'}</p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 bg-black/20 rounded-3xl p-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-sm text-gray-400">Select a date</p>
                  <h3 className="text-white text-xl font-semibold">{monthAnchor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const newMonth = new Date(monthAnchor);
                      newMonth.setMonth(newMonth.getMonth() - 1);
                      setMonthAnchor(newMonth);
                    }}
                    className="px-3 py-1 rounded-lg bg-black/30 text-white hover:bg-black/50"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setMonthAnchor(new Date())}
                    className="px-3 py-1 rounded-lg bg-black/30 text-white hover:bg-black/50 text-xs"
                    title="Go to current month"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      const newMonth = new Date(monthAnchor);
                      newMonth.setMonth(newMonth.getMonth() + 1);
                      setMonthAnchor(newMonth);
                    }}
                    className="px-3 py-1 rounded-lg bg-black/30 text-white hover:bg-black/50"
                  >
                    →
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2 text-sm text-gray-400 uppercase mb-2">
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(label => (
                  <span key={label} className="text-center">{label}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 0).getDate() }).map((_, index) => {
                  const date = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), index + 1);
                  const key = date.toDateString();
                  const hasSlots = Boolean(groupedByDay[key]);
                  const isPast = date < startOfToday;
                  const isToday = date.toDateString() === startOfToday.toDateString();
                  const isSelected = selectedDate && selectedDate.toDateString() === key;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        if (!isPast && hasSlots) {
                          setSelectedDate(date);
                        }
                      }}
                      className={`h-14 rounded-xl border relative ${
                        isSelected ? 'border-brand-red bg-brand-red/20 text-white' : 'border-gray-700 bg-black/30 text-gray-300'
                      } ${isPast || !hasSlots ? 'opacity-40 cursor-not-allowed' : 'hover:border-brand-red/70'} ${isToday ? 'ring-2 ring-brand-red/40' : ''}`}
                      disabled={!hasSlots || isPast}
                    >
                      <div className="text-base font-semibold">{index + 1}</div>
                      {hasSlots && <div className="text-[9px]">{groupedByDay[key].length}</div>}
                      {isToday && <span className="absolute top-0.5 right-0.5 text-[8px] text-brand-red font-semibold">Today</span>}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex-1 bg-black/20 rounded-3xl p-5 space-y-4">
              {selectedDate ? (
                <>
                  <div>
                    <p className="text-sm text-gray-400">Available times</p>
                    <h3 className="text-xl text-white font-semibold">{formatDate(selectedDate)}</h3>
                  </div>
                  <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2">
                    {(groupedByDay[selectedDate.toDateString()] || []).map(item => (
                      <button
                        key={item.id}
                        onClick={() => { setSelectedItem(item); setStep(4); }}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                          selectedItem?.id === item.id
                            ? 'border-brand-red bg-brand-red/20 text-white'
                            : 'border-gray-700 bg-black/30 text-gray-200 hover:border-brand-red/70'
                        }`}
                      >
                        <p className="text-base font-semibold">{formatTime(item.date)}</p>
                        <p className="text-sm">{item.title}</p>
                        <p className="text-xs text-gray-400">{item.subtitle} · £{item.price.toFixed(2)}</p>
                      </button>
                    ))}
                  </div>
                  {(groupedByDay[selectedDate.toDateString()] || []).length === 0 && (
                    <p className="text-gray-400">No slots for this date. Pick another day.</p>
                  )}
                </>
              ) : (
                <div className="text-gray-400 text-center mt-20">
                  <p>Please select a date to view times.</p>
                  {availableItems.length === 0 && (
                    <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg text-sm">
                      <p className="font-semibold text-yellow-300 mb-2">No available {selectedServiceType === 'CLASS' ? 'classes' : 'sessions'} found for {selectedCoach.name}.</p>
                      <p className="text-yellow-400">This could mean:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-yellow-400">
                        <li>No {selectedServiceType === 'CLASS' ? 'classes' : 'sessions'} have been created for this coach</li>
                        <li>All {selectedServiceType === 'CLASS' ? 'classes' : 'sessions'} are in a different month</li>
                        <li>Try selecting a different month using the arrows above</li>
                      </ul>
                      <p className="mt-2 text-xs text-yellow-500">Found {availableItems.length} total items for this month.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Participant Details */}
      {step === 4 && selectedItem && (
        <div className="flex flex-col lg:flex-row bg-black/20 rounded-3xl p-6 gap-6">
          <div className="flex-1 bg-brand-dark/40 rounded-2xl p-5 text-white space-y-2">
            <button className="text-sm text-gray-400" onClick={() => { setSelectedItem(null); setStep(3); }}>← Change time</button>
            <p className="text-gray-400 uppercase text-xs">Selected session</p>
            <h2 className="text-2xl font-semibold">{selectedItem.title}</h2>
            <p className="text-sm text-gray-300">{selectedItem.subtitle}</p>
            <p className="text-sm text-gray-300">{formatDate(selectedItem.date)} · {formatTime(selectedItem.date)}</p>
            <p className="text-lg font-bold text-brand-red mt-3">£{selectedItem.price.toFixed(2)}</p>
          </div>
          <div className="flex-1 space-y-4">
            <h3 className="text-white text-xl font-semibold">Enter participant details</h3>
            <Input label="Participant name" id="participant-name" value={participantName} onChange={(e) => setParticipantName(e.target.value)} />
            <Input label="Participant date of birth (optional)" id="participant-dob" type="date" value={participantDob} onChange={(e) => setParticipantDob(e.target.value)} />
            <div className="flex justify-between">
              <Button variant="secondary" onClick={goBack}>Back</Button>
              <Button onClick={goNext} disabled={!canAdvanceStep()}>Next</Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Contact Info */}
      {step === 5 && (
        <div className="space-y-4 bg-black/20 rounded-3xl p-6">
          <h2 className="text-xl font-semibold text-white">Your contact details</h2>
          <p className="text-sm text-gray-400">We'll send confirmations and reminders to this contact.</p>
          <Input label="Your name" id="contact-name" value={contactName} onChange={(e) => setContactName(e.target.value)} />
          <Input label="Email" id="contact-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          <Input label="Mobile number" id="contact-phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          <div className="flex justify-between">
            <Button variant="secondary" onClick={goBack}>Back</Button>
            <Button onClick={goNext} disabled={!canAdvanceStep()}>Next</Button>
          </div>
        </div>
      )}

      {/* Step 6: Payment Method */}
      {step === 6 && (
        <div className="space-y-4 bg-black/20 rounded-3xl p-6">
          <h2 className="text-xl font-semibold text-white">Choose Payment Method</h2>
          <p className="text-sm text-gray-400">Select how you'd like to pay for this booking</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setPaymentMethod('ONE_OFF')}
              className={`p-4 rounded-2xl border-2 transition text-left ${
                paymentMethod === 'ONE_OFF'
                  ? 'border-brand-red bg-brand-red/20 text-white'
                  : 'border-gray-700 bg-black/30 text-gray-200 hover:border-brand-red/70'
              }`}
            >
              <h3 className="font-semibold text-lg mb-1">Pay Now</h3>
              <p className="text-sm text-gray-400">One-off payment via Stripe</p>
            </button>
            <button
              onClick={() => setPaymentMethod('PER_SESSION')}
              className={`p-4 rounded-2xl border-2 transition text-left ${
                paymentMethod === 'PER_SESSION'
                  ? 'border-brand-red bg-brand-red/20 text-white'
                  : 'border-gray-700 bg-black/30 text-gray-200 hover:border-brand-red/70'
              }`}
            >
              <h3 className="font-semibold text-lg mb-1">Bill Per Session</h3>
              <p className="text-sm text-gray-400">Pay after each session</p>
            </button>
            <button
              onClick={() => setPaymentMethod('WEEKLY')}
              className={`p-4 rounded-2xl border-2 transition text-left ${
                paymentMethod === 'WEEKLY'
                  ? 'border-brand-red bg-brand-red/20 text-white'
                  : 'border-gray-700 bg-black/30 text-gray-200 hover:border-brand-red/70'
              }`}
            >
              <h3 className="font-semibold text-lg mb-1">Weekly Billing</h3>
              <p className="text-sm text-gray-400">Charged weekly for all sessions</p>
            </button>
            <button
              onClick={() => setPaymentMethod('MONTHLY')}
              className={`p-4 rounded-2xl border-2 transition text-left ${
                paymentMethod === 'MONTHLY'
                  ? 'border-brand-red bg-brand-red/20 text-white'
                  : 'border-gray-700 bg-black/30 text-gray-200 hover:border-brand-red/70'
              }`}
            >
              <h3 className="font-semibold text-lg mb-1">Monthly Billing</h3>
              <p className="text-sm text-gray-400">Monthly statement & invoice reminders</p>
            </button>
          </div>
          {paymentMethod === 'MONTHLY' && (
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 text-sm text-blue-200">
              <p className="font-semibold mb-1">Monthly billing includes:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-300">
                <li>Monthly statement emailed to {contactEmail || 'your email'}</li>
                <li>Invoice reminders before payment due date</li>
                <li>Automatic payment processing</li>
              </ul>
            </div>
          )}
          <div className="flex justify-between">
            <Button variant="secondary" onClick={goBack}>Back</Button>
            <Button onClick={goNext} disabled={!canAdvanceStep()}>Next</Button>
          </div>
        </div>
      )}

      {/* Step 7: Confirm & Pay */}
      {step === 7 && selectedItem && (
        <div className="space-y-4 bg-black/20 rounded-3xl p-6">
          <h2 className="text-xl font-semibold text-white">Confirm & Pay</h2>
          <div className="bg-brand-dark/40 rounded-2xl p-5 text-white space-y-2">
            <p className="text-sm text-gray-400 uppercase">Session</p>
            <p className="text-2xl font-semibold">{selectedItem.title}</p>
            <p className="text-sm text-gray-300">{selectedItem.subtitle}</p>
            <p className="text-sm text-gray-300">{formatDate(selectedItem.date)} · {formatTime(selectedItem.date)}</p>
            <p className="text-sm text-gray-300">Participant: {participantName}</p>
            <p className="text-sm text-gray-300">Contact: {contactEmail} · {contactPhone}</p>
            <p className="text-sm text-gray-300">Payment: {
              paymentMethod === 'ONE_OFF' ? 'Pay Now' :
              paymentMethod === 'PER_SESSION' ? 'Bill Per Session' :
              paymentMethod === 'WEEKLY' ? 'Weekly Billing' :
              'Monthly Billing'
            }</p>
            <p className="text-3xl font-bold text-brand-red mt-4">£{selectedItem.price.toFixed(2)}</p>
          </div>
          <div className="flex justify-between">
            <Button variant="secondary" onClick={goBack}>Back</Button>
            <Button onClick={startCheckout} disabled={isProcessing}>
              {isProcessing ? 'Processing…' : paymentMethod === 'ONE_OFF' ? 'Pay with Stripe' : 'Complete Booking'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingWizard;

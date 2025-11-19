import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { CoachSlot, SlotType, GuestBooking } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { handleGuestCheckout } from '../../services/stripeService';

interface BookableItem {
  id: string;
  type: 'CLASS' | 'PRIVATE';
  title: string;
  subtitle: string;
  date: Date;
  price: number;
  coachName?: string;
  classId?: string;
  slotId?: string;
}

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
  const { classes, coaches, coachSlots, guestBookings, addGuestBooking } = useData();
  const [selectedItem, setSelectedItem] = useState<BookableItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [serviceFilter, setServiceFilter] = useState<'ALL' | 'CLASS' | 'PRIVATE'>('ALL');
  const [coachFilter, setCoachFilter] = useState<string>('ALL');
  const [step, setStep] = useState(1);
  const [participantName, setParticipantName] = useState('');
  const [participantDob, setParticipantDob] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isProcessing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const monthAnchor = useMemo(() => new Date(), []);
  const startOfToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);

  const classItems = useMemo(() => {
    const occurrences: BookableItem[] = [];
    const monthStart = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1);
    const monthEnd = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 0);

    classes.forEach(cls => {
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
              classId: cls.id,
            });
          }
        }
        iterator.setDate(iterator.getDate() + 1);
      }
    });
    return occurrences;
  }, [classes, coaches, monthAnchor, startOfToday]);

  const slotItems = useMemo(() => {
    const now = new Date();
    return coachSlots
      .filter(slot => new Date(slot.start).getMonth() === monthAnchor.getMonth())
      .filter(slot => new Date(slot.start) >= now)
      .map(slot => {
        const coach = coaches.find(c => c.id === slot.coachId);
        return {
          id: `slot-${slot.id}`,
          type: 'PRIVATE',
          title: slot.title,
          subtitle: `${coach?.name ?? 'Coach'} · ${formatTime(new Date(slot.start))}`,
          date: new Date(slot.start),
          price: slot.price,
          coachName: coach?.name,
          slotId: slot.id,
        } as BookableItem;
      });
  }, [coachSlots, coaches, monthAnchor]);

  const combinedItems = useMemo(() => {
    return [...classItems, ...slotItems].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );
  }, [classItems, slotItems]);

  const filteredItems = useMemo(() => {
    return combinedItems.filter(item => {
      const serviceMatch =
        serviceFilter === 'ALL' ||
        (serviceFilter === 'CLASS' && item.type === 'CLASS') ||
        (serviceFilter === 'PRIVATE' && item.type === 'PRIVATE');
      const coachMatch = coachFilter === 'ALL' || item.coachName === coachFilter;
      return serviceMatch && coachMatch;
    });
  }, [combinedItems, serviceFilter, coachFilter]);

  const groupedByDay = useMemo(() => {
    const map: Record<string, BookableItem[]> = {};
    filteredItems.forEach(item => {
      const key = item.date.toDateString();
      map[key] = map[key] ? [...map[key], item] : [item];
    });
    return map;
  }, [filteredItems]);

  useEffect(() => {
    setSelectedDate(null);
    setSelectedItem(null);
  }, [serviceFilter, coachFilter]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('stripe_success')) {
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
          };
          addGuestBooking(entry);
          setSuccessMessage(`Thanks ${payload.contactName}! Your booking for ${payload.title} on ${formatDate(new Date(payload.date))} is confirmed.`);
        } catch (error) {
          console.error('Failed to finalize guest booking', error);
        } finally {
          localStorage.removeItem('pendingGuestBooking');
          window.history.replaceState(null, '', '/book');
        }
      }
    }
  }, [addGuestBooking]);

  const startCheckout = async () => {
    if (!selectedItem) return;
    setProcessing(true);
    const guestPayload = {
      type: selectedItem.type,
      referenceId: selectedItem.classId || selectedItem.slotId,
      title: selectedItem.title,
      date: selectedItem.date,
      participantName,
      contactName,
      contactEmail,
      contactPhone,
    };
    localStorage.setItem('pendingGuestBooking', JSON.stringify(guestPayload));

    const result = await handleGuestCheckout({
      price: selectedItem.price,
      className: selectedItem.type === 'CLASS' ? selectedItem.title : undefined,
      classId: selectedItem.classId,
      slotTitle: selectedItem.type === 'PRIVATE' ? selectedItem.title : undefined,
      slotId: selectedItem.slotId,
      guestBooking: {
        participantName,
        participantDob: participantDob || undefined,
        contactName,
        contactEmail,
        contactPhone,
      },
      successPath: '/book',
    });

    if (!result.success && result.error) {
      alert(result.error);
      localStorage.removeItem('pendingGuestBooking');
      setProcessing(false);
    }
  };

  const canAdvanceStep = () => {
    if (step === 1) return Boolean(selectedItem);
    if (step === 2) return participantName.length > 1;
    if (step === 3) return contactName && contactEmail && contactPhone;
    return true;
  };

  const goNext = () => {
    if (!canAdvanceStep()) return;
    setStep(prev => Math.min(prev + 1, 4));
  };

  const goBack = () => setStep(prev => Math.max(prev - 1, 1));

  if (successMessage) {
    return (
      <div className="bg-brand-gray p-8 rounded-3xl shadow-xl text-white space-y-4">
        <h2 className="text-3xl font-bold">Booking Confirmed!</h2>
        <p>{successMessage}</p>
        <p className="text-sm text-gray-300">We’ve sent a confirmation email to your inbox. A coach will contact you if more information is needed.</p>
        <Button onClick={() => { setSuccessMessage(null); window.location.href = '/'; }}>Return Home</Button>
      </div>
    );
  }

  return (
    <div className="bg-brand-gray p-6 rounded-3xl shadow-xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Book with Fleetwood Boxing Gym</h1>
        <p className="text-sm text-gray-300">Select a class or private session, tell us who is attending, then checkout securely via Stripe. No login required.</p>
      </header>

      <div className="flex items-center gap-3 text-sm text-gray-400">
        {[1, 2, 3, 4].map(number => (
          <div key={number} className={`flex items-center gap-2 ${number === step ? 'text-white' : ''}`}>
            <span className={`w-6 h-6 flex items-center justify-center rounded-full border ${number === step ? 'bg-brand-red border-brand-red text-white' : 'border-gray-500'}`}>{number}</span>
            <span>
              {number === 1 && 'Pick a session'}
              {number === 2 && 'Participant details'}
              {number === 3 && 'Your contact info'}
              {number === 4 && 'Confirm & pay'}
            </span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { key: 'ALL', label: 'All' },
                { key: 'CLASS', label: 'Classes' },
                { key: 'PRIVATE', label: 'Private sessions' },
              ].map(option => (
                <button
                  key={option.key}
                  onClick={() => setServiceFilter(option.key as 'ALL' | 'CLASS' | 'PRIVATE')}
                  className={`px-4 py-2 rounded-full border text-sm font-semibold ${
                    serviceFilter === option.key ? 'bg-brand-red text-white border-brand-red' : 'bg-black/30 border-gray-600 text-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="md:ml-auto flex items-center gap-2">
              <label htmlFor="coach-filter" className="text-sm text-gray-400">Coach</label>
              <select
                id="coach-filter"
                value={coachFilter}
                onChange={(e) => setCoachFilter(e.target.value)}
                className="bg-black/40 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="ALL">All coaches</option>
                {coaches.map(coach => (
                  <option key={coach.id} value={coach.name}>{coach.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 bg-black/20 rounded-3xl p-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-sm text-gray-400">Select a date</p>
                  <h2 className="text-white text-2xl font-semibold">{monthAnchor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-2 text-sm text-gray-400 uppercase">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(label => (
                <span key={label} className="text-center">{label}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2 mt-2">
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
                    className={`h-16 rounded-xl border relative ${
                      isSelected ? 'border-brand-red bg-brand-red/20 text-white' : 'border-gray-700 bg-black/30 text-gray-300'
                    } ${isPast || !hasSlots ? 'opacity-40 cursor-not-allowed' : 'hover:border-brand-red/70'} ${isToday ? 'ring-2 ring-brand-red/40' : ''}`}
                    disabled={!hasSlots || isPast}
                  >
                    <div className="text-lg font-semibold">{index + 1}</div>
                    {hasSlots && <div className="text-[10px]">{groupedByDay[key].length} slots</div>}
                    {isToday && <span className="absolute top-1 right-1 text-[9px] text-brand-red font-semibold">Today</span>}
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
                      onClick={() => { setSelectedItem(item); setStep(2); }}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${selectedItem?.id === item.id ? 'border-brand-red bg-brand-red/20 text-white' : 'border-gray-700 bg-black/30 text-gray-200 hover:border-brand-red/70'}`}
                    >
                      <p className="text-base font-semibold">{formatTime(item.date)}</p>
                      <p className="text-sm">{item.title} · {item.type === 'CLASS' ? 'Group Class' : 'Private Session'}</p>
                      <p className="text-xs text-gray-400">{item.subtitle} · £{item.price.toFixed(2)}</p>
                    </button>
                  ))}
                </div>
                {(groupedByDay[selectedDate.toDateString()] || []).length === 0 && (
                  <p className="text-gray-400">No slots for this date. Pick another day.</p>
                )}
              </>
            ) : (
              <div className="text-gray-400 text-center mt-20">Please select a date to view times.</div>
            )}
          </div>
          </div>
        </div>
      )}

      {step === 2 && selectedItem && (
        <div className="flex flex-col lg:flex-row bg-black/20 rounded-3xl p-6 gap-6">
          <div className="flex-1 bg-brand-dark/40 rounded-2xl p-5 text-white space-y-2">
            <button className="text-sm text-gray-400" onClick={goBack}>← Change session</button>
            <p className="text-gray-400 uppercase text-xs">Selected session</p>
            <h2 className="text-2xl font-semibold">{selectedItem.title}</h2>
            <p className="text-sm text-gray-300">{selectedItem.subtitle}</p>
            <p className="text-sm text-gray-300">{formatDate(selectedItem.date)} · {formatTime(selectedItem.date)}</p>
            <p className="text-sm text-gray-300">{selectedItem.type === 'CLASS' ? 'Group class' : 'Private session'}</p>
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

      {step === 3 && (
        <div className="space-y-4 bg-black/20 rounded-3xl p-6">
          <h2 className="text-xl font-semibold text-white">Your details</h2>
          <p className="text-sm text-gray-400">We’ll send confirmations and reminders to this contact.</p>
          <Input label="Your name" id="contact-name" value={contactName} onChange={(e) => setContactName(e.target.value)} />
          <Input label="Email" id="contact-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          <Input label="Mobile number" id="contact-phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          <div className="flex justify-between">
            <Button variant="secondary" onClick={goBack}>Back</Button>
            <Button onClick={goNext} disabled={!canAdvanceStep()}>Next</Button>
          </div>
        </div>
      )}

      {step === 4 && selectedItem && (
        <div className="space-y-4 bg-black/20 rounded-3xl p-6">
          <h2 className="text-xl font-semibold text-white">Confirm & Pay</h2>
          <div className="bg-brand-dark/40 rounded-2xl p-5 text-white space-y-1">
            <p className="text-sm text-gray-400 uppercase">Session</p>
            <p className="text-2xl font-semibold">{selectedItem.title}</p>
            <p className="text-sm text-gray-300">{selectedItem.subtitle}</p>
            <p className="text-sm text-gray-300">{formatDate(selectedItem.date)} · {formatTime(selectedItem.date)}</p>
            <p className="text-sm text-gray-300">Participant: {participantName}</p>
            <p className="text-sm text-gray-300">Contact: {contactEmail} · {contactPhone}</p>
            <p className="text-3xl font-bold text-brand-red mt-4">£{selectedItem.price.toFixed(2)}</p>
          </div>
          <div className="flex justify-between">
            <Button variant="secondary" onClick={goBack}>Back</Button>
            <Button onClick={startCheckout} disabled={isProcessing}>
              {isProcessing ? 'Redirecting…' : 'Pay with Stripe'}
            </Button>
          </div>
        </div>
      )}

      {guestBookings.length > 0 && (
        <div className="bg-black/20 rounded-2xl p-4">
          <h3 className="text-white font-semibold mb-2">Recent Guest Bookings (demo)</h3>
          <ul className="text-sm text-gray-300 space-y-1 max-h-40 overflow-y-auto">
            {guestBookings.map(entry => (
              <li key={entry.id} className="flex items-center justify-between">
                <span>
                  {entry.participantName} booked {entry.title} ({entry.serviceType}) for {formatDate(new Date(entry.date))}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${entry.status === 'CONFIRMED' ? 'bg-green-600' : entry.status === 'CANCELED' ? 'bg-gray-500' : 'bg-yellow-600 text-black'}`}>
                  {entry.status === 'PENDING' ? 'Pending' : entry.status === 'CONFIRMED' ? 'Confirmed' : 'Canceled'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BookingWizard;

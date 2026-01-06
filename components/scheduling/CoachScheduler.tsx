import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { CoachSlot, SlotType, UserRole } from '../../types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { handleCoachSlotCheckout } from '../../services/stripeService';

const formatTime = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDateKey = (date: Date) =>
  date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

const getWeekStart = (date: Date) => {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  copy.setDate(diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

enum ViewMode {
  WEEK = 'WEEK',
  LIST = 'LIST',
  MONTH = 'MONTH',
}

const CoachScheduler: React.FC = () => {
  const { currentUser } = useAuth();
  const { coaches, coachSlots, coachAppointments } = useData();

  const member = currentUser && currentUser.role === UserRole.MEMBER ? currentUser : null;
  const [search, setSearch] = useState('');
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(coaches[0]?.id ?? null);
  const [activeSlot, setActiveSlot] = useState<CoachSlot | null>(null);
  const [participantName, setParticipantName] = useState(member?.name ?? '');
  const [isSubmitting, setSubmitting] = useState(false);
  const [weekAnchor, setWeekAnchor] = useState(getWeekStart(new Date()));
  const [monthAnchor, setMonthAnchor] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.WEEK);

  const filteredCoaches = useMemo(() => {
    // Filter out Lex Hewitt from booking interface
    const bookableCoaches = coaches.filter(coach => coach.email !== 'lexhewitt@gmail.com');
    if (!search) return bookableCoaches;
    return bookableCoaches.filter(coach =>
      coach.name.toLowerCase().includes(search.toLowerCase()) ||
      coach.level.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search, coaches]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(weekAnchor);
      date.setDate(weekAnchor.getDate() + index);
      return date;
    });
  }, [weekAnchor]);

  const slotsByDay = useMemo(() => {
    const now = new Date();
    const result: Record<string, { slot: CoachSlot; remaining: number }[]> = {};

    coachSlots
      .filter(slot => new Date(slot.start) >= now)
      .filter(slot => !selectedCoachId || slot.coachId === selectedCoachId)
      .forEach(slot => {
        const start = new Date(slot.start);
        const dayKey = start.toDateString();
        if (start >= weekDays[0] && start <= weekDays[6]) {
          const confirmed = coachAppointments.filter(appt => appt.slotId === slot.id && appt.status === 'CONFIRMED').length;
          const remaining = slot.capacity - confirmed;
          if (remaining > 0) {
            result[dayKey] = result[dayKey] || [];
            result[dayKey].push({ slot, remaining });
          }
        }
      });

    Object.values(result).forEach(list =>
      list.sort((a, b) => new Date(a.slot.start).getTime() - new Date(b.slot.start).getTime()),
    );

    return result;
  }, [coachSlots, coachAppointments, selectedCoachId, weekDays]);

  const handleBookSlot = async () => {
    if (!member || !activeSlot) return;
    setSubmitting(true);
    try {
      const slotCoach = coaches.find(c => c.id === activeSlot.coachId);
      const pendingSlot = {
        slotId: activeSlot.id,
        memberId: member.id,
        participantName,
        summary: {
          type: activeSlot.type === SlotType.PRIVATE ? 'PRIVATE' : 'GROUP',
          title: activeSlot.title,
          schedule: new Date(activeSlot.start).toLocaleString(),
          coachName: slotCoach?.name,
          participantName,
          price: activeSlot.price,
        },
      };
      localStorage.setItem('pendingSlot', JSON.stringify(pendingSlot));
      const result = await handleCoachSlotCheckout(activeSlot, member.id, participantName, {
        onSessionCreated: (sessionId) => {
          pendingSlot.stripeSessionId = sessionId;
          localStorage.setItem('pendingSlot', JSON.stringify(pendingSlot));
        },
      });
      if (!result.success && result.error) {
        localStorage.removeItem('pendingSlot');
        alert(result.error);
      }
    } finally {
      setSubmitting(false);
      setActiveSlot(null);
    }
  };

  if (!member) {
    return (
      <div className="bg-brand-gray p-6 rounded-lg">
        <h3 className="text-xl mb-2 text-white font-semibold">Private Sessions</h3>
        <p className="text-gray-400">Log in as a member to browse and book one-to-one or small group sessions.</p>
      </div>
    );
  }

  return (
    <div className="bg-brand-gray p-6 rounded-lg space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold text-white">Private & Small Group Sessions</h3>
          <p className="text-sm text-gray-400">Calendly-style scheduling with real-time availability.</p>
        </div>
        <Input
          label="Search coaches"
          id="coach-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or specialty"
        />
      </div>

      <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
        {filteredCoaches.map(coach => (
          <button
            key={coach.id}
            onClick={() => setSelectedCoachId(coach.id)}
            className={`px-4 py-2 rounded-full border text-sm whitespace-nowrap ${
              selectedCoachId === coach.id ? 'bg-brand-red text-white border-brand-red' : 'border-gray-600 text-gray-300'
            }`}
          >
            {coach.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {viewMode === ViewMode.MONTH ? (
          <>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setMonthAnchor(new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() - 1, 1))}>
                ← Previous
              </Button>
              <Button variant="secondary" onClick={() => setMonthAnchor(new Date())}>
                Today
              </Button>
              <Button variant="secondary" onClick={() => setMonthAnchor(new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 1))}>
                Next →
              </Button>
            </div>
            <p className="text-white font-semibold text-center md:text-right">
              {monthAnchor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setWeekAnchor(getWeekStart(new Date(weekAnchor.getTime() - 7 * 24 * 60 * 60 * 1000)))}>
                ← Previous
              </Button>
              <Button variant="secondary" onClick={() => setWeekAnchor(getWeekStart(new Date()))}>
                Today
              </Button>
              <Button variant="secondary" onClick={() => setWeekAnchor(getWeekStart(new Date(weekAnchor.getTime() + 7 * 24 * 60 * 60 * 1000)))}>
                Next →
              </Button>
            </div>
            <p className="text-white font-semibold text-center md:text-right">
              {formatDateKey(weekDays[0])} – {formatDateKey(weekDays[6])}
            </p>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.values(ViewMode).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-3 py-1 rounded-full text-xs font-semibold ${viewMode === mode ? 'bg-brand-red text-white' : 'bg-black/40 text-gray-300'}`}
          >
            {mode === ViewMode.WEEK ? 'Weekly Grid' : mode === ViewMode.LIST ? 'List View' : 'Monthly Summary'}
          </button>
        ))}
      </div>

      {viewMode === ViewMode.WEEK && (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-2 min-w-[900px]">
            {weekDays.map(day => {
              const dayKey = day.toDateString();
              const entries = slotsByDay[dayKey] ?? [];
              return (
                <div key={dayKey} className="bg-black/30 border border-gray-700 rounded-xl p-3 flex flex-col gap-2 min-h-[220px]">
                  <div>
                    <p className="text-xs text-gray-400 uppercase">{day.toLocaleDateString(undefined, { weekday: 'short' })}</p>
                    <p className="text-white font-semibold text-lg">{day.getDate()}</p>
                  </div>
                  <div className="flex flex-col gap-2 mt-2">
                    {entries.length === 0 && (
                      <p className="text-xs text-gray-500">No availability</p>
                    )}
                    {entries.map(({ slot, remaining }) => (
                      <button
                        key={slot.id}
                        onClick={() => {
                          setActiveSlot(slot);
                          setParticipantName(member.name);
                        }}
                        className="bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 text-left transition text-sm text-white"
                      >
                        <p className="font-semibold text-base">
                          {formatTime(slot.start)}
                        </p>
                        <p className="text-xs text-gray-300 capitalize">
                          {slot.type === SlotType.PRIVATE ? '1:1 coaching' : 'Group session'} · £{slot.price.toFixed(2)}
                        </p>
                        <p className="text-[11px] text-brand-red font-semibold">{remaining} spot{remaining > 1 ? 's' : ''} left</p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === ViewMode.LIST && (
        <div className="space-y-3">
          {Object.entries(slotsByDay).length === 0 && (
            <p className="text-gray-400">No availability this week. Try another coach or date.</p>
          )}
          {Object.entries(slotsByDay).map(([dayKey, entries]) => (
            <div key={dayKey} className="bg-black/30 border border-gray-700 rounded-lg p-3 space-y-2">
              <h4 className="text-white font-semibold">{formatDateKey(new Date(dayKey))}</h4>
              {entries.map(({ slot, remaining }) => (
                <div key={slot.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white/5 rounded-md p-3">
                  <div>
                    <p className="text-white font-semibold text-lg">{slot.title}</p>
                    <p className="text-sm text-gray-300">
                      {formatTime(slot.start)} – {formatTime(slot.end)} · {slot.type === SlotType.PRIVATE ? 'Private session' : 'Small group'} · £{slot.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-brand-red font-semibold">{remaining} spot{remaining > 1 ? 's' : ''} left</span>
                    <Button onClick={() => { setActiveSlot(slot); setParticipantName(member.name); }}>Book</Button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {viewMode === ViewMode.MONTH && (
        <div className="bg-black/30 border border-gray-700 rounded-2xl p-4">
          <div className="grid grid-cols-7 text-center text-xs text-gray-400 uppercase tracking-wide mb-2">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(label => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {buildMonthMatrix(new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1)).map((week, weekIdx) =>
              week.map(day => {
                const entries = coachSlots.filter(slot => {
                  const slotDate = new Date(slot.start);
                  return isSameDay(slotDate, day) && (!selectedCoachId || slot.coachId === selectedCoachId);
                });
                const isCurrentMonth = day.getMonth() === monthAnchor.getMonth();
                const isToday = isSameDay(day, new Date());
                return (
                  <div
                    key={`${weekIdx}-${day.toISOString()}`}
                    className={`min-h-[120px] rounded-xl border px-2 py-2 flex flex-col gap-2 transition ${
                      isCurrentMonth ? 'bg-white/5 border-gray-700' : 'bg-black/20 border-gray-800 opacity-50'
                    } ${isToday ? 'ring-2 ring-brand-red/60' : ''}`}
                  >
                    <div className="flex items-center justify-between text-xs text-white font-semibold">
                      <span>{day.getDate()}</span>
                      <span className="text-[10px] text-gray-400">{entries.length ? `${entries.length} slot${entries.length > 1 ? 's' : ''}` : '—'}</span>
                    </div>
                    <div className="flex flex-col gap-1 text-[11px] text-gray-400">
                      {entries.length === 0 && <span className="text-gray-600">No sessions</span>}
                      {entries.slice(0, 2).map(slot => (
                        <div key={slot.id} className="flex items-center justify-between bg-black/40 rounded-md px-1 py-0.5 text-white">
                          <span>{formatTime(slot.start)}</span>
                          <span>£{slot.price.toFixed(0)}</span>
                        </div>
                      ))}
                      {entries.length > 2 && (
                        <span className="text-center text-[10px] text-gray-500">+{entries.length - 2} more</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <Modal
        isOpen={Boolean(activeSlot)}
        onClose={() => setActiveSlot(null)}
        title={activeSlot ? `Confirm ${activeSlot.title}` : ''}
      >
        {activeSlot && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              {formatDateKey(new Date(activeSlot.start))} · {formatTime(activeSlot.start)} – {formatTime(activeSlot.end)}
            </p>
            <Input
              label="Participant Name"
              id="slot-participant"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
            />
            <Button onClick={handleBookSlot} disabled={isSubmitting}>
              {isSubmitting ? 'Redirecting…' : `Pay £${activeSlot.price.toFixed(2)}`}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CoachScheduler;
const buildMonthMatrix = (anchor: Date) => {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const firstDay = start.getDay();
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - ((firstDay + 6) % 7)); // align Monday

  const weeks = [];
  for (let week = 0; week < 6; week++) {
    const weekDays = [];
    for (let day = 0; day < 7; day++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + week * 7 + day);
      weekDays.push(date);
    }
    weeks.push(weekDays);
  }
  return weeks;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

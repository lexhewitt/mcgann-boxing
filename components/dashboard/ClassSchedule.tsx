import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import { UserRole, Member, FamilyMember } from '../../types';
import Modal from '../ui/Modal';
import { calculateAge } from '../../utils/helpers';
import { isCoachAvailable, getNextDateForDay, getNextClassDateTime } from '../../utils/time';
import { handleStripeCheckout } from '../../services/stripeService';


interface ClassScheduleProps {
  viewMode?: 'daily' | 'weekly' | 'monthly';
}

const ClassSchedule: React.FC<ClassScheduleProps> = ({ viewMode = 'weekly' }) => {
  const { classes, coaches, bookings, addBooking, familyMembers, coachAvailability, unavailableSlots } = useData();
  const { currentUser } = useAuth();
  const [showBookingModal, setShowBookingModal] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const classToBook = useMemo(() => 
    classes.find(c => c.id === showBookingModal), [classes, showBookingModal]);

  const allPossibleParticipants = useMemo(() => {
    if (!currentUser || currentUser.role !== UserRole.MEMBER) return [];
    const memberAsParticipant: (Member | FamilyMember)[] = [currentUser as Member];
    const memberFamily = familyMembers.filter(fm => fm.parentId === currentUser.id);
    return memberAsParticipant.concat(memberFamily);
  }, [currentUser, familyMembers]);


  const eligibleParticipants = useMemo(() => {
      if (!classToBook) return [];
      return allPossibleParticipants.filter(p => {
          const age = calculateAge(p.dob);
          const isAgeOk = (!classToBook.minAge || age >= classToBook.minAge) && 
                          (!classToBook.maxAge || age <= classToBook.maxAge);
          
          return isAgeOk;
      });
  }, [classToBook, allPossibleParticipants]);

  useEffect(() => {
    if (eligibleParticipants.length > 0) {
        setSelectedParticipant(eligibleParticipants[0].id);
    } else if (currentUser) {
        setSelectedParticipant(currentUser.id); // fallback
    }
  }, [showBookingModal, eligibleParticipants, currentUser]);

  
  const daysOfWeek: ('Monday'|'Tuesday'|'Wednesday'|'Thursday'|'Friday'|'Saturday'|'Sunday')[] =
    viewMode === 'daily'
      ? [new Date().toLocaleDateString(undefined, { weekday: 'long' }) as any]
      : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleBookClick = (classId: string) => {
      if (!currentUser || currentUser.role !== UserRole.MEMBER) {
          // Redirect visitors to booking wizard with class pre-selected
          const cls = classes.find(c => c.id === classId);
          if (cls) {
              window.location.href = `/book?coach=${cls.coachId}&class=${classId}`;
          } else {
              window.location.href = '/book';
          }
          return;
      }
      setShowBookingModal(classId);
  }

  const confirmBooking = async () => {
      if(currentUser && currentUser.role === UserRole.MEMBER && classToBook && !isProcessing){
        const participant = eligibleParticipants.find(p => p.id === selectedParticipant);
        if (!participant) {
            alert("Could not find participant.");
            return;
        }
        
        const existingBooking = bookings.find(b => b.participantId === selectedParticipant && b.classId === classToBook.id);
        if(existingBooking){
            alert("This participant is already booked in this class!");
            setShowBookingModal(null);
            return;
        }

        setIsProcessing(true);

        // Store the booking details in localStorage before redirecting to Stripe.
        // This allows us to retrieve and finalize the booking upon successful return.
        const coach = coaches.find(c => c.id === classToBook.coachId);
        const sessionDate = getNextClassDateTime(classToBook);
        const pendingBooking = {
            memberId: currentUser.id,
            participantId: selectedParticipant,
            classId: classToBook.id,
            sessionStart: sessionDate.toISOString(),
            summary: {
              type: 'CLASS',
              title: classToBook.name,
              schedule: `${classToBook.day} ${classToBook.time}`,
              coachName: coach?.name,
              participantName: participant.name,
              price: classToBook.price,
            },
        };
        localStorage.setItem('pendingBooking', JSON.stringify(pendingBooking));
        
        // Call the Stripe service, which will redirect the user.
        const paymentResult = await handleStripeCheckout(classToBook, participant, currentUser.id, {
          sessionStart: sessionDate.toISOString(),
          onSessionCreated: (sessionId) => {
            pendingBooking.stripeSessionId = sessionId;
            localStorage.setItem('pendingBooking', JSON.stringify(pendingBooking));
          },
        });

        // This part is only reached if there's an error BEFORE the redirect.
        if (paymentResult.error) {
            // If there was an error, clean up localStorage and show the message.
            localStorage.removeItem('pendingBooking');
            setIsProcessing(false);
            alert(`Booking failed: ${paymentResult.error}`);
        }
      }
  }

  const renderBookingModalContent = () => {
    if (!classToBook) return null;

    if (eligibleParticipants.length === 0) {
        let reason = "age restrictions.";
        return (
            <div className="text-center">
                <p className="text-gray-300 mb-6">Unfortunately, no one in your account is eligible for this class due to {reason}</p>
                <Button variant="secondary" onClick={() => setShowBookingModal(null)}>Close</Button>
            </div>
        )
    }

    const participantName = eligibleParticipants.find(p => p.id === selectedParticipant)?.name || '...';

    return (
        <div className="space-y-6">
            <div className="text-center">
                <p className="text-lg font-semibold text-white">Booking for: {participantName}</p>
                <p className="text-gray-400">You will be redirected to Stripe to complete your payment.</p>
            </div>

            {eligibleParticipants.length > 1 && (
                <div>
                    <label htmlFor="participant-select" className="block text-sm font-medium text-gray-300 mb-2">Change participant:</label>
                    <select 
                        id="participant-select"
                        value={selectedParticipant}
                        onChange={(e) => setSelectedParticipant(e.target.value)}
                        className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white"
                    >
                       {eligibleParticipants.map(p => (
                           <option key={p.id} value={p.id}>{p.name} (Age: {calculateAge(p.dob)})</option>
                       ))}
                    </select>
                </div>
            )}
            
            <div className="flex justify-center gap-4 pt-4 border-t border-gray-600">
                <Button variant="secondary" onClick={() => setShowBookingModal(null)} disabled={isProcessing}>Cancel</Button>
                <Button onClick={confirmBooking} disabled={isProcessing}>
                    {isProcessing ? 'Redirecting...' : `Pay with Stripe (£${classToBook.price.toFixed(2)})`}
                </Button>
            </div>
        </div>
    )
  }

  const filteredClasses = useMemo(() => {
    if (viewMode === 'daily') {
      const today = new Date();
      const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][today.getDay()];
      return classes.filter(c => c.day === dayName);
    }
    if (viewMode === 'monthly') {
      return classes;
    }
    return classes.filter(c => daysOfWeek.slice(0, 5).includes(c.day));
  }, [classes, viewMode]);

  return (
    <>
    <div className="bg-brand-gray p-6 rounded-lg space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-semibold text-white">Book a Class</h2>
          <p className="text-sm text-gray-400">Browse the studio timetable and reserve your spot.</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 min-w-[900px]">
          {daysOfWeek.map(day => (
            <div key={day} className="bg-black/30 rounded-2xl p-3 border border-gray-700 shadow-lg">
              <h3 className="font-semibold text-center text-white mb-3 uppercase tracking-wide">{day}</h3>
              <div className="space-y-3">
                {/* Show coach availability for this day */}
                {coachAvailability
                  .filter(av => {
                    // Hide Lex's availability from public view
                    const coach = coaches.find(c => c.id === av.coachId);
                    if (coach && coach.email === 'lexhewitt@gmail.com') return false;
                    return av.day === day;
                  })
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map(av => {
                    const coach = coaches.find(c => c.id === av.coachId);
                    return (
                      <div
                        key={`avail-${av.id}-${day}`}
                        className="bg-purple-400/20 border border-purple-400/40 p-3 rounded-xl"
                        title={`${coach?.name || 'Coach'} available: ${av.startTime} - ${av.endTime}`}
                      >
                        <p className="font-semibold text-purple-200 text-xs">Available</p>
                        <p className="text-purple-300/80 text-xs mt-1">{av.startTime} - {av.endTime}</p>
                        {coach && <p className="text-purple-300/70 text-[10px] mt-1">{coach.name}</p>}
                      </div>
                    );
                  })}
                {/* Show classes */}
                {filteredClasses
                  .filter(c => c.day === day)
                .sort((a,b) => a.time.localeCompare(b.time))
                .map(cls => {
                    const coach = coaches.find(c => c.id === cls.coachId);
                    const spotsTaken = bookings.filter(b => b.classId === cls.id).length;
                    const spotsLeft = cls.capacity - spotsTaken;
                    
                    const nextClassDate = getNextDateForDay(cls.day);
                    const availabilityCheck = isCoachAvailable({
                      coachId: cls.coachId,
                      day: cls.day,
                      time: cls.time,
                      allClasses: classes,
                      coachAvailability,
                      unavailableSlots,
                      checkDate: nextClassDate,
                      classIdToIgnore: cls.id,
                    });
                    const isBookable = spotsLeft > 0 && availabilityCheck.isAvailable;

                    return (
                        <div
                            key={cls.id}
                            className={`group bg-white/5 p-4 rounded-xl flex flex-col border border-gray-700/50 min-h-44 transition-all duration-200 ${
                              isBookable ? 'hover:border-brand-red/60 hover:bg-white/10 hover:-translate-y-1' : 'opacity-60'
                            }`}
                        >
                            <div className="flex-grow">
                                <p className="font-bold text-white text-sm">{cls.name}</p>
                                <p className="text-xs text-gray-300 mt-1">{cls.time}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {coach?.name} {cls.originalCoachId && <span className="text-yellow-400">(Cover)</span>}
                                </p>
                            </div>
                            <div className="mt-3 text-xs flex justify-between items-center">
                                {spotsLeft > 0 ? (
                                    <span className={`font-semibold ${spotsLeft <= 5 ? 'text-yellow-400' : 'text-green-400'}`}>{spotsLeft} spots left</span>
                                ) : (
                                    <span className="font-bold text-brand-red">Full</span>
                                )}
                                {!availabilityCheck.isAvailable && spotsLeft > 0 && (
                                    <span className="text-xs text-yellow-400" title={availabilityCheck.reason}>Coach unavailable</span>
                                )}
                            </div>
                            <Button
                              onClick={() => handleBookClick(cls.id)}
                              disabled={!isBookable}
                              className="w-full mt-3"
                              title={!availabilityCheck.isAvailable ? availabilityCheck.reason : spotsLeft <= 0 ? 'This class is full.' : `Book ${cls.name}`}
                            >
                              Book (£{cls.price.toFixed(2)})
                            </Button>
                        </div>
                    );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
     {showBookingModal && classToBook && (
        <Modal 
            isOpen={!!showBookingModal} 
            onClose={() => setShowBookingModal(null)} 
            title={`Confirm Booking: ${classToBook.name}`}
        >
            {renderBookingModalContent()}
        </Modal>
    )}
    </>
  );
};

export default ClassSchedule;

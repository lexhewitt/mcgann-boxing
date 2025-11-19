
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import Dashboard from './dashboard/Dashboard';
import LandingPage from './LandingPage';

interface ConfirmationSummary {
  title?: string;
  schedule?: string;
  coachName?: string;
  participantName?: string;
  price?: number;
  type?: 'CLASS' | 'PRIVATE';
}

interface PendingClassPayload {
  memberId: string;
  participantId: string;
  classId: string;
  sessionStart?: string;
  stripeSessionId?: string;
  summary?: ConfirmationSummary;
}

interface PendingSlotPayload {
  slotId: string;
  memberId: string;
  participantName: string;
  stripeSessionId?: string;
  summary?: ConfirmationSummary;
}

interface ConfirmationState {
  heading: string;
  message: string;
  summary?: ConfirmationSummary;
}

interface MainContentProps {
  onRegisterClick: () => void;
}

const MainContent: React.FC<MainContentProps> = ({ onRegisterClick }) => {
  const { currentUser } = useAuth();
  const { addBooking, bookCoachSlot, coachSlots, members } = useData();
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
  
  useEffect(() => {
    // This effect runs on page load and checks if the user has been redirected
    // back from a successful Stripe payment.
    const query = new URLSearchParams(window.location.search);

    if (query.get('stripe_success')) {
        if (!currentUser) {
            // Wait until user context is restored before finalizing bookings
            return;
        }
        const pendingBookingJSON = localStorage.getItem('pendingBooking');
        
        // Ensure there is a pending booking and a logged-in user to attribute it to.
        if (pendingBookingJSON) {
            try {
                const pendingBooking: PendingClassPayload = JSON.parse(pendingBookingJSON);
                
                // Security check: ensure the booking belongs to the current user.
                if (pendingBooking.memberId === currentUser.id) {
                    addBooking({
                        memberId: pendingBooking.memberId,
                        participantId: pendingBooking.participantId,
                        classId: pendingBooking.classId,
                        sessionStart: pendingBooking.sessionStart,
                        stripeSessionId: pendingBooking.stripeSessionId,
                        paid: true, // Payment was successful
                    }, currentUser);
                    setConfirmation({
                      heading: 'Thank you! Your class is reserved.',
                      message: 'Payment was received and your class booking has been added. Sean or your coach will confirm any remaining details shortly.',
                      summary: pendingBooking.summary ?? { type: 'CLASS' },
                    });
                }
            } catch (e) {
                console.error("Error processing pending booking from localStorage:", e);
                setConfirmation({
                  heading: 'Payment received – manual confirmation needed',
                  message: 'We logged your payment but could not auto-complete the booking. Sean has been notified and will confirm shortly.',
                });
            } finally {
                // Always remove the item from localStorage after processing.
                localStorage.removeItem('pendingBooking');
            }
        }

        const pendingSlotJSON = localStorage.getItem('pendingSlot');
        if (pendingSlotJSON) {
            try {
                const pendingSlot: PendingSlotPayload = JSON.parse(pendingSlotJSON);
                if (pendingSlot.memberId === currentUser.id) {
                    const slotExists = coachSlots.find(slot => slot.id === pendingSlot.slotId);
                    const memberRecord = members.find(m => m.id === pendingSlot.memberId);
                    if (!slotExists || !memberRecord) {
                        console.warn('Pending slot or member not found; clearing pending state.');
                        setConfirmation({
                          heading: 'Payment received – scheduling shortly',
                          message: 'We could not auto-schedule your private session because availability data was still loading. Sean will confirm your requested slot as soon as possible.',
                          summary: pendingSlot.summary ?? { type: 'PRIVATE' },
                        });
                        localStorage.removeItem('pendingSlot');
                        return;
                    }
                    bookCoachSlot(pendingSlot.slotId, memberRecord, pendingSlot.participantName || memberRecord.name, pendingSlot.stripeSessionId);
                    setConfirmation({
                      heading: 'Thanks! Your private session request is in.',
                      message: 'Payment was successful. Sean or your coach will send a confirmation message shortly.',
                      summary: pendingSlot.summary ?? { type: 'PRIVATE', participantName: pendingSlot.participantName },
                    });
                    localStorage.removeItem('pendingSlot');
                }
            } catch (error) {
                console.error('Error processing pending slot booking:', error);
                setConfirmation({
                  heading: 'Payment received – manual confirmation needed',
                  message: 'We were unable to auto-schedule this session, but Sean has been notified and will confirm manually.',
                });
                localStorage.removeItem('pendingSlot');
            }
        }
        
        // Clean up the URL to remove the query parameters.
        window.history.replaceState(null, '', window.location.pathname);
    }
  }, [currentUser, addBooking, bookCoachSlot, coachSlots, members]);


  return (
    <>
      {currentUser ? <Dashboard /> : <LandingPage onRegisterClick={onRegisterClick} />}
      {confirmation && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-brand-gray max-w-lg w-full rounded-2xl p-8 shadow-xl text-white space-y-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-brand-red">Booking received</p>
              <h2 className="text-2xl font-semibold">{confirmation.heading}</h2>
            </div>
            {confirmation.summary && (
              <div className="bg-black/30 rounded-xl p-4 space-y-2 text-sm text-gray-200">
                {confirmation.summary.title && <p className="text-lg font-semibold text-white">{confirmation.summary.title}</p>}
                {confirmation.summary.schedule && <p>{confirmation.summary.schedule}</p>}
                {confirmation.summary.coachName && <p>Coach: {confirmation.summary.coachName}</p>}
                {confirmation.summary.participantName && <p>Participant: {confirmation.summary.participantName}</p>}
                {typeof confirmation.summary.price === 'number' && <p>Payment: £{confirmation.summary.price.toFixed(2)}</p>}
              </div>
            )}
            <p className="text-gray-200">{confirmation.message}</p>
            <button
              onClick={() => setConfirmation(null)}
              className="w-full bg-brand-red text-white py-2 rounded-lg font-semibold hover:bg-brand-red/90 transition"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MainContent;

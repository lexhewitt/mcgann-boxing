
import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import Dashboard from './dashboard/Dashboard';
import LandingPage from './LandingPage';
import { AppUser } from '../types';

interface MainContentProps {
  onRegisterClick: () => void;
}

const MainContent: React.FC<MainContentProps> = ({ onRegisterClick }) => {
  const { currentUser } = useAuth();
  const { addBooking, bookCoachSlot, coachSlots } = useData();
  
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
                const pendingBooking = JSON.parse(pendingBookingJSON);
                
                // Security check: ensure the booking belongs to the current user.
                if (pendingBooking.memberId === currentUser.id) {
                    addBooking({
                        memberId: pendingBooking.memberId,
                        participantId: pendingBooking.participantId,
                        classId: pendingBooking.classId,
                        paid: true, // Payment was successful
                    }, currentUser);
                    alert('Payment successful! Your class has been booked.');
                }
            } catch (e) {
                console.error("Error processing pending booking from localStorage:", e);
                alert("There was an issue finalizing your booking. Please contact support.");
            } finally {
                // Always remove the item from localStorage after processing.
                localStorage.removeItem('pendingBooking');
            }
        }

        const pendingSlotJSON = localStorage.getItem('pendingSlot');
        if (pendingSlotJSON) {
            try {
                const pendingSlot = JSON.parse(pendingSlotJSON);
                if (pendingSlot.memberId === currentUser.id) {
                    const slotExists = coachSlots.find(slot => slot.id === pendingSlot.slotId);
                    if (slotExists) {
                        bookCoachSlot(pendingSlot.slotId, currentUser, pendingSlot.participantName || currentUser.name);
                        alert('Session confirmed! You will also receive a confirmation soon.');
                        localStorage.removeItem('pendingSlot');
                    } else {
                        console.warn('Pending slot not found; keeping record for retry.');
                        return; // keep query + storage until slots load
                    }
                }
            } catch (error) {
                console.error('Error processing pending slot booking:', error);
                alert('We were unable to finalize your session booking. Please contact support.');
                localStorage.removeItem('pendingSlot');
            }
        }
        
        // Clean up the URL to remove the query parameters.
        window.history.replaceState(null, '', window.location.pathname);
    }
  }, [currentUser, addBooking, bookCoachSlot, coachSlots]);


  return currentUser ? <Dashboard /> : <LandingPage onRegisterClick={onRegisterClick} />;
};

export default MainContent;

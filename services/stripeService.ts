import { CoachSlot, GymClass } from '../types';

// Define a type for the Stripe.js object that will be available on the window
// This is a simplified version of the actual type from @stripe/stripe-js
interface StripeJS {
  redirectToCheckout(options: {
    sessionId: string;
  }): Promise<{ error?: { message: string } }>;
}

// This holds the initialized Stripe object so we don't have to reload it every time.
let stripePromise: Promise<StripeJS | null>;

/**
 * Fetches the Stripe publishable key from our backend, then initializes and returns a Stripe object.
 */
const getStripe = (): Promise<StripeJS | null> => {
  if (!stripePromise) {
    stripePromise = fetch('/server-api/stripe-config')
      .then(res => {
        if (!res.ok) {
            throw new Error(`Failed to fetch Stripe config: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (!data.publishableKey) {
          throw new Error('Stripe publishable key not found in server config.');
        }
        // Use the global Stripe object from the script tag in index.html
        // The script at https://js.stripe.com/v3/ creates window.Stripe
        if ((window as any).Stripe) {
          return (window as any).Stripe(data.publishableKey) as StripeJS;
        } else {
          // This case might happen if the script hasn't loaded yet.
          // In a real-world app, you might want a more robust way to wait for the script.
          throw new Error("Stripe.js has not loaded.");
        }
      })
      .catch(error => {
          console.error("Error initializing Stripe:", error.message);
          return null; // Return null if initialization fails
      });
  }
  return stripePromise;
};

/**
 * Handles the full Stripe checkout flow.
 * 1. Initializes Stripe.
 * 2. Creates a checkout session on the backend.
 * 3. Redirects the user to the secure Stripe Checkout page.
 *
 * @param gymClass The class being booked.
 * @param participant The person who the booking is for.
 * @param memberId The ID of the account holder making the payment.
 * @returns An object indicating success or failure. Failure is typically a client-side issue,
 * as a successful call redirects the page.
 */
export const handleStripeCheckout = async (
  gymClass: GymClass, 
  participant: {id: string, name: string}, 
  memberId: string,
  options?: { onSessionCreated?: (sessionId: string) => void }
): Promise<{ success: boolean; error?: string }> => {
  const stripe = await getStripe();

  if (!stripe) {
    return { success: false, error: 'Stripe could not be initialized. Please check the server configuration and network connection.' };
  }

  try {
    // Create a checkout session on our backend server
    const response = await fetch('/server-api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        className: gymClass.name,
        classId: gymClass.id,
        price: gymClass.price,
        participantId: participant.id,
        memberId: memberId,
      }),
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error || 'Failed to create checkout session.');
    }

    const session = await response.json();
    options?.onSessionCreated?.(session.id);

    // Redirect the user to the Stripe-hosted checkout page
    const result = await stripe.redirectToCheckout({
      sessionId: session.id,
    });

    if (result.error) {
      // This error is displayed if the redirect fails (e.g., blocked by browser).
      console.error(result.error.message);
      return { success: false, error: result.error.message };
    }
    
    // This part is not normally reached, as the user is redirected away.
    return { success: true };

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred.' };
  }
};

interface GuestCheckoutPayload {
  price: number;
  className?: string;
  classId?: string;
  slotTitle?: string;
  slotId?: string;
  guestBooking: {
    participantName: string;
    participantDob?: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
  };
  successPath?: string;
}

export const handleGuestCheckout = async (payload: GuestCheckoutPayload) => {
  const stripe = await getStripe();
  if (!stripe) {
    return { success: false, error: 'Stripe could not be initialized. Please check the server configuration and network connection.' };
  }

  try {
    const response = await fetch('/server-api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        price: payload.price,
        className: payload.className,
        classId: payload.classId,
        slotTitle: payload.slotTitle,
        slotId: payload.slotId,
        guestBooking: payload.guestBooking,
        successPath: payload.successPath || '/book',
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.error || 'Failed to create payment session.');
    }

    const session = await response.json();
    const result = await stripe.redirectToCheckout({ sessionId: session.id });
    if (result.error) {
      console.error(result.error.message);
      return { success: false, error: result.error.message };
    }
    return { success: true };
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred.' };
  }
};

export const handleCoachSlotCheckout = async (
  slot: CoachSlot,
  memberId: string,
  participantName: string,
  options?: { onSessionCreated?: (sessionId: string) => void }
): Promise<{ success: boolean; error?: string }> => {
  const stripe = await getStripe();

  if (!stripe) {
    return { success: false, error: 'Stripe could not be initialized. Please check the server configuration and network connection.' };
  }

  try {
    const response = await fetch('/server-api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        slotId: slot.id,
        slotTitle: slot.title,
        price: slot.price,
        memberId,
        participantName,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.error || 'Failed to create checkout session.');
    }

    const session = await response.json();
    options?.onSessionCreated?.(session.id);

    const result = await stripe.redirectToCheckout({
      sessionId: session.id,
    });

    if (result.error) {
      console.error(result.error.message);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred.' };
  }
};

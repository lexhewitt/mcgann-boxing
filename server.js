// IMPORTANT: For this to work in your Google Cloud Run environment,
// you must configure your service to start this server.
// The typical command would be `npm install && npm start`.
// This requires setting the "Container command" or "Entrypoint" in your Cloud Run revision configuration.

const express = require('express');
const Stripe = require('stripe');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Create a dedicated router for API endpoints.
// This is a robust way to ensure API routes are handled separately from static files.
const apiRouter = express.Router();


// --- API Route Definitions ---

// GET /server-api/stripe-config
apiRouter.get('/stripe-config', (req, res) => {
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    console.error('Stripe publishable key is not set in environment variables.');
    return res.status(500).json({ error: 'Server configuration error.' });
  }
  res.json({ publishableKey });
});

// POST /server-api/create-checkout-session
// We add the express.json() middleware here specifically for this route
apiRouter.post('/create-checkout-session', express.json(), async (req, res) => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error('Stripe secret key is not set in environment variables.');
    return res.status(500).json({ error: 'Server configuration error.' });
  }
  const stripe = new Stripe(secretKey);
  
  try {
    const { className, classId, price, participantId, memberId, slotId, slotTitle, participantName, guestBooking, successPath } = req.body;

    if (price === undefined || (!memberId && !guestBooking)) {
      return res.status(400).json({ error: 'Missing required session parameters.' });
    }

    const priceInPence = Math.round(price * 100);
    
    const host = req.get('host');
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const derivedBase = `${protocol}://${host}`;
    const baseUrl = process.env.FRONTEND_URL || derivedBase.replace(':8080', ':3000');
    const redirectPath = successPath || '';

    const displayName = className || slotTitle || 'Fleetwood Boxing Session';
    const description = className ? 'Fleetwood Boxing Gym Class Booking' : 'Private/Group session booking';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: { 
            name: displayName,
            description,
           },
          unit_amount: priceInPence,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${baseUrl}${redirectPath}?stripe_success=true`,
      cancel_url: `${baseUrl}${redirectPath}`,
      metadata: { classId: classId || '', participantId: participantId || '', participantName: participantName || '', memberId: memberId || '', slotId: slotId || '', guestBooking: guestBooking ? JSON.stringify(guestBooking) : '' },
    });

    res.status(200).json({ id: session.id });
  } catch (err) {
    console.error('Error creating Stripe session:', err.message);
    res.status(500).json({ error: 'Failed to create payment session.' });
  }
});

apiRouter.post('/refund-session', express.json(), async (req, res) => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: 'Stripe secret key is not configured.' });
  }
  const stripe = new Stripe(secretKey);
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'Missing sessionId.' });
  }
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session.payment_intent) {
      return res.status(400).json({ error: 'Payment intent not found for this session.' });
    }
    await stripe.refunds.create({
      payment_intent: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent.id,
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error issuing Stripe refund:', error.message);
    res.status(500).json({ error: error.message || 'Failed to issue refund.' });
  }
});


// --- Middleware & Route Registration ---

// IMPORTANT: Mount the API router BEFORE the static file middleware.
// This ensures that any request to /server-api/... is handled by the API router first.
app.use('/server-api', apiRouter);

// Serve static files from the production build directory
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// The "catchall" handler: for any request that doesn't match an API route or a static file,
// send back the main index.html file. This is crucial for client-side routing in a SPA.
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});


app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

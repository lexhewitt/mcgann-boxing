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
    const { className, classId, price, participantId, memberId } = req.body;

    if (!className || !classId || price === undefined || !participantId || !memberId) {
      return res.status(400).json({ error: 'Missing required session parameters.' });
    }

    const priceInPence = Math.round(price * 100);
    
    // Construct base URL correctly, even when behind a proxy like on Cloud Run
    const host = req.get('host');
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const baseUrl = `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: { 
            name: className,
            description: 'Fleetwood Boxing Gym Class Booking',
           },
          unit_amount: priceInPence,
        },
        quantity: 1,
      }],
      mode: 'payment',
      // The frontend looks for this query parameter to finalize the booking
      success_url: `${baseUrl}?stripe_success=true`,
      cancel_url: baseUrl,
      metadata: { classId, participantId, memberId },
    });

    res.status(200).json({ id: session.id });
  } catch (err) {
    console.error('Error creating Stripe session:', err.message);
    res.status(500).json({ error: 'Failed to create payment session.' });
  }
});


// --- Middleware & Route Registration ---

// IMPORTANT: Mount the API router BEFORE the static file middleware.
// This ensures that any request to /server-api/... is handled by the API router first.
app.use('/server-api', apiRouter);

// Serve static files (like index.html, css, etc.) from the root directory.
app.use(express.static(path.join(__dirname)));

// The "catchall" handler: for any request that doesn't match an API route or a static file,
// send back the main index.html file. This is crucial for client-side routing in a SPA.
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'index.html'));
});


app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

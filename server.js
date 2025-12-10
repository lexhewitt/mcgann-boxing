// IMPORTANT: For this to work in your Google Cloud Run environment,
// you must configure your service to start this server.
// The typical command would be `npm install && npm start`.
// This requires setting the "Container command" or "Entrypoint" in your Cloud Run revision configuration.

const express = require('express');
const Stripe = require('stripe');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 8080;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
let supabaseAdmin = null;

if (!stripeSecretKey) {
  console.warn('⚠️  STRIPE_SECRET_KEY is not set. Payment features will not work.');
}
if (!stripeWebhookSecret) {
  console.warn('⚠️  STRIPE_WEBHOOK_SECRET is not set. Webhook verification will be disabled.');
}

app.get('/env.js', (req, res) => {
  const runtimeEnv = {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || '',
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || '',
  };
  res.type('application/javascript');
  res.send(`window.__ENV__ = ${JSON.stringify(runtimeEnv)};`);
});
// Create a dedicated router for API endpoints.
// This is a robust way to ensure API routes are handled separately from static files.
const apiRouter = express.Router();

const bootstrapTables = async () => {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error('Supabase admin client not configured.');
  }

  const [
    coachesRes,
    membersRes,
    familyRes,
    classesRes,
    bookingsRes,
    slotsRes,
    apptsRes,
    txRes,
    guestRes,
  ] = await Promise.all([
    supabase.from('coaches').select('*'),
    supabase.from('members').select('*'),
    supabase.from('family_members').select('*'),
    supabase.from('classes').select('*'),
    supabase.from('bookings').select('*'),
    supabase.from('coach_slots').select('*'),
    supabase.from('coach_appointments').select('*'),
    supabase.from('transactions').select('*'),
    supabase.from('guest_bookings').select('*'),
  ]);

  const ensureOk = (res, name) => {
    if (res.error) {
      throw new Error(`Supabase: ${name} query failed - ${res.error.message}`);
    }
    return res.data || [];
  };

  const mapBookings = (rows) =>
    rows.map((b) => ({
      id: b.id,
      memberId: b.member_id,
      participantId: b.participant_id || b.participant_family_id || b.member_id,
      classId: b.class_id,
      bookingDate: b.booking_date,
      paid: b.paid,
      attended: b.attended,
      confirmationStatus: b.confirmation_status,
      sessionStart: b.session_start,
    }));

  const mapSlots = (rows) =>
    rows.map((row) => ({
      id: row.id,
      coachId: row.coach_id,
      type: row.type,
      title: row.title,
      description: row.description,
      start: row.start,
      end: row.end,
      capacity: row.capacity,
      price: Number(row.price),
      location: row.location,
    }));

  const mapAppointments = (rows) =>
    rows.map((row) => ({
      id: row.id,
      slotId: row.slot_id,
      memberId: row.member_id,
      participantName: row.participant_name,
      status: row.status,
      createdAt: row.created_at,
    }));

  const mapTransactions = (rows) =>
    rows.map((row) => ({
      id: row.id,
      memberId: row.member_id,
      coachId: row.coach_id,
      bookingId: row.booking_id,
      slotId: row.slot_id,
      amount: Number(row.amount),
      currency: row.currency,
      source: row.source,
      status: row.status,
      description: row.description,
      stripeSessionId: row.stripe_session_id,
      createdAt: row.created_at,
      settledAt: row.settled_at,
      confirmationStatus: row.confirmation_status,
    }));

  const mapGuestBookings = (rows) =>
    rows.map((row) => ({
      id: row.id,
      serviceType: row.service_type,
      referenceId: row.reference_id,
      title: row.title,
      date: row.date,
      participantName: row.participant_name,
      contactName: row.contact_name,
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone,
      status: row.status,
      createdAt: row.created_at,
    }));

  const mapCoaches = (rows) =>
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      level: row.level,
      bio: row.bio,
      imageUrl: row.image_url,
      mobileNumber: row.mobile_number,
      bankDetails: row.bank_details,
      whatsappAutoReplyEnabled: row.whatsapp_auto_reply_enabled ?? true,
      whatsappAutoReplyMessage: row.whatsapp_auto_reply_message || undefined,
    }));

  return {
    coaches: mapCoaches(ensureOk(coachesRes, 'coaches')),
    members: ensureOk(membersRes, 'members'),
    familyMembers: ensureOk(familyRes, 'family members'),
    classes: ensureOk(classesRes, 'classes'),
    bookings: mapBookings(ensureOk(bookingsRes, 'bookings')),
    coachSlots: mapSlots(ensureOk(slotsRes, 'coach slots')),
    coachAppointments: mapAppointments(ensureOk(apptsRes, 'coach appointments')),
    transactions: mapTransactions(ensureOk(txRes, 'transactions')),
    guestBookings: mapGuestBookings(ensureOk(guestRes, 'guest bookings')),
  };
};

apiRouter.get('/bootstrap-data', async (req, res) => {
  try {
    const data = await bootstrapTables();
    res.json(data);
  } catch (error) {
    console.error('Bootstrap data fetch failed', error.message);
    res.status(500).json({ error: 'Unable to load data from Supabase.' });
  }
});

const getSupabaseAdmin = () => {
  if (supabaseAdmin) return supabaseAdmin;
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.warn('Supabase service role key or URL is not configured; Stripe webhooks will be disabled.');
    return null;
  }
  supabaseAdmin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return supabaseAdmin;
};

const normalizeCurrency = (code) => (code ? code.toUpperCase() : 'GBP');
const nowIso = () => new Date().toISOString();

const upsertTransaction = async ({
  stripeSessionId,
  memberId,
  coachId,
  bookingId,
  slotId,
  amount,
  currency,
  source,
  description,
  confirmationStatus = 'PENDING',
  paymentMethod,
  billingFrequency,
  stripeCustomerId,
  stripeSubscriptionId,
}) => {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data: existing, error: existingError } = await supabase
    .from('transactions')
    .select('id')
    .eq('stripe_session_id', stripeSessionId)
    .maybeSingle();

  if (existingError) {
    console.error('Supabase: fetch transaction failed', existingError.message);
    return null;
  }

  const payload = {
    member_id: memberId || null,
    coach_id: coachId || null,
    booking_id: bookingId || null,
    slot_id: slotId || null,
    amount,
    currency: normalizeCurrency(currency),
    source,
    status: 'PAID',
    description,
    stripe_session_id: stripeSessionId,
    confirmation_status: confirmationStatus,
    settled_at: nowIso(),
    payment_method: paymentMethod || 'ONE_OFF',
    billing_frequency: billingFrequency || null,
    stripe_customer_id: stripeCustomerId || null,
    stripe_subscription_id: stripeSubscriptionId || null,
  };

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from('transactions')
      .update(payload)
      .eq('id', existing.id);
    if (updateError) {
      console.error('Supabase: update transaction failed', updateError.message);
    }
    return existing.id;
  }

  const id = `tx-${Date.now()}`;
  const { error: insertError } = await supabase.from('transactions').insert({
    id,
    created_at: nowIso(),
    ...payload,
  });
  if (insertError) {
    console.error('Supabase: insert transaction failed', insertError.message);
    return null;
  }
  return id;
};

const ensureBooking = async ({ bookingId, memberId, participantId, classId, sessionStart }) => {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const id = bookingId || `b${Date.now()}`;
  const { data: existing, error } = await supabase
    .from('bookings')
    .select('id')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    console.error('Supabase: fetch booking failed', error.message);
    return id;
  }
  if (existing?.id) return existing.id;
  const { error: insertError } = await supabase.from('bookings').insert({
    id,
    member_id: memberId || null,
    participant_id: participantId || memberId || null,
    class_id: classId || null,
    paid: true,
    attended: false,
    confirmation_status: 'PENDING',
    booking_date: nowIso(),
    session_start: sessionStart || null,
  });
  if (insertError) {
    console.error('Supabase: insert booking failed', insertError.message);
  }
  return id;
};

const ensureAppointment = async ({ slotId, memberId, participantName }) => {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const id = `appt-${Date.now()}`;
  const { error } = await supabase.from('coach_appointments').insert({
    id,
    slot_id: slotId || null,
    member_id: memberId || null,
    participant_name: participantName || '',
    status: 'CONFIRMED',
    created_at: nowIso(),
  });
  if (error) {
    console.error('Supabase: insert coach appointment failed', error.message);
  }
  return id;
};

const ensureGuestBooking = async ({ serviceType, referenceId, title, date, participantName, contactName, contactEmail, contactPhone, paymentMethod, billingFrequency, stripeCustomerId, stripeSubscriptionId, nextBillingDate }) => {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const id = `guest-${Date.now()}`;
  const { error } = await supabase.from('guest_bookings').insert({
    id,
    service_type: serviceType || null,
    reference_id: referenceId || null,
    title: title || null,
    date: date || null,
    participant_name: participantName || null,
    contact_name: contactName || null,
    contact_email: contactEmail || null,
    contact_phone: contactPhone || null,
    payment_method: paymentMethod || 'ONE_OFF',
    billing_frequency: billingFrequency || null,
    stripe_customer_id: stripeCustomerId || null,
    stripe_subscription_id: stripeSubscriptionId || null,
    next_billing_date: nextBillingDate || null,
    status: 'PENDING',
    created_at: nowIso(),
  });
  if (error) {
    console.error('Supabase: insert guest booking failed', error.message);
  }
  return id;
};

const handleCheckoutSessionCompleted = async (session) => {
  const metadata = session.metadata || {};
  const amount = session.amount_total ? session.amount_total / 100 : undefined;
  const currency = session.currency || 'GBP';
  const flowType = metadata.flowType || (metadata.slotId ? 'COACH_SLOT' : metadata.guestBooking ? 'GUEST' : 'CLASS');
  
  // Extract payment method and billing info
  const paymentMethod = metadata.paymentMethod || 'ONE_OFF';
  const billingFrequency = metadata.billingFrequency || null;
  
  // Extract subscription info if this is a subscription
  let stripeCustomerId = null;
  let stripeSubscriptionId = null;
  let nextBillingDate = null;
  
  if (session.mode === 'subscription' && session.subscription) {
    try {
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      stripeCustomerId = subscription.customer;
      stripeSubscriptionId = subscription.id;
      nextBillingDate = subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString().split('T')[0] : null;
    } catch (err) {
      console.error('Error retrieving subscription:', err.message);
    }
  } else if (session.customer) {
    stripeCustomerId = session.customer;
  }

  const basePayload = {
    stripeSessionId: session.id,
    memberId: metadata.memberId,
    coachId: metadata.coachId,
    amount,
    currency,
    description: metadata.slotTitle || metadata.className || metadata.slotId || metadata.classId,
    paymentMethod,
    billingFrequency,
    stripeCustomerId,
    stripeSubscriptionId,
  };

  if (flowType === 'CLASS') {
    const bookingId = await ensureBooking({
      bookingId: metadata.bookingId,
      memberId: metadata.memberId,
      participantId: metadata.participantId,
      classId: metadata.classId,
      sessionStart: metadata.sessionStart,
    });
    await upsertTransaction({
      ...basePayload,
      bookingId,
      source: 'CLASS',
      confirmationStatus: 'PENDING',
    });
    console.log(`[Stripe] Class booking recorded for class ${metadata.classId}, member ${metadata.memberId}, payment: ${paymentMethod}`);
    return;
  }

  if (flowType === 'COACH_SLOT') {
    const appointmentId = await ensureAppointment({
      slotId: metadata.slotId,
      memberId: metadata.memberId,
      participantName: metadata.participantName,
    });
    await upsertTransaction({
      ...basePayload,
      slotId: metadata.slotId,
      source: metadata.slotType === 'GROUP' ? 'GROUP_SESSION' : 'PRIVATE_SESSION',
      confirmationStatus: 'PENDING',
    });
    console.log(`[Stripe] Coach slot booked for slot ${metadata.slotId}, appointment ${appointmentId || 'n/a'}, payment: ${paymentMethod}`);
    return;
  }

  // Treat everything else as a guest purchase
  const guestBookingData = metadata.guestBooking ? JSON.parse(metadata.guestBooking) : {};
  await ensureGuestBooking({
    serviceType: metadata.classId ? 'CLASS' : 'PRIVATE',
    referenceId: metadata.classId || metadata.slotId,
    title: metadata.className || metadata.slotTitle || 'Guest Booking',
    date: metadata.sessionStart,
    participantName: metadata.participantName || guestBookingData.participantName,
    contactName: metadata.guestContactName || guestBookingData.contactName,
    contactEmail: metadata.guestContactEmail || guestBookingData.contactEmail,
    contactPhone: metadata.guestContactPhone || guestBookingData.contactPhone,
    paymentMethod,
    billingFrequency,
    stripeCustomerId,
    stripeSubscriptionId,
    nextBillingDate,
  });
  await upsertTransaction({
    ...basePayload,
    source: metadata.classId ? 'CLASS' : 'PRIVATE_SESSION',
    confirmationStatus: 'PENDING',
  });
  console.log(`[Stripe] Guest booking recorded for reference ${metadata.classId || metadata.slotId}, payment: ${paymentMethod}`);
};


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
  if (!stripe) {
    console.error('Stripe is not initialized. Check STRIPE_SECRET_KEY environment variable.');
    return res.status(500).json({ error: 'Payment system not configured.' });
  }
  
  try {
    const { className, classId, price, participantId, memberId, slotId, slotTitle, participantName, guestBooking, successPath, coachId, sessionStart, slotType, paymentMethod, billingFrequency } = req.body;

    if (price === undefined || (!memberId && !guestBooking)) {
      return res.status(400).json({ error: 'Missing required session parameters.' });
    }

    const priceInPence = Math.round(price * 100);
    
    const host = req.get('host');
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const derivedBase = `${protocol}://${host}`;
    const baseUrl = process.env.FRONTEND_URL || derivedBase.replace(':8080', ':3000');
    const redirectPath = successPath ?? '';
    const normalizedPath = redirectPath.startsWith('/') || redirectPath === '' ? redirectPath : `/${redirectPath}`;
    const separator = normalizedPath.includes('?') ? '&' : '?';
    const successUrl = `${baseUrl}${normalizedPath}${separator}stripe_success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}${normalizedPath}${separator}stripe_canceled=true`;

    const displayName = className || slotTitle || 'Fleetwood Boxing Session';
    const description = className ? 'Fleetwood Boxing Gym Class Booking' : 'Private/Group session booking';
    const flowType = slotId ? 'COACH_SLOT' : guestBooking ? 'GUEST' : 'CLASS';
    
    // Determine if this is a recurring payment
    const isRecurring = paymentMethod === 'WEEKLY' || paymentMethod === 'MONTHLY';
    const isPerSession = paymentMethod === 'PER_SESSION';
    
    const metadata = {
      flowType,
      classId: classId || '',
      className: className || '',
      slotId: slotId || '',
      slotTitle: slotTitle || '',
      slotType: slotType || '',
      coachId: coachId || '',
      memberId: memberId || '',
      participantId: participantId || '',
      participantName: participantName || guestBooking?.participantName || '',
      sessionStart: sessionStart || '',
      guestContactName: guestBooking?.contactName || '',
      guestContactEmail: guestBooking?.contactEmail || '',
      guestContactPhone: guestBooking?.contactPhone || '',
      guestBooking: guestBooking ? JSON.stringify(guestBooking) : '',
      paymentMethod: paymentMethod || 'ONE_OFF',
      billingFrequency: billingFrequency || '',
    };

    // For PER_SESSION billing, create booking without payment
    if (isPerSession) {
      // Create a "pending" session that doesn't require payment
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: { 
              name: displayName,
              description: `${description} - Bill per session`,
             },
            unit_amount: 0, // No charge upfront
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          ...metadata,
          paymentMethod: 'PER_SESSION',
          skipPayment: 'true',
        },
      });
      return res.status(200).json({ id: session.id });
    }

    // For recurring payments, create a subscription
    if (isRecurring) {
      const interval = billingFrequency === 'WEEKLY' ? 'week' : 'month';
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: { 
              name: displayName,
              description: `${description} - ${billingFrequency} billing`,
             },
            unit_amount: priceInPence,
            recurring: {
              interval: interval,
            },
          },
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
      });
      return res.status(200).json({ id: session.id });
    }

    // For ONE_OFF, create a one-time payment
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
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    });

    res.status(200).json({ id: session.id });
  } catch (err) {
    console.error('Error creating Stripe session:', err.message);
    res.status(500).json({ error: 'Failed to create payment session.' });
  }
});

apiRouter.post('/finalize-checkout-session', express.json(), async (req, res) => {
  if (!stripe) {
    console.error('Stripe is not initialized. Cannot finalize checkout session.');
    return res.status(500).json({ error: 'Payment system not configured.' });
  }
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'Missing sessionId.' });
  }
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Checkout session not found.' });
    }
    try {
      await handleCheckoutSessionCompleted(session);
    } catch (processingError) {
      console.error('Error ensuring checkout session completion:', processingError.message);
    }
    return res.json({
      success: true,
      session: {
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
        metadata: session.metadata,
      },
    });
  } catch (error) {
    console.error('Failed to finalize checkout session:', error.message);
    return res.status(500).json({ error: error.message || 'Unable to finalize checkout session.' });
  }
});

// POST /server-api/send-monthly-statement
apiRouter.post('/send-monthly-statement', express.json(), async (req, res) => {
  const { sendMonthlyStatement } = require('./services/emailService');
  try {
    const result = await sendMonthlyStatement(req.body);
    if (result.success) {
      return res.json({ success: true });
    } else {
      return res.status(500).json({ error: result.error || 'Failed to send statement' });
    }
  } catch (error) {
    console.error('Error sending monthly statement:', error.message);
    return res.status(500).json({ error: error.message || 'Failed to send statement' });
  }
});

// POST /server-api/send-invoice-reminder
apiRouter.post('/send-invoice-reminder', express.json(), async (req, res) => {
  const { sendInvoiceReminder } = require('./services/emailService');
  try {
    const result = await sendInvoiceReminder(req.body);
    if (result.success) {
      return res.json({ success: true });
    } else {
      return res.status(500).json({ error: result.error || 'Failed to send reminder' });
    }
  } catch (error) {
    console.error('Error sending invoice reminder:', error.message);
    return res.status(500).json({ error: error.message || 'Failed to send reminder' });
  }
});

// POST /server-api/generate-monthly-statements
// This endpoint can be called by a cron job to generate and send monthly statements
apiRouter.post('/generate-monthly-statements', express.json(), async (req, res) => {
  const { sendMonthlyStatement } = require('./services/emailService');
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  try {
    // Get the current month's start and end dates
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Find all customers with monthly billing
    const { data: monthlyCustomers, error: customerError } = await supabase
      .from('guest_bookings')
      .select('contact_email, contact_name, stripe_customer_id')
      .eq('payment_method', 'MONTHLY')
      .not('contact_email', 'is', null);
    
    if (customerError) {
      console.error('Error fetching monthly customers:', customerError);
      return res.status(500).json({ error: 'Failed to fetch customers' });
    }

    // Get unique customers
    const uniqueCustomers = Array.from(
      new Map(monthlyCustomers.map(c => [c.contact_email, c])).values()
    );

    const results = [];
    
    for (const customer of uniqueCustomers) {
      // Get all transactions for this customer in the current month
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('id, description, amount, source, created_at')
        .eq('stripe_customer_id', customer.stripe_customer_id)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString())
        .order('created_at', { ascending: true });
      
      if (txError) {
        console.error(`Error fetching transactions for ${customer.contact_email}:`, txError);
        continue;
      }

      if (!transactions || transactions.length === 0) {
        continue; // Skip customers with no transactions this month
      }

      const totalAmount = transactions.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
      
      const statementData = {
        contactEmail: customer.contact_email,
        contactName: customer.contact_name || 'Customer',
        statementPeriodStart: monthStart.toISOString().split('T')[0],
        statementPeriodEnd: monthEnd.toISOString().split('T')[0],
        totalAmount,
        currency: 'GBP',
        lineItems: transactions.map(tx => ({
          description: tx.description || 'Service',
          amount: parseFloat(tx.amount) || 0,
          serviceType: tx.source,
          serviceDate: tx.created_at ? tx.created_at.split('T')[0] : undefined,
        })),
      };

      const result = await sendMonthlyStatement(statementData);
      results.push({
        email: customer.contact_email,
        success: result.success,
        error: result.error,
      });
    }

    return res.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error('Error generating monthly statements:', error.message);
    return res.status(500).json({ error: error.message || 'Failed to generate statements' });
  }
});

// POST /server-api/refund-session
apiRouter.post('/refund-session', express.json(), async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: 'Payment system not configured.' });
  }
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

// Stripe Webhook endpoint
apiRouter.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !stripeWebhookSecret) {
    console.error('Stripe webhook is not configured. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET.');
    return res.status(500).send('Webhook not configured.');
  }

  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, stripeWebhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    try {
      await handleCheckoutSessionCompleted(event.data.object);
    } catch (error) {
      console.error('Error handling checkout session completion:', error.message);
      return res.status(500).send('Failed to process event.');
    }
  }

  res.json({ received: true });
});

// WhatsApp API endpoint for sending messages from frontend
apiRouter.post('/send-whatsapp', express.json(), async (req, res) => {
  const { to, message } = req.body;
  
  if (!to || !message) {
    return res.status(400).json({ error: 'Missing "to" or "message" parameter' });
  }

  const { sendWhatsAppMessage } = require('./services/whatsappService');
  const result = await sendWhatsAppMessage(to, message, { isWithin24HourWindow: true });
  
  if (result.success) {
    return res.json({ success: true, messageId: result.messageId });
  } else {
    return res.status(500).json({ error: result.error });
  }
});

// WhatsApp Webhook endpoint (Meta Cloud API)
// GET request: Webhook verification
apiRouter.get('/whatsapp-webhook', (req, res) => {
  // Meta sends query params with 'hub.' prefix
  const mode = req.query['hub.mode'] || req.query.mode;
  const token = req.query['hub.verify_token'] || req.query.token;
  const challenge = req.query['hub.challenge'] || req.query.challenge;
  
  const { handleWebhookVerification } = require('./services/whatsappService');
  const result = handleWebhookVerification(mode, token, challenge);
  
  if (result.verified) {
    return res.status(200).send(challenge);
  }
  
  return res.status(403).send('Forbidden');
});

// POST request: Incoming messages
// Use raw body parser to get unparsed body for signature verification
apiRouter.post('/whatsapp-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  // Verify webhook signature (must use raw body)
  const signature = req.headers['x-hub-signature-256'];
  const rawBody = req.body; // Already a Buffer from express.raw()
  
  // Parse JSON after verification
  let body;
  try {
    body = JSON.parse(rawBody.toString());
  } catch (error) {
    console.error('[WhatsApp] Failed to parse webhook body:', error);
    return res.status(400).send('Invalid JSON');
  }
  
  const { 
    verifyWebhookSignature, 
    extractMessageFromWebhook,
    isAvailabilityQuestion, 
    createAvailabilityAutoReply, 
    generateScheduleLink, 
    sendWhatsAppMessage,
    normalizePhoneNumber 
  } = require('./services/whatsappService');
  
  // Verify signature (skip in development if signature not provided)
  if (signature && !verifyWebhookSignature(rawBody, signature)) {
    console.error('[WhatsApp] Invalid webhook signature');
    return res.status(403).send('Invalid signature');
  }
  
  // Extract message from Meta webhook payload
  const messageData = extractMessageFromWebhook(body);
  
  if (!messageData) {
    // Not a text message or no message in payload (could be status update)
    return res.status(200).send('OK');
  }

  const { from, text, to } = messageData; // 'to' is the recipient (coach's number), 'from' is the sender (customer)
  
  console.log(`[WhatsApp] Incoming message from ${from} to ${to || 'unknown'}`);
  
  try {
    const getSupabaseAdmin = () => {
      if (supabaseAdmin) return supabaseAdmin;
      const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !serviceKey) {
        console.warn('Supabase service role key or URL is not configured.');
        return null;
      }
      supabaseAdmin = createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      return supabaseAdmin;
    };
    
    // Find coach by phone number (match the recipient number, not sender)
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.error('[WhatsApp] Supabase not configured');
      return res.status(500).send('Service not configured');
    }

    // Query coaches table to find matching phone number
    const { data: coaches, error } = await supabase
      .from('coaches')
      .select('id, name, mobile_number, whatsapp_auto_reply_enabled, whatsapp_auto_reply_message')
      .not('mobile_number', 'is', null);

    if (error) {
      console.error('[WhatsApp] Error fetching coaches:', error);
      return res.status(500).send('Database error');
    }

    // Normalize phone numbers for matching
    const normalizePhone = (phone) => {
      if (!phone) return null;
      const normalized = normalizePhoneNumber(phone);
      return normalized || phone.replace(/[^\d+]/g, '').replace(/^0/, '+44');
    };
    
    // Match the recipient number (to) with coach's mobile_number
    // This is the number the message was sent TO (Sean's number: 07482945828)
    const recipientNumber = messageData.to || messageData.displayPhoneNumber;
    const normalizedRecipient = normalizePhone(recipientNumber);
    
    console.log(`[WhatsApp] Message from ${from} to recipient: ${recipientNumber} (normalized: ${normalizedRecipient})`);
    console.log(`[WhatsApp] Looking for coach with number matching: ${normalizedRecipient || recipientNumber}`);
    
    const coach = coaches?.find(c => {
      if (!c.mobile_number) return false;
      const normalizedCoachPhone = normalizePhone(c.mobile_number);
      const match = normalizedCoachPhone === normalizedRecipient || 
             (normalizedCoachPhone && normalizedRecipient && (
               normalizedCoachPhone.endsWith(normalizedRecipient.slice(-10)) ||
               normalizedRecipient.endsWith(normalizedCoachPhone.slice(-10))
             ));
      if (match) {
        console.log(`[WhatsApp] ✅ Found matching coach: ${c.name} (${c.mobile_number} -> ${normalizedCoachPhone})`);
      }
      return match;
    });
    
    if (!coach && recipientNumber) {
      console.log(`[WhatsApp] ⚠️ No coach found matching recipient number: ${recipientNumber}`);
      console.log(`[WhatsApp] Available coach numbers: ${coaches.map(c => c.mobile_number).join(', ')}`);
    }

    // Check if message is about availability
    if (!isAvailabilityQuestion(text)) {
      return res.status(200).send('OK'); // Not an availability question, no action
    }

    const baseUrl = process.env.FRONTEND_URL || req.protocol + '://' + req.get('host');
    
    if (!coach) {
      // Not a coach, but customer asking about general availability
      const scheduleLink = generateScheduleLink(undefined, baseUrl);
      const reply = createAvailabilityAutoReply('our coaches', scheduleLink);
      
      // Send message (within 24-hour window, so use free-form text)
      await sendWhatsAppMessage(from, reply, { isWithin24HourWindow: true });
      console.log(`[WhatsApp] Auto-replied to ${from} about general availability`);
      return res.status(200).send('OK');
    }

    // Check if auto-reply is enabled for this coach (default to true if not set)
    const autoReplyEnabled = coach.whatsapp_auto_reply_enabled !== false;
    
    if (!autoReplyEnabled) {
      console.log(`[WhatsApp] Auto-reply disabled for coach ${coach.name}, skipping auto-reply to ${from}`);
      return res.status(200).send('OK'); // Coach has disabled auto-replies
    }

    // This is a message TO a coach (someone asking about their availability)
    const scheduleLink = generateScheduleLink(coach.id, baseUrl);
    const customMessage = coach.whatsapp_auto_reply_message || null;
    const reply = createAvailabilityAutoReply(coach.name, scheduleLink, customMessage);
    
    // Send message (within 24-hour window, so use free-form text)
    await sendWhatsAppMessage(from, reply, { isWithin24HourWindow: true });
    console.log(`[WhatsApp] Auto-replied to ${from} about ${coach.name}'s availability${customMessage ? ' (custom message)' : ''}`);
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('[WhatsApp] Webhook error:', error);
    res.status(500).send('Internal server error');
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

# Testing Guide: Booking Wizard & Billing Features

## Pre-Deployment Checklist

### ✅ Database Schema
- [x] Run `supabase/add_billing_columns.sql` in Supabase SQL Editor
- [ ] Verify columns exist in `guest_bookings`, `bookings`, and `transactions` tables
- [ ] Verify `monthly_statements` and `statement_line_items` tables exist

### ✅ Code Changes
- [x] BookingWizard.tsx - Enhanced with coach selection and payment options
- [x] server.js - Updated to handle payment methods and billing frequencies
- [x] stripeService.ts - Updated to pass payment method info
- [x] emailService.js - Gmail SMTP configured
- [x] types.ts - Added billing-related types

### ⚠️ Not Yet Deployed
- [ ] Code changes committed to git
- [ ] Code changes pushed to repository
- [ ] Cloud Run service rebuilt and deployed

## Testing Steps

### 1. Test Database Schema

Run this in Supabase SQL Editor to verify:

```sql
-- Check guest_bookings columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'guest_bookings'
  AND column_name IN ('payment_method', 'billing_frequency', 'stripe_customer_id', 'stripe_subscription_id', 'next_billing_date')
ORDER BY column_name;

-- Check bookings columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'bookings'
  AND column_name IN ('payment_method', 'billing_frequency', 'stripe_customer_id', 'stripe_subscription_id', 'next_billing_date')
ORDER BY column_name;

-- Check transactions columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'transactions'
  AND column_name IN ('payment_method', 'billing_frequency', 'stripe_customer_id', 'stripe_subscription_id', 'invoice_sent_at', 'reminder_sent_at')
ORDER BY column_name;

-- Check if monthly_statements table exists
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'monthly_statements';
```

### 2. Test Booking Wizard Locally

1. **Start local dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to booking page:**
   - Go to `http://localhost:3000/book` (or your local URL)

3. **Test Flow:**
   - **Step 1**: Select a coach (should show coach avatars)
   - **Step 2**: Select service type (Class/Private/Group)
   - **Step 3**: Select date and time
   - **Step 4**: Enter participant details
   - **Step 5**: Enter contact information
   - **Step 6**: Select payment method:
     - **One-Off**: Should redirect to Stripe checkout
     - **Per Session**: Should create booking without payment
     - **Weekly**: Should create Stripe subscription
     - **Monthly**: Should create Stripe subscription

### 3. Test Payment Methods

#### One-Off Payment
1. Complete booking with "Pay Now"
2. Should redirect to Stripe checkout
3. Use test card: `4242 4242 4242 4242`
4. Verify booking is created in database
5. Check `guest_bookings` table has `payment_method = 'ONE_OFF'`

#### Per Session Billing
1. Complete booking with "Bill Per Session"
2. Should create booking without payment
3. Check `guest_bookings` table has `payment_method = 'PER_SESSION'`
4. Verify no Stripe session created

#### Weekly Billing
1. Complete booking with "Weekly Billing"
2. Should create Stripe subscription
3. Check `guest_bookings` table has:
   - `payment_method = 'WEEKLY'`
   - `billing_frequency = 'WEEKLY'`
   - `stripe_customer_id` populated
   - `stripe_subscription_id` populated

#### Monthly Billing
1. Complete booking with "Monthly Billing"
2. Should create Stripe subscription
3. Check `guest_bookings` table has:
   - `payment_method = 'MONTHLY'`
   - `billing_frequency = 'MONTHLY'`
   - `stripe_customer_id` populated
   - `stripe_subscription_id` populated

### 4. Test Email Service

#### Test Monthly Statement Email
```bash
curl -X POST http://localhost:3000/server-api/send-monthly-statement \
  -H "Content-Type: application/json" \
  -d '{
    "contactEmail": "your-test-email@gmail.com",
    "contactName": "Test User",
    "statementPeriodStart": "2024-12-01",
    "statementPeriodEnd": "2024-12-31",
    "totalAmount": 150.00,
    "currency": "GBP",
    "lineItems": [
      {
        "description": "Boxing Class",
        "amount": 50.00,
        "serviceDate": "2024-12-15"
      },
      {
        "description": "Private Session",
        "amount": 100.00,
        "serviceDate": "2024-12-20"
      }
    ]
  }'
```

Check your email inbox for the statement.

#### Test Invoice Reminder
```bash
curl -X POST http://localhost:3000/server-api/send-invoice-reminder \
  -H "Content-Type: application/json" \
  -d '{
    "contactEmail": "your-test-email@gmail.com",
    "contactName": "Test User",
    "amountDue": 150.00,
    "currency": "GBP",
    "dueDate": "2024-12-31"
  }'
```

### 5. Test Monthly Statement Generation

```bash
curl -X POST http://localhost:3000/server-api/generate-monthly-statements \
  -H "Content-Type: application/json"
```

This will:
- Find all customers with monthly billing
- Generate statements for the current month
- Send emails to each customer

## Production Testing

After deployment, test the same flows on production:

1. **Production URL**: `https://mcgann-boxing-2coodfhbmq-nw.a.run.app/book`
2. Test all payment methods
3. Verify emails are sent from production
4. Check Cloud Run logs for any errors

## Common Issues

### Booking Wizard Not Showing Coach Selection
- **Fix**: Clear browser cache, hard refresh (Cmd+Shift+R)
- **Check**: Verify `BookingWizard.tsx` is the new version

### Payment Method Not Saving
- **Fix**: Verify database columns exist (run SQL check above)
- **Check**: Check browser console for errors

### Emails Not Sending
- **Fix**: Verify Gmail credentials in Cloud Run
- **Check**: Check Cloud Run logs for email errors
- **Test**: Test email service directly via API

### Stripe Subscription Not Creating
- **Fix**: Verify Stripe keys are correct
- **Check**: Check Stripe dashboard for subscription attempts
- **Test**: Use Stripe test mode cards

## Database Verification Queries

```sql
-- Check recent bookings with payment methods
SELECT 
  id,
  contact_name,
  contact_email,
  payment_method,
  billing_frequency,
  stripe_customer_id,
  created_at
FROM guest_bookings
ORDER BY created_at DESC
LIMIT 10;

-- Check transactions with payment methods
SELECT 
  id,
  amount,
  payment_method,
  billing_frequency,
  stripe_customer_id,
  created_at
FROM transactions
ORDER BY created_at DESC
LIMIT 10;
```



# Booking Wizard Enhancements

## Overview

The booking wizard has been significantly enhanced to provide a better user experience with coach selection, flexible payment options, and automated billing.

## New Features

### 1. Coach Selection First
- Users now select their coach before viewing availability
- Shows coach avatars and information
- Filters all subsequent options by selected coach

### 2. Service Type Selection
- **Group Class**: Join a scheduled class
- **Private 1-on-1**: One-to-one session with the coach
- **Group Session**: Small group training session

### 3. Enhanced Availability View
- Calendar view showing available dates
- Time slots filtered by selected coach and service type
- Clear indication of available slots per day

### 4. Flexible Payment Options

#### One-Off Payment
- Pay immediately via Stripe
- Standard checkout flow

#### Bill Per Session
- No upfront payment required
- Payment processed after each session
- Ideal for occasional bookings

#### Weekly Billing
- Automatic weekly charges via Stripe subscription
- All sessions in the week are billed together
- Recurring payment setup

#### Monthly Billing
- Automatic monthly charges via Stripe subscription
- Monthly statement emails
- Invoice reminders before payment due date
- All sessions in the month are billed together

### 5. Monthly Statement Emails
- Automatically generated at month end
- Includes all transactions for the period
- Professional HTML email template
- Can be triggered manually via API

## Database Changes

New columns added to support billing:

### `guest_bookings` table
- `payment_method`: ONE_OFF, PER_SESSION, WEEKLY, MONTHLY
- `billing_frequency`: WEEKLY or MONTHLY (for recurring)
- `stripe_customer_id`: Stripe customer ID for recurring payments
- `stripe_subscription_id`: Stripe subscription ID
- `next_billing_date`: When next payment is due

### `bookings` table
- Same billing columns as `guest_bookings`

### `transactions` table
- `payment_method`: Payment method used
- `billing_frequency`: Billing frequency if recurring
- `stripe_customer_id`: Stripe customer ID
- `stripe_subscription_id`: Stripe subscription ID
- `invoice_sent_at`: When invoice was sent
- `reminder_sent_at`: When reminder was sent

### New Tables

#### `monthly_statements`
- Stores generated monthly statements
- Links to transactions and bookings
- Tracks sent status

#### `statement_line_items`
- Individual line items for each statement
- Links transactions to statements

## API Endpoints

### Generate Monthly Statements
```bash
POST /server-api/generate-monthly-statements
```
Generates and sends monthly statements for all customers with monthly billing.

### Send Monthly Statement
```bash
POST /server-api/send-monthly-statement
Body: {
  contactEmail: string,
  contactName: string,
  statementPeriodStart: string,
  statementPeriodEnd: string,
  totalAmount: number,
  currency: string,
  lineItems: Array<{...}>,
  stripeInvoiceId?: string
}
```

### Send Invoice Reminder
```bash
POST /server-api/send-invoice-reminder
Body: {
  contactEmail: string,
  contactName: string,
  amountDue: number,
  currency: string,
  dueDate: string,
  invoiceId?: string
}
```

## Setup Instructions

### 1. Update Database Schema
Run the SQL script to add new columns:
```sql
-- Run supabase/add_billing_columns.sql in Supabase SQL Editor
```

### 2. Configure Email Service
The email service is currently set up to log emails. To enable actual email sending:

1. Choose an email provider (SendGrid, AWS SES, etc.)
2. Update `services/emailService.js` with your provider's SDK
3. Add API keys to environment variables
4. Update the `sendMonthlyStatement` and `sendInvoiceReminder` functions

### 3. Set Up Monthly Statement Cron Job
To automatically send monthly statements:

**Option A: Cloud Scheduler (Google Cloud)**
```bash
gcloud scheduler jobs create http monthly-statements \
  --schedule="0 0 1 * *" \
  --uri="https://your-domain.com/server-api/generate-monthly-statements" \
  --http-method=POST \
  --headers="Authorization=Bearer YOUR_SECRET_TOKEN"
```

**Option B: Cron Job (Linux)**
```bash
# Add to crontab
0 0 1 * * curl -X POST https://your-domain.com/server-api/generate-monthly-statements
```

### 4. Test the Flow

1. **One-Off Payment**:
   - Select coach → Service type → Time → Participant → Contact → Payment (One-Off) → Confirm
   - Should redirect to Stripe checkout

2. **Per Session Billing**:
   - Complete booking with "Bill Per Session"
   - Booking created without payment
   - Payment can be processed later

3. **Weekly/Monthly Billing**:
   - Complete booking with "Weekly" or "Monthly"
   - Should create Stripe subscription
   - Customer charged automatically

## Stripe Configuration

### Required Stripe Features
- **Checkout Sessions**: For one-off payments
- **Subscriptions**: For weekly/monthly billing
- **Customers**: For recurring payment tracking

### Webhook Events to Handle
- `checkout.session.completed`: Booking confirmation
- `customer.subscription.created`: Subscription setup
- `invoice.payment_succeeded`: Recurring payment success
- `invoice.payment_failed`: Payment failure handling

## User Flow

### Guest Booking Flow
1. **Step 1**: Choose Coach
2. **Step 2**: Select Service Type (Class/Private/Group)
3. **Step 3**: Select Date & Time
4. **Step 4**: Enter Participant Details
5. **Step 5**: Enter Contact Information
6. **Step 6**: Choose Payment Method
7. **Step 7**: Confirm & Complete Booking

### Payment Processing
- **ONE_OFF**: Immediate Stripe checkout
- **PER_SESSION**: Booking created, payment deferred
- **WEEKLY**: Stripe subscription created, charged weekly
- **MONTHLY**: Stripe subscription created, charged monthly + statement emails

## Email Templates

Monthly statements include:
- Professional HTML template
- Statement period (start/end dates)
- Line items with descriptions and amounts
- Total amount due
- Payment instructions

Invoice reminders include:
- Amount due
- Due date
- Payment link
- Contact information

## Future Enhancements

1. **Payment History Dashboard**: View past statements and invoices
2. **Auto-Pay Setup**: Save payment methods for recurring billing
3. **Payment Reminders**: Automated reminders before due dates
4. **Invoice Downloads**: PDF generation for statements
5. **Payment Plans**: Custom payment plans for members

## Troubleshooting

### Monthly Statements Not Sending
- Check email service configuration
- Verify database has transactions for the period
- Check server logs for errors
- Ensure cron job is running

### Stripe Subscription Issues
- Verify Stripe webhook is configured
- Check subscription status in Stripe dashboard
- Review server logs for subscription creation errors

### Payment Method Not Saving
- Check database schema is updated
- Verify Stripe customer ID is being stored
- Review transaction records in database




# Gmail Email Setup Guide

This guide explains how to configure Gmail SMTP for sending monthly statements and invoice reminders.

## Prerequisites

- A Gmail account
- Two-factor authentication (2FA) enabled on your Gmail account
- Access to generate App Passwords

## Step 1: Enable 2FA on Gmail

1. Go to your [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **2-Step Verification**
3. Follow the prompts to enable 2FA (if not already enabled)

## Step 2: Generate Gmail App Password

1. Go to your [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **App passwords**
3. You may need to sign in again
4. Select **Mail** as the app
5. Select **Other (Custom name)** as the device
6. Enter "Fleetwood Boxing Gym" or any name you prefer
7. Click **Generate**
8. **Copy the 16-character password** (you won't see it again!)

The app password will look like: `abcd efgh ijkl mnop` (spaces don't matter)

## Step 3: Set Environment Variables

### For Local Development

Add to your `.env.local` file:

```env
# Gmail SMTP Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
```

**Important**: 
- Use your full Gmail address (e.g., `fleetwoodboxing@gmail.com`)
- Use the **App Password** (16 characters), NOT your regular Gmail password
- Remove any spaces from the app password

### For Production (Google Cloud Run)

Set the environment variables:

```bash
gcloud run services update mcgann-boxing \
  --region=europe-west2 \
  --update-env-vars="GMAIL_USER=your-email@gmail.com,GMAIL_APP_PASSWORD=your-16-character-app-password" \
  --quiet
```

**For Security**: Consider storing the app password as a secret instead:

```bash
# Create secret
echo -n "your-16-character-app-password" | gcloud secrets create gmail-app-password --data-file=-

# Update service to use secret
gcloud run services update mcgann-boxing \
  --region=europe-west2 \
  --update-env-vars="GMAIL_USER=your-email@gmail.com" \
  --set-secrets="GMAIL_APP_PASSWORD=gmail-app-password:latest" \
  --quiet
```

## Step 4: Install Dependencies

Make sure nodemailer is installed:

```bash
npm install
```

This will install `nodemailer` which is already added to `package.json`.

## Step 5: Test Email Sending

### Test via API

You can test the email service by calling the API endpoint:

```bash
curl -X POST https://your-domain.com/server-api/send-monthly-statement \
  -H "Content-Type: application/json" \
  -d '{
    "contactEmail": "test@example.com",
    "contactName": "Test User",
    "statementPeriodStart": "2024-01-01",
    "statementPeriodEnd": "2024-01-31",
    "totalAmount": 150.00,
    "currency": "GBP",
    "lineItems": [
      {
        "description": "Boxing Class",
        "amount": 50.00,
        "serviceDate": "2024-01-15"
      },
      {
        "description": "Private Session",
        "amount": 100.00,
        "serviceDate": "2024-01-20"
      }
    ]
  }'
```

### Check Server Logs

After sending, check your server logs for:
- `[Email] Monthly statement sent:` - Success
- `[Email] Failed to send monthly statement:` - Error

## Troubleshooting

### "Invalid login" or "Authentication failed"

- **Check**: Are you using the App Password (16 characters), not your regular Gmail password?
- **Check**: Is 2FA enabled on your Gmail account?
- **Check**: Did you remove spaces from the app password?

### "Less secure app access" error

- Gmail no longer supports "less secure apps"
- You **must** use an App Password with 2FA enabled
- Regular passwords won't work

### Emails going to spam

- Gmail may flag automated emails as spam initially
- Ask recipients to mark emails as "Not Spam"
- Consider using a custom domain email (e.g., `noreply@fleetwoodboxing.com`) instead of Gmail

### Rate Limits

Gmail has sending limits:
- **Free Gmail**: 500 emails per day
- **Google Workspace**: 2,000 emails per day

If you need to send more emails, consider:
- Upgrading to Google Workspace
- Using a dedicated email service (SendGrid, AWS SES, etc.)

### "Connection timeout" or "ECONNREFUSED"

- Check your firewall settings
- Ensure port 587 is not blocked
- Verify SMTP settings: `smtp.gmail.com:587`

## Email Templates

The service includes HTML email templates for:
- **Monthly Statements**: Professional statement with line items and total
- **Invoice Reminders**: Friendly reminder with amount due and due date

Both templates are mobile-responsive and include:
- Fleetwood Boxing Gym branding
- Clear formatting
- Professional styling

## Security Best Practices

1. **Never commit credentials to git**
   - Add `.env.local` to `.gitignore` (already done)
   - Use Cloud Run secrets for production

2. **Rotate App Passwords regularly**
   - Generate new app passwords periodically
   - Revoke old ones in Google Account settings

3. **Use separate Gmail account**
   - Consider creating a dedicated Gmail account for automated emails
   - Don't use your personal Gmail account

4. **Monitor email activity**
   - Check Google Account activity regularly
   - Set up alerts for suspicious activity

## Next Steps

1. Set up the environment variables
2. Test sending an email
3. Set up the monthly statement cron job (see `BOOKING_WIZARD_ENHANCEMENTS.md`)
4. Monitor email delivery

## Alternative: Custom Domain Email

If you have a custom domain, you can:
1. Set up email with your domain provider
2. Use SMTP settings from your provider
3. Update `emailService.js` with your provider's SMTP settings

This gives you:
- Professional email addresses (e.g., `noreply@fleetwoodboxing.com`)
- Better deliverability
- Higher sending limits


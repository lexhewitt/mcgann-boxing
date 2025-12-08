# Next Steps: Setting Up WhatsApp Meta Integration

## You're Here: Facebook Developers Website

From the page you're on, follow these steps:

### Step 1: Create Your App

1. **Click "My Apps"** (top right of the page)
2. **Click "Create App"** button
3. **Select App Type:**
   - Choose **"Business"** (not Consumer or Other)
   - Click **"Next"**
4. **Fill in App Details:**
   - **App Name**: `Fleetwood Boxing Gym` (or your preferred name)
   - **App Contact Email**: Your email address
   - **Business Account**: Select your business account (or create one if needed)
5. **Click "Create App"**

### Step 2: Add WhatsApp Product

1. In your new app dashboard, you'll see **"Add Products"** section
2. Find **"WhatsApp"** in the list
3. **Click "Set Up"** next to WhatsApp
4. You'll be redirected to WhatsApp configuration

### Step 3: Get Your Credentials

Once WhatsApp is set up, you need to collect these values:

#### A. App ID and App Secret
1. Go to **Settings** → **Basic** (left sidebar)
2. Copy **App ID** (you'll see it at the top)
3. Click **Show** next to **App Secret** and copy it
   - ⚠️ **Important**: Keep this secret secure!

#### B. Access Token
1. Go to **WhatsApp** → **API Setup** (left sidebar)
2. You'll see a **Temporary Access Token**
   - This works for testing but expires in 24 hours
   - For production, you'll need a System User token (we'll do this later)

#### C. Phone Number ID
1. Still in **WhatsApp** → **API Setup**
2. Look for **"Phone number ID"** (it's a long number like `123456789012345`)
   - ⚠️ **Important**: This is NOT your phone number - it's an ID!
   - Copy this value

#### D. Webhook Verify Token
1. Generate a secure random token:
   ```bash
   # In terminal, run:
   openssl rand -hex 32
   ```
2. Copy this token - you'll use it in the next step

### Step 4: Update Your Environment Variables

Open your `.env.local` file and add:

```env
# Meta WhatsApp Cloud API Configuration
META_APP_ID=paste_your_app_id_here
META_APP_SECRET=paste_your_app_secret_here
META_ACCESS_TOKEN=paste_your_temporary_access_token_here
WHATSAPP_PHONE_NUMBER_ID=paste_your_phone_number_id_here
META_WEBHOOK_VERIFY_TOKEN=paste_your_generated_token_here
META_API_VERSION=v21.0
FRONTEND_URL=http://localhost:3000
```

### Step 5: Test Locally with ngrok

1. **Install ngrok** (if not already installed):
   ```bash
   brew install ngrok
   ```

2. **Start your server**:
   ```bash
   npm run dev
   ```

3. **Start ngrok** (in a new terminal):
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL** from ngrok (looks like `https://abc123.ngrok.io`)

### Step 6: Configure Webhook in Meta Dashboard

1. Go back to Meta App Dashboard
2. Navigate to **WhatsApp** → **Configuration** → **Webhook**
3. Click **"Edit"** or **"Add Callback URL"**
4. Enter:
   - **Callback URL**: `https://your-ngrok-url.ngrok.io/server-api/whatsapp-webhook`
     - Replace `your-ngrok-url.ngrok.io` with your actual ngrok URL
   - **Verify Token**: Paste the token you generated in Step 3D
5. Click **"Verify and Save"**
   - ✅ If successful, you'll see "Verified" status
   - ❌ If it fails, check:
     - ngrok is running
     - Server is running
     - Verify token matches

6. **Subscribe to Webhook Fields:**
   - Check the box next to **"messages"**
   - Click **"Save"**

### Step 7: Test the Integration

#### Quick Test:
1. **Run the test script**:
   ```bash
   ./test-whatsapp.sh
   ```

2. **Send a test message** using Meta Graph API Explorer:
   - Go to https://developers.facebook.com/tools/explorer/
   - Select your app
   - Change method to **POST**
   - Endpoint: `/{your-phone-number-id}/messages`
   - Body:
     ```json
     {
       "messaging_product": "whatsapp",
       "to": "+447123456789",
       "type": "text",
       "text": {
         "body": "When are you available?"
       }
     }
     ```
   - Replace `+447123456789` with a test phone number
   - Click **Submit**

3. **Check your server logs** - you should see:
   ```
   [WhatsApp] Auto-replied to +447123456789 about Coach Name's availability
   ```

4. **Check WhatsApp** - you should receive an auto-reply with booking link

### Step 8: Create Message Template (For Production)

For messages outside 24-hour window, you need approved templates:

1. Go to **WhatsApp** → **Message Templates**
2. Click **"Create Template"**
3. Fill in:
   - **Name**: `availability_reply`
   - **Category**: `UTILITY`
   - **Language**: English
   - **Body**:
     ```
     Hi! Thanks for your message about {{1}}'s availability.

     📅 View our monthly schedule and book online:
     {{2}}

     You can:
     • Continue as a guest and book a class or private 1-on-1 session
     • Become a member for easier booking and member benefits

     Reply with "BOOK" if you need help, or click the link above to see all available times! 🥊
     ```
4. **Variables**:
   - `{{1}}` = Coach name
   - `{{2}}` = Booking link
5. Click **"Submit"** (approval takes 24-48 hours)

### Step 9: Set Up Production Access Token

The temporary token expires. For production:

1. Go to **Business Settings** → **Users** → **System Users**
2. Click **"Add"** → **"Create New System User"**
3. Enter name: `WhatsApp API User`
4. Click **"Create System User"**
5. Click **"Assign Assets"**
6. Select your app
7. Assign role: **"WhatsApp Administrator"**
8. Click **"Save Changes"**
9. Click **"Generate New Token"**
10. Select your app
11. Check permissions:
    - `whatsapp_business_messaging`
    - `whatsapp_business_management`
12. Click **"Generate Token"**
13. **Copy this token** - it doesn't expire!
14. Update `META_ACCESS_TOKEN` in your `.env.local`

### Step 10: Deploy to Production

When ready for production:

1. **Update Cloud Run environment variables**:
   ```bash
   gcloud run services update mcgann-boxing \
     --set-env-vars="META_APP_ID=your_app_id,META_ACCESS_TOKEN=your_system_user_token,WHATSAPP_PHONE_NUMBER_ID=your_phone_id,META_WEBHOOK_VERIFY_TOKEN=your_token,META_API_VERSION=v21.0,FRONTEND_URL=https://your-domain.com" \
     --set-secrets="META_APP_SECRET=meta-app-secret:latest" \
     --region=europe-west2
   ```

2. **Update webhook URL** in Meta dashboard to your production URL:
   - `https://your-domain.com/server-api/whatsapp-webhook`

3. **Test end-to-end** with real WhatsApp messages

## Quick Reference

### Where to Find Things in Meta Dashboard:

- **App ID & Secret**: Settings → Basic
- **Access Token**: WhatsApp → API Setup
- **Phone Number ID**: WhatsApp → API Setup
- **Webhook Config**: WhatsApp → Configuration → Webhook
- **Message Templates**: WhatsApp → Message Templates
- **System Users**: Business Settings → Users → System Users

### Important URLs:

- **Your App Dashboard**: https://developers.facebook.com/apps/
- **Graph API Explorer**: https://developers.facebook.com/tools/explorer/
- **Business Settings**: https://business.facebook.com/settings

## Need Help?

- Check `WHATSAPP_TESTING_GUIDE.md` for detailed testing
- Check `WHATSAPP_INTEGRATION_META.md` for full documentation
- Check `WHATSAPP_META_QUICK_REFERENCE.md` for code examples

## Current Status Checklist

- [ ] App created in Meta Dashboard
- [ ] WhatsApp product added
- [ ] Credentials collected (App ID, Secret, Token, Phone Number ID)
- [ ] Webhook verify token generated
- [ ] Environment variables updated in `.env.local`
- [ ] ngrok running
- [ ] Server running
- [ ] Webhook configured and verified
- [ ] Test message sent successfully
- [ ] Auto-reply working
- [ ] Message template created (for production)
- [ ] System User token generated (for production)


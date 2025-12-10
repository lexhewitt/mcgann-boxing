# Setup Permanent WhatsApp System User Access Token

## Why You Need This

The current access token you're using is a **User Access Token** which expires every few hours. For production, you need a **System User Access Token** which is long-lived and doesn't expire.

## Step-by-Step Guide

### Step 1: Access Business Settings

1. Go to [Meta Business Suite](https://business.facebook.com)
2. Click on your **Business Portfolio** (top-left dropdown)
3. Click the **Settings** (gear) icon
4. Navigate to **System Users** in the left sidebar

### Step 2: Create a System User

1. Click the **+Add** button
2. In the "Create system user" window:
   - Enter a name: `WhatsApp Auto-Reply System` (or any name you prefer)
   - Select **Admin** role (recommended for full access)
   - Click **Create**

### Step 3: Assign Assets to System User

1. Click on the newly created system user's name
2. Click **Assign assets** button
3. In the "Select assets and assign permissions" window:
   - Select your app (the one with ID `1407895190894006`)
   - Grant **Manage app** permission
   - Click **Assign assets**

4. **Wait a few minutes** for permissions to propagate
5. Reload the page to confirm the system user has **Full control** of your app

### Step 4: Generate the System Token

1. Still in the System User panel, click **Generate token** button
2. In the window that appears:
   - Select your app: `1407895190894006`
   - Choose token expiration: **Never** (for permanent token) or **60 days** (recommended for security)
   - **Assign these three permissions:**
     - `business_management`
     - `whatsapp_business_management`
     - `whatsapp_business_messaging`
   - You can search for "business" to find these quickly
3. Click **Generate token**
4. **Copy the token immediately** - you won't be able to see it again!

### Step 5: Update Cloud Run with New Token

Once you have the system token, update it:

```bash
gcloud run services update mcgann-boxing \
  --region=europe-west2 \
  --update-env-vars="META_ACCESS_TOKEN=YOUR_NEW_SYSTEM_TOKEN_HERE" \
  --quiet
```

## Verify Token Works

Test the new token:

```bash
curl -i -X GET "https://graph.facebook.com/v24.0/103535589245589?fields=id,name" \
  -H "Authorization: Bearer YOUR_NEW_SYSTEM_TOKEN_HERE"
```

Should return your phone number details.

## Important Notes

- **System tokens are long-lived** - they don't expire every few hours like user tokens
- **Admin system users** have full access to all WABAs in your business portfolio
- **Employee system users** need individual WABA access granted
- For production, use **Admin** role for simplicity
- Consider setting expiration to **60 days** and rotating tokens periodically for security

## Troubleshooting

### "Error 200" - Access Denied
- Make sure the system user has **Full control** or **Partial** access to your WABA
- Check that all three permissions are granted

### Token Not Working
- Verify the token was copied correctly (no extra spaces)
- Check that the system user has access to the WhatsApp Business Account
- Ensure the app has the correct permissions

## Reference

- [Meta Documentation: System User Access Tokens](https://developers.facebook.com/docs/whatsapp/business-management-api/get-started#system-user-access-tokens)


# Update Webhook URL in Meta Dashboard

## ✅ Deployment Successful!

Your app is now deployed at:
**https://mcgann-boxing-2coodfhbmq-nw.a.run.app**

## Update Webhook in Meta Dashboard

1. Go to Meta App Dashboard → **WhatsApp** → **Configuration** → **Webhook**
2. Click **Edit**
3. Update **Callback URL** to:
   ```
   https://mcgann-boxing-2coodfhbmq-nw.a.run.app/server-api/whatsapp-webhook
   ```
4. **Verify Token** should be:
   ```
   889b1120a6d061de89cd9dea30558700e50964dcd30a5344b2e87bbdbf6ddcb0
   ```
5. Click **"Verify and Save"**
6. Make sure **"messages"** field is subscribed

## Test Webhook Verification

✅ **Webhook verification is working!**

Test with:
```bash
curl "https://mcgann-boxing-2coodfhbmq-nw.a.run.app/server-api/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=889b1120a6d061de89cd9dea30558700e50964dcd30a5344b2e87bbdbf6ddcb0&hub.challenge=test123"
```

Should return: `test123` ✅

## Test End-to-End

1. Send WhatsApp message to your business number: "When are you available?"
2. Check Cloud Run logs:
   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=mcgann-boxing" --limit 50
   ```
3. Look for: `[WhatsApp] Auto-replied to...`
4. Check WhatsApp for auto-reply with booking link


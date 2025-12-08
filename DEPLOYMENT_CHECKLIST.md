# Deployment Checklist - WhatsApp Coach Controls

## ✅ What's Already Deployed (from previous deployment)
- Basic WhatsApp webhook integration
- Meta Cloud API integration
- Webhook verification
- Auto-reply functionality (basic)

## ❌ What Needs to be Deployed (Coach Controls Feature)

### Code Changes
- [ ] `components/dashboard/WhatsAppControlPanel.tsx` (NEW)
- [ ] `components/dashboard/CoachDashboard.tsx` (modified - added WhatsApp tab)
- [ ] `context/DataContext.tsx` (modified - async updateCoach, coach mapping)
- [ ] `server.js` (modified - auto-reply check, coach mapping, send-whatsapp endpoint)
- [ ] `types.ts` (modified - added whatsappAutoReplyEnabled field)
- [ ] `services/notificationService.ts` (modified - uses API endpoint)

### Database Changes
- [ ] `coaches.whatsapp_auto_reply_enabled` column (already added in Supabase ✅)

## Deployment Steps

1. **Build and test locally**
   ```bash
   npm run build
   ```

2. **Deploy to Google Cloud Run**
   ```bash
   gcloud builds submit --tag gcr.io/gen-lang-client-0158369562/mcgann-boxing:$(git rev-parse --short HEAD)
   gcloud run deploy mcgann-boxing \
     --image gcr.io/gen-lang-client-0158369562/mcgann-boxing:$(git rev-parse --short HEAD) \
     --region=europe-west2 \
     --platform=managed \
     --allow-unauthenticated \
     --set-env-vars="..." \
     --set-secrets="..."
   ```

3. **Verify deployment**
   - Check Cloud Run logs
   - Test WhatsApp tab appears for coaches
   - Test auto-reply toggle works
   - Test message sending works

## Current Status
- ✅ Database column exists in Supabase
- ❌ Code changes NOT deployed to production
- ❌ New component NOT in production


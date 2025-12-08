# Deploy WhatsApp Integration to Production

## Your Production URL
**Webhook URL**: `https://mcgann-boxing-898295873669.europe-west2.run.app/server-api/whatsapp-webhook`

## Step 1: Fix gcloud Auth (if needed)

```bash
gcloud auth login
```

## Step 2: Create Secret for META_APP_SECRET

```bash
echo -n "ff05ca0998d0947680b79eac2ca75b32" | gcloud secrets create meta-app-secret --data-file=-
```

If secret already exists, update it:
```bash
echo -n "ff05ca0998d0947680b79eac2ca75b32" | gcloud secrets versions add meta-app-secret --data-file=-
```

## Step 3: Build and Deploy

```bash
# Build and push image
gcloud builds submit --tag gcr.io/gen-lang-client-0158369562/mcgann-boxing:$(git rev-parse --short HEAD)

# Deploy with Meta environment variables
gcloud run deploy mcgann-boxing \
  --image gcr.io/gen-lang-client-0158369562/mcgann-boxing:$(git rev-parse --short HEAD) \
  --region=europe-west2 \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="META_APP_ID=1407895190894006,META_ACCESS_TOKEN=EAAUAeSS79bYBQNpvJEj5mtbsKt2pVyPRScZAvvoVFi4Eon2Q3cmpV78s5ePfm3ZCgcKl7xdFZCYOPl7V1KLcfaAAEm7KDiO2HlmrOZAAjqXZAWAtZAk5CZCVYyThNxRqkHcWieNaeHiiULKAjNwei0M8UUP1aqKY3wzCwFjIaZCW0SwGqGFwBbgDe33zbVNCilgdBto2Ifuf90FkVHCyZCl7HLbi86zDt74SRTdO8Ol02ZA71Fpa4z8c6qo7hkmdHboVVMaWoJH785gnNpwhSOVQZDZD,WHATSAPP_PHONE_NUMBER_ID=103535589245589,META_WEBHOOK_VERIFY_TOKEN=889b1120a6d061de89cd9dea30558700e50964dcd30a5344b2e87bbdbf6ddcb0,META_API_VERSION=v21.0,FRONTEND_URL=https://mcgann-boxing-898295873669.europe-west2.run.app" \
  --set-secrets="META_APP_SECRET=meta-app-secret:latest,SUPABASE_SERVICE_ROLE_KEY=supabase-service-role-key:latest"
```

## Step 4: Update Webhook in Meta Dashboard

1. Go to Meta App Dashboard → **WhatsApp** → **Configuration** → **Webhook**
2. Click **Edit**
3. Update **Callback URL** to:
   ```
   https://mcgann-boxing-898295873669.europe-west2.run.app/server-api/whatsapp-webhook
   ```
4. **Verify Token** should already be: `889b1120a6d061de89cd9dea30558700e50964dcd30a5344b2e87bbdbf6ddcb0`
5. Click **"Verify and Save"**
6. Make sure **"messages"** field is subscribed

## Step 5: Test Webhook Verification

```bash
curl "https://mcgann-boxing-898295873669.europe-west2.run.app/server-api/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=889b1120a6d061de89cd9dea30558700e50964dcd30a5344b2e87bbdbf6ddcb0&hub.challenge=test123"
```

Should return: `test123`

## Step 6: Test End-to-End

1. Send a WhatsApp message to your business number: "When are you available?"
2. Check Cloud Run logs:
   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=mcgann-boxing" --limit 50
   ```
3. Look for: `[WhatsApp] Auto-replied to...`
4. Check WhatsApp for auto-reply with booking link

## Quick Deploy Script

Save this as `deploy-whatsapp.sh`:

```bash
#!/bin/bash
set -e

echo "🔨 Building and deploying WhatsApp integration..."

# Build
gcloud builds submit --tag gcr.io/gen-lang-client-0158369562/mcgann-boxing:$(git rev-parse --short HEAD)

# Deploy
gcloud run deploy mcgann-boxing \
  --image gcr.io/gen-lang-client-0158369562/mcgann-boxing:$(git rev-parse --short HEAD) \
  --region=europe-west2 \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="META_APP_ID=1407895190894006,META_ACCESS_TOKEN=EAAUAeSS79bYBQNpvJEj5mtbsKt2pVyPRScZAvvoVFi4Eon2Q3cmpV78s5ePfm3ZCgcKl7xdFZCYOPl7V1KLcfaAAEm7KDiO2HlmrOZAAjqXZAWAtZAk5CZCVYyThNxRqkHcWieNaeHiiULKAjNwei0M8UUP1aqKY3wzCwFjIaZCW0SwGqGFwBbgDe33zbVNCilgdBto2Ifuf90FkVHCyZCl7HLbi86zDt74SRTdO8Ol02ZA71Fpa4z8c6qo7hkmdHboVVMaWoJH785gnNpwhSOVQZDZD,WHATSAPP_PHONE_NUMBER_ID=103535589245589,META_WEBHOOK_VERIFY_TOKEN=889b1120a6d061de89cd9dea30558700e50964dcd30a5344b2e87bbdbf6ddcb0,META_API_VERSION=v21.0,FRONTEND_URL=https://mcgann-boxing-898295873669.europe-west2.run.app" \
  --set-secrets="META_APP_SECRET=meta-app-secret:latest,SUPABASE_SERVICE_ROLE_KEY=supabase-service-role-key:latest"

echo "✅ Deployment complete!"
echo ""
echo "Next: Update webhook URL in Meta dashboard to:"
echo "https://mcgann-boxing-898295873669.europe-west2.run.app/server-api/whatsapp-webhook"
```


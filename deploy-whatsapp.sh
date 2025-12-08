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

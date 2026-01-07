#!/bin/bash
set -e

echo "🚀 Deploying Fleetwood Boxing Gym to Google Cloud Run..."
echo ""

# Get the current git commit hash for tagging
TAG=$(git rev-parse --short HEAD)
echo "📦 Building image with tag: ${TAG}"

# Set your Supabase values (update these if needed)
VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-https://nthibubpasppgpozlqvw.supabase.co}"
VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50aGlidWJwYXNwcGdwb3pscXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2OTgwMzksImV4cCI6MjA3OTI3NDAzOX0.VSDL3tzR36WDECQssSRnJcdLHx38LMa9f7Rek437u2s}"

echo "🔨 Building Docker image with Cloud Build..."
# Build using cloudbuild.yaml with substitutions
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_TAG=${TAG},_VITE_SUPABASE_URL=${VITE_SUPABASE_URL},_VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

echo ""
echo "✅ Build complete!"
echo ""
echo "🚀 Deploying to Cloud Run..."

# Deploy to Cloud Run with all environment variables
# Note: Stripe keys should be set as Google Cloud secrets before running
# Create secrets with:
#   echo -n "your-key" | gcloud secrets create stripe-publishable-key --data-file=-
#   echo -n "your-key" | gcloud secrets create stripe-secret-key --data-file=-
#   echo -n "your-key" | gcloud secrets create stripe-webhook-secret --data-file=-
gcloud run deploy mcgann-boxing \
  --image gcr.io/gen-lang-client-0158369562/mcgann-boxing:${TAG} \
  --region=europe-west2 \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="SUPABASE_URL=https://nthibubpasppgpozlqvw.supabase.co,VITE_SUPABASE_URL=${VITE_SUPABASE_URL},VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY},FRONTEND_URL=https://mcgann-boxing-898295873669.europe-west2.run.app" \
  --set-secrets="SUPABASE_SERVICE_ROLE_KEY=supabase-service-role-key:latest,STRIPE_PUBLISHABLE_KEY=stripe-publishable-key:latest,STRIPE_SECRET_KEY=stripe-secret-key:latest,STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your app should be live at:"
gcloud run services describe mcgann-boxing --region=europe-west2 --format='value(status.url)'

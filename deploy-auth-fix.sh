#!/bin/bash
set -e

echo "🚀 Deploying Fleetwood Boxing Gym with Authentication Fix..."
echo ""

# Get the current git commit hash for tagging
TAG=$(git rev-parse --short HEAD)
echo "📦 Building image with tag: ${TAG}"

# Check if environment variables are set
if [ -z "$VITE_SUPABASE_URL" ]; then
  echo "⚠️  VITE_SUPABASE_URL not set. Please set it:"
  echo "   export VITE_SUPABASE_URL=https://your-project.supabase.co"
  exit 1
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  echo "⚠️  VITE_SUPABASE_ANON_KEY not set. Please set it:"
  echo "   export VITE_SUPABASE_ANON_KEY=your-anon-key"
  exit 1
fi

# Build using cloudbuild.yaml with substitutions
echo "🔨 Building Docker image with Cloud Build..."
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_TAG=${TAG},_VITE_SUPABASE_URL=${VITE_SUPABASE_URL},_VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

echo ""
echo "✅ Build complete!"
echo ""
echo "🚀 Deploying to Cloud Run..."

# Deploy to Cloud Run
gcloud run deploy mcgann-boxing \
  --image gcr.io/gen-lang-client-0158369562/mcgann-boxing:${TAG} \
  --region=europe-west2 \
  --platform=managed \
  --allow-unauthenticated \
  --quiet

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your app should be live at:"
gcloud run services describe mcgann-boxing --region=europe-west2 --format='value(status.url)'
echo ""
echo "📝 Note: Make sure SUPABASE_SERVICE_ROLE_KEY secret is set in Cloud Run"

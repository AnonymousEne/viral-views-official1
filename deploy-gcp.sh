# Google Cloud Run deployment script for Viral Views
# Prerequisites: gcloud CLI installed and authenticated, project set

SERVICE_NAME=viral-views-app
REGION=us-central1
IMAGE=gcr.io/$GOOGLE_CLOUD_PROJECT/$SERVICE_NAME:latest

# Build Docker image
gcloud builds submit --tag $IMAGE .

# Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,PORT=3000,DATABASE_URL=file:./db/production.sqlite,SENDGRID_API_KEY=your_sendgrid_key,JWT_SECRET=your_jwt_secret

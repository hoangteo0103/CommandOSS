# Deployment Guide: Google Cloud Run

This guide will help you deploy your NestJS Ticket System API to Google Cloud Run.

## Prerequisites

1. **Google Cloud Account**: Ensure you have a Google Cloud account with billing enabled
2. **Google Cloud CLI**: Install the `gcloud` CLI tool
3. **Docker**: Install Docker on your local machine
4. **Service Account Key**: Download your Google Cloud service account key as `service-account-key.json`

## Setup Instructions

### 1. Install Google Cloud CLI

```bash
# macOS
brew install google-cloud-sdk

# Or download from: https://cloud.google.com/sdk/docs/install
```

### 2. Authenticate with Google Cloud

```bash
gcloud auth login
gcloud auth application-default login
```

### 3. Set Your Project ID

Update the `PROJECT_ID` in `deploy.sh`:

```bash
# Edit deploy.sh and replace "your-gcp-project-id" with your actual project ID
PROJECT_ID="your-actual-project-id"
```

### 4. Place Service Account Key

Ensure your `service-account-key.json` file is in the backend root directory.

### 5. Set Up Environment Variables

You'll need to configure these environment variables in Cloud Run:

#### Required Environment Variables:

- `NODE_ENV=production`
- `PORT=8080` (automatically set by Cloud Run)
- `DATABASE_HOST` - Your PostgreSQL host (recommend Cloud SQL)
- `DATABASE_PORT=5432`
- `DATABASE_USERNAME` - Your database username
- `DATABASE_PASSWORD` - Your database password
- `DATABASE_NAME` - Your database name
- `GOOGLE_CLOUD_PROJECT_ID` - Your GCP project ID
- `GOOGLE_CLOUD_STORAGE_BUCKET` - Your GCS bucket name
- `QDRANT_URL` - Your Qdrant cluster URL
- `QDRANT_API_KEY` - Your Qdrant API key
- `SUI_PRIVATE_KEY` - Your Sui private key
- `SUI_PACKAGE_ID` - Your Sui package ID
- `SUI_NETWORK=testnet`

## Deployment Options

### Option 1: Using the Deploy Script (Recommended)

```bash
cd backend
./deploy.sh
```

### Option 2: Manual Deployment

```bash
cd backend

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and deploy
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/ticket-system-api
gcloud run deploy ticket-system-api \
    --image gcr.io/YOUR_PROJECT_ID/ticket-system-api \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --timeout 300
```

### Option 3: Using Cloud Build (CI/CD)

1. Connect your repository to Cloud Build
2. Use the provided `cloudbuild.yaml` configuration
3. Trigger builds automatically on code changes

## Database Setup

### Recommended: Cloud SQL for PostgreSQL

1. Create a Cloud SQL instance:

```bash
gcloud sql instances create ticket-system-db \
    --database-version=POSTGRES_14 \
    --tier=db-f1-micro \
    --region=us-central1
```

2. Create a database:

```bash
gcloud sql databases create eventify_db --instance=ticket-system-db
```

3. Create a user:

```bash
gcloud sql users create eventify_user \
    --instance=ticket-system-db \
    --password=YOUR_SECURE_PASSWORD
```

4. Get the connection name:

```bash
gcloud sql instances describe ticket-system-db --format="value(connectionName)"
```

## Environment Variables Configuration

After deployment, set environment variables in Cloud Run:

```bash
gcloud run services update ticket-system-api \
    --region us-central1 \
    --set-env-vars NODE_ENV=production,DATABASE_HOST=YOUR_DB_HOST,DATABASE_USERNAME=eventify_user,DATABASE_PASSWORD=YOUR_PASSWORD,DATABASE_NAME=eventify_db,GOOGLE_CLOUD_PROJECT_ID=YOUR_PROJECT_ID,GOOGLE_CLOUD_STORAGE_BUCKET=YOUR_BUCKET_NAME
```

## Post-Deployment Steps

### 1. Run Database Migrations

Connect to your Cloud Run service and run migrations:

```bash
# Option 1: Use Cloud Shell
gcloud run services proxy ticket-system-api --port=8080

# Option 2: Create a one-time job for migrations
gcloud run jobs create migration-job \
    --image gcr.io/YOUR_PROJECT_ID/ticket-system-api \
    --region us-central1 \
    --set-env-vars NODE_ENV=production \
    --command="npm,run,migration:run"
```

### 2. Verify Deployment

Check your service status:

```bash
gcloud run services describe ticket-system-api --region us-central1
```

### 3. Test the API

```bash
curl https://YOUR_SERVICE_URL/
```

## Monitoring and Logging

- **Logs**: View logs in Google Cloud Console > Cloud Run > ticket-system-api > Logs
- **Metrics**: Monitor performance in the Metrics tab
- **Alerts**: Set up alerting policies for error rates and latency

## Security Considerations

1. **Service Account**: Use least-privilege service accounts
2. **Environment Variables**: Store sensitive data in Secret Manager
3. **VPC**: Consider using VPC for database connections
4. **Authentication**: Implement proper authentication for production

## Troubleshooting

### Common Issues:

1. **Build Failures**: Check that all dependencies are in `package.json`
2. **Database Connection**: Verify database credentials and network access
3. **Memory Issues**: Increase memory allocation if needed
4. **Cold Starts**: Consider using minimum instances for better performance

### Useful Commands:

```bash
# View logs
gcloud run services logs read ticket-system-api --region us-central1

# Update service
gcloud run services update ticket-system-api --region us-central1

# Delete service
gcloud run services delete ticket-system-api --region us-central1
```

## Cost Optimization

- Use minimum instances only if needed
- Set appropriate CPU and memory limits
- Monitor usage and adjust resources accordingly
- Consider using Cloud SQL proxy for database connections

## Support

For issues related to:

- **Google Cloud Run**: Check [Cloud Run documentation](https://cloud.google.com/run/docs)
- **NestJS**: Check [NestJS documentation](https://docs.nestjs.com)
- **TypeORM**: Check [TypeORM documentation](https://typeorm.io)

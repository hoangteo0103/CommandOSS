#!/bin/bash

# Enhanced deployment script that reads local environment variables
# and deploys them to Google Cloud Run

# Configuration - Update these values for your project
PROJECT_ID="eventify-460809"
SERVICE_NAME="ticket-system-api"
REGION="asia-southeast1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting deployment to Google Cloud Run with local environment variables${NC}"

# Function to load environment variables from file
load_env_file() {
    local env_file=$1
    if [ -f "$env_file" ]; then
        echo -e "${BLUE}📂 Loading environment variables from $env_file${NC}"
        # Export variables from file, skipping comments and empty lines
        export $(grep -v '^#' "$env_file" | grep -v '^$' | xargs)
        return 0
    else
        return 1
    fi
}

# Try to load environment variables from different sources
ENV_FILE=""
if load_env_file ".env"; then
    ENV_FILE=".env"
elif load_env_file ".env.local"; then
    ENV_FILE=".env.local"
elif load_env_file ".env.production"; then
    ENV_FILE=".env.production"
else
    echo -e "${YELLOW}⚠️  No .env file found. You can create one or set environment variables manually.${NC}"
    echo -e "${YELLOW}📝 Available options:${NC}"
    echo -e "   1. Create .env file with your environment variables"
    echo -e "   2. Create .env.local file for local development"
    echo -e "   3. Create .env.production file for production deployment"
    echo -e "   4. Use env.example as a template"
    echo ""
    read -p "Do you want to continue without loading environment variables? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Deployment cancelled${NC}"
        exit 1
    fi
fi

# Update PROJECT_ID from environment if available
if [ ! -z "$GCP_PROJECT_ID" ]; then
    PROJECT_ID="$GCP_PROJECT_ID"
    IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
    echo -e "${BLUE}📝 Using PROJECT_ID from environment: $PROJECT_ID${NC}"
fi

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}⚠️  Not authenticated with gcloud. Please run 'gcloud auth login'${NC}"
    exit 1
fi

# Set the project
echo -e "${YELLOW}📝 Setting project to ${PROJECT_ID}${NC}"
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo -e "${YELLOW}🔧 Enabling required APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and submit to Cloud Build
echo -e "${YELLOW}🏗️  Building container image...${NC}"
gcloud builds submit --tag ${IMAGE_NAME}

# Prepare environment variables for Cloud Run
ENV_VARS=""
if [ ! -z "$ENV_FILE" ]; then
    echo -e "${BLUE}🔧 Preparing environment variables for Cloud Run...${NC}"
    
    # List of environment variables to set (excluding sensitive local-only vars)
    CLOUD_RUN_VARS=(
        "NODE_ENV"
        "DATABASE_HOST"
        "DATABASE_PORT" 
        "DATABASE_USERNAME"
        "DATABASE_PASSWORD"
        "DATABASE_NAME"
        "GCP_PROJECT_ID"
        "GCS_BUCKET_NAME"
        "QDRANT_URL"
        "QDRANT_API_KEY"
        "SUI_PRIVATE_KEY"
        "SUI_PACKAGE_ID"
        "SUI_NETWORK"
    )
    
    # Build environment variables string
    for var in "${CLOUD_RUN_VARS[@]}"; do
        if [ ! -z "${!var}" ]; then
            if [ -z "$ENV_VARS" ]; then
                ENV_VARS="${var}=${!var}"
            else
                ENV_VARS="${ENV_VARS},${var}=${!var}"
            fi
            echo -e "   ✓ ${var}=${!var}"
        fi
    done
fi

# Deploy to Cloud Run
echo -e "${YELLOW}🚀 Deploying to Cloud Run...${NC}"
DEPLOY_CMD="gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --timeout 300"

# Add environment variables if available
if [ ! -z "$ENV_VARS" ]; then
    DEPLOY_CMD="${DEPLOY_CMD} --set-env-vars ${ENV_VARS}"
fi

# Execute deployment
eval $DEPLOY_CMD

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --platform managed --region ${REGION} --format 'value(status.url)')

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Service URL: ${SERVICE_URL}${NC}"
echo -e "${YELLOW}📝 Environment variables deployed:${NC}"
if [ ! -z "$ENV_FILE" ]; then
    echo -e "   📂 Loaded from: $ENV_FILE"
    if [ ! -z "$ENV_VARS" ]; then
        echo -e "   🔧 Variables set: $(echo $ENV_VARS | tr ',' '\n' | cut -d'=' -f1 | tr '\n' ' ')"
    fi
else
    echo -e "   ⚠️  No environment file was loaded"
fi

echo -e "${YELLOW}🔍 Next steps:${NC}"
echo -e "   1. Test your API: curl ${SERVICE_URL}"
echo -e "   2. Check logs: gcloud run services logs read ${SERVICE_NAME} --region ${REGION}"
echo -e "   3. Run database migrations if needed"
echo -e "   4. Monitor your service in the Cloud Console" 
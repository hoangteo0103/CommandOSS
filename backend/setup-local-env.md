# Setting Up Environment Variables from Local Machine

This guide explains how to get environment variables from your local machine and deploy them to Google Cloud Run.

## Quick Setup

### Option 1: Use Environment Helper Script (Recommended)

```bash
cd backend
./env-helper.sh
```

This interactive script will help you:

- Create environment files from templates
- Show current environment variables
- Export your current environment to files
- Load and validate environment files

### Option 2: Manual Setup

1. **Create your environment file:**

```bash
cd backend
cp env.example .env
# Edit .env with your actual values
```

2. **Deploy with environment variables:**

```bash
./deploy-with-env.sh
```

## Environment File Priority

The deployment script will look for environment files in this order:

1. `.env` (main environment file)
2. `.env.local` (local development)
3. `.env.production` (production-specific)

## Setting Environment Variables from Your Current Session

If you already have environment variables set in your current terminal session, you can export them:

### Method 1: Export to File

```bash
# Export current environment variables to a file
printenv | grep -E "^(DATABASE_|GOOGLE_|QDRANT_|SUI_)" > .env.production
```

### Method 2: Set Variables in Terminal

```bash
# Set your environment variables in the current session
export GOOGLE_CLOUD_PROJECT_ID="your-project-id"
export DATABASE_HOST="your-database-host"
export DATABASE_USERNAME="your-username"
export DATABASE_PASSWORD="your-password"
export DATABASE_NAME="your-database"
export GOOGLE_CLOUD_STORAGE_BUCKET="your-bucket"
export QDRANT_URL="your-qdrant-url"
export QDRANT_API_KEY="your-qdrant-key"
export SUI_PRIVATE_KEY="your-sui-key"
export SUI_PACKAGE_ID="your-sui-package"

# Then run the deployment script
./deploy-with-env.sh
```

### Method 3: Load from Existing .env File

```bash
# If you have a .env file, load it in current session
source .env
# Then deploy
./deploy-with-env.sh
```

## Required Environment Variables for Cloud Run

### Essential Variables:

- `NODE_ENV=production`
- `GOOGLE_CLOUD_PROJECT_ID` - Your GCP project ID
- `DATABASE_HOST` - Your PostgreSQL host
- `DATABASE_USERNAME` - Database username
- `DATABASE_PASSWORD` - Database password
- `DATABASE_NAME` - Database name

### Optional but Recommended:

- `GOOGLE_CLOUD_STORAGE_BUCKET` - For file uploads
- `QDRANT_URL` - For vector search
- `QDRANT_API_KEY` - Qdrant authentication
- `SUI_PRIVATE_KEY` - Sui blockchain integration
- `SUI_PACKAGE_ID` - Sui package ID
- `SUI_NETWORK` - Sui network (testnet/mainnet)

## Quick Commands

### Check Current Environment

```bash
cd backend
./env-helper.sh
# Choose option 4 to show current environment variables
```

### Create Environment File from Template

```bash
cd backend
cp env.example .env
# Edit .env with your values
```

### Deploy with Environment Variables

```bash
cd backend
./deploy-with-env.sh
```

### Update Environment Variables in Existing Service

```bash
gcloud run services update ticket-system-api \
    --region us-central1 \
    --set-env-vars NODE_ENV=production,DATABASE_HOST=your-host
```

## Troubleshooting

### Environment Variables Not Loading

- Check file permissions: `ls -la .env*`
- Verify file format (no spaces around =)
- Check for special characters in values

### Deployment Fails

- Verify gcloud authentication: `gcloud auth list`
- Check project ID: `gcloud config get-value project`
- Verify required APIs are enabled

### Environment Variables Not Set in Cloud Run

- Check deployment logs: `gcloud run services logs read ticket-system-api --region us-central1`
- Verify variables in Cloud Console
- Use masked values for sensitive data

## Security Best Practices

1. **Never commit environment files to git:**

```bash
echo ".env*" >> .gitignore
```

2. **Use Google Secret Manager for sensitive data:**

```bash
# Store sensitive values in Secret Manager
gcloud secrets create database-password --data-file=-
```

3. **Rotate secrets regularly**

4. **Use least-privilege service accounts**

## Examples

### Example .env file:

```bash
NODE_ENV=production
GOOGLE_CLOUD_PROJECT_ID=my-project-123
DATABASE_HOST=34.123.45.67
DATABASE_USERNAME=eventify_user
DATABASE_PASSWORD=secure_password_123
DATABASE_NAME=eventify_db
GOOGLE_CLOUD_STORAGE_BUCKET=my-app-storage
QDRANT_URL=https://xyz.qdrant.tech:6333
QDRANT_API_KEY=qdr_abc123
SUI_PRIVATE_KEY=suiprivkey_abc123
SUI_PACKAGE_ID=0x123abc
SUI_NETWORK=testnet
```

### Example deployment with environment variables:

```bash
cd backend
source .env  # Load environment variables
./deploy-with-env.sh  # Deploy with loaded variables
```

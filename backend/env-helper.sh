#!/bin/bash

# Environment Helper Script
# This script helps you create and manage environment files from your local setup

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Environment Helper for Cloud Run Deployment${NC}"
echo

# Function to create env file from template
create_env_from_template() {
    local target_file=$1
    echo -e "${BLUE}📝 Creating $target_file from env.example...${NC}"
    
    if [ ! -f "env.example" ]; then
        echo -e "${RED}❌ env.example not found${NC}"
        return 1
    fi
    
    cp env.example "$target_file"
    echo -e "${GREEN}✅ Created $target_file${NC}"
    echo -e "${YELLOW}📝 Please edit $target_file with your actual values${NC}"
    return 0
}

# Function to show current environment variables
show_env_vars() {
    echo -e "${BLUE}🔍 Current environment variables that will be deployed:${NC}"
    echo
    
    local vars=(
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
    
    for var in "${vars[@]}"; do
        if [ ! -z "${!var}" ]; then
            # Mask sensitive variables
            if [[ "$var" == *"PASSWORD"* ]] || [[ "$var" == *"KEY"* ]]; then
                echo -e "   ✓ ${var}=***masked***"
            else
                echo -e "   ✓ ${var}=${!var}"
            fi
        else
            echo -e "   ❌ ${var}=<not set>"
        fi
    done
    echo
}

# Function to load and show environment variables from file
load_and_show_env() {
    local env_file=$1
    if [ -f "$env_file" ]; then
        echo -e "${BLUE}📂 Loading environment variables from $env_file${NC}"
        export $(grep -v '^#' "$env_file" | grep -v '^$' | xargs)
        show_env_vars
        return 0
    else
        echo -e "${RED}❌ $env_file not found${NC}"
        return 1
    fi
}

# Function to create env file from current environment
export_current_env() {
    local target_file=$1
    echo -e "${BLUE}📦 Exporting current environment variables to $target_file${NC}"
    
    # Get current values and write to file
    cat > "$target_file" << EOF
# Environment file created from current environment
# Generated on $(date)

NODE_ENV=${NODE_ENV:-production}
PORT=${PORT:-8080}

# Database
DATABASE_HOST=${DATABASE_HOST:-}
DATABASE_PORT=${DATABASE_PORT:-5432}
DATABASE_USERNAME=${DATABASE_USERNAME:-}
DATABASE_PASSWORD=${DATABASE_PASSWORD:-}
DATABASE_NAME=${DATABASE_NAME:-}

# Google Cloud
GCP_PROJECT_ID=${GCP_PROJECT_ID:-}
GCS_BUCKET_NAME=${GCS_BUCKET_NAME:-}
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json

# Qdrant
QDRANT_URL=${QDRANT_URL:-}
QDRANT_API_KEY=${QDRANT_API_KEY:-}

# Sui Blockchain
SUI_PRIVATE_KEY=${SUI_PRIVATE_KEY:-}
SUI_PACKAGE_ID=${SUI_PACKAGE_ID:-}
SUI_NETWORK=${SUI_NETWORK:-testnet}
EOF
    
    echo -e "${GREEN}✅ Environment variables exported to $target_file${NC}"
}

# Main menu
while true; do
    echo -e "${YELLOW}What would you like to do?${NC}"
    echo "1. Create .env file from env.example template"
    echo "2. Create .env.local file from env.example template"
    echo "3. Create .env.production file from env.example template"
    echo "4. Show current environment variables"
    echo "5. Load and show environment from .env file"
    echo "6. Load and show environment from .env.local file"
    echo "7. Export current environment to .env.production"
    echo "8. Exit"
    echo
    read -p "Choose an option (1-8): " choice
    
    case $choice in
        1)
            create_env_from_template ".env"
            ;;
        2)
            create_env_from_template ".env.local"
            ;;
        3)
            create_env_from_template ".env.production"
            ;;
        4)
            show_env_vars
            ;;
        5)
            load_and_show_env ".env"
            ;;
        6)
            load_and_show_env ".env.local"
            ;;
        7)
            export_current_env ".env.production"
            ;;
        8)
            echo -e "${GREEN}👋 Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Invalid option. Please choose 1-8.${NC}"
            ;;
    esac
    echo
done 
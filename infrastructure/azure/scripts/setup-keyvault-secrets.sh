#!/bin/bash

# ECONEURA Key Vault Secrets Setup - Bash Version
# Script to initialize Azure Key Vault with required secrets

set -euo pipefail

# Color functions
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Script parameters
ENVIRONMENT=""
SUBSCRIPTION_ID=""
RESOURCE_GROUP=""
KEY_VAULT_NAME=""

# Usage function
usage() {
    echo "Usage: $0 -e <environment> -s <subscription-id> [-r <resource-group>] [-k <key-vault-name>]"
    echo "  -e, --environment     Target environment (dev|staging|prod)"
    echo "  -s, --subscription    Azure subscription ID"
    echo "  -r, --resource-group  Resource group name (optional)"
    echo "  -k, --key-vault       Key Vault name (optional, will auto-discover)"
    echo "  -h, --help           Show this help message"
    exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -s|--subscription)
            SUBSCRIPTION_ID="$2"
            shift 2
            ;;
        -r|--resource-group)
            RESOURCE_GROUP="$2"
            shift 2
            ;;
        -k|--key-vault)
            KEY_VAULT_NAME="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown option $1"
            usage
            ;;
    esac
done

# Validate required parameters
if [[ -z "$ENVIRONMENT" ]] || [[ -z "$SUBSCRIPTION_ID" ]]; then
    print_error "Environment and subscription ID are required"
    usage
fi

# Validate environment
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "prod" ]]; then
    print_error "Environment must be one of: dev, staging, prod"
    exit 1
fi

# Set default resource group if not provided
if [[ -z "$RESOURCE_GROUP" ]]; then
    RESOURCE_GROUP="econeura-${ENVIRONMENT}-rg"
fi

print_info "Setting up Azure Key Vault secrets for ECONEURA $ENVIRONMENT environment"

# Check Azure CLI installation
if ! command -v az &> /dev/null; then
    print_error "Azure CLI is not installed. Please install it first."
    exit 1
fi

# Login and set subscription
print_info "Setting Azure subscription: $SUBSCRIPTION_ID"
az account set --subscription "$SUBSCRIPTION_ID"
if [[ $? -ne 0 ]]; then
    print_error "Failed to set Azure subscription. Please login with 'az login' first."
    exit 1
fi

print_success "Connected to Azure subscription"

# Discover Key Vault if not provided
if [[ -z "$KEY_VAULT_NAME" ]]; then
    print_info "Discovering Key Vault in resource group: $RESOURCE_GROUP"
    KEY_VAULT_NAME=$(az keyvault list --resource-group "$RESOURCE_GROUP" --query "[0].name" -o tsv)
    
    if [[ -z "$KEY_VAULT_NAME" ]]; then
        print_error "No Key Vault found in resource group: $RESOURCE_GROUP"
        exit 1
    fi
    
    print_info "Using Key Vault: $KEY_VAULT_NAME"
fi

# Function to generate secure password
generate_password() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# Generate secrets
print_info "Generating secure secrets..."

JWT_SECRET=$(generate_password 64)
POSTGRES_PASSWORD=$(generate_password 32)
NEXTAUTH_SECRET=$(generate_password 48)
REDIS_PASSWORD=$(generate_password 24)
WEBHOOK_SECRET=$(generate_password 40)

# Database URL
POSTGRES_HOST="econeura-${ENVIRONMENT}-postgres.postgres.database.azure.com"
DATABASE_URL="postgresql://econeura_admin:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/econeura_db?sslmode=require"

# Prompt for OpenAI API Key
while [[ -z "${OPENAI_API_KEY:-}" ]]; do
    read -s -p "Enter OpenAI API Key for $ENVIRONMENT environment: " OPENAI_API_KEY
    echo
    if [[ -z "$OPENAI_API_KEY" ]]; then
        print_warning "OpenAI API Key cannot be empty"
    fi
done

# Store secrets in Key Vault
print_info "Storing secrets in Key Vault: $KEY_VAULT_NAME"

secrets=(
    "jwt-secret-${ENVIRONMENT}:${JWT_SECRET}"
    "postgres-admin-password:${POSTGRES_PASSWORD}"
    "nextauth-secret-${ENVIRONMENT}:${NEXTAUTH_SECRET}"
    "redis-password-${ENVIRONMENT}:${REDIS_PASSWORD}"
    "webhook-secret-${ENVIRONMENT}:${WEBHOOK_SECRET}"
    "database-url-${ENVIRONMENT}:${DATABASE_URL}"
    "openai-api-key:${OPENAI_API_KEY}"
)

for secret_pair in "${secrets[@]}"; do
    secret_name="${secret_pair%%:*}"
    secret_value="${secret_pair#*:}"
    
    if az keyvault secret set --vault-name "$KEY_VAULT_NAME" --name "$secret_name" --value "$secret_value" > /dev/null; then
        print_success "Created secret: $secret_name"
    else
        print_error "Failed to create secret: $secret_name"
    fi
done

# Generate environment template
print_info "Generating environment configuration template..."

ENV_TEMPLATE_FILE="env-template-${ENVIRONMENT}.txt"
cat > "$ENV_TEMPLATE_FILE" << EOF
# ECONEURA Environment Configuration - $ENVIRONMENT
# Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

# Database
DATABASE_URL=@Microsoft.KeyVault(SecretUri=https://${KEY_VAULT_NAME}.vault.azure.net/secrets/database-url-${ENVIRONMENT}/)

# Authentication
JWT_SECRET=@Microsoft.KeyVault(SecretUri=https://${KEY_VAULT_NAME}.vault.azure.net/secrets/jwt-secret-${ENVIRONMENT}/)
NEXTAUTH_SECRET=@Microsoft.KeyVault(SecretUri=https://${KEY_VAULT_NAME}.vault.azure.net/secrets/nextauth-secret-${ENVIRONMENT}/)

# AI Services
OPENAI_API_KEY=@Microsoft.KeyVault(SecretUri=https://${KEY_VAULT_NAME}.vault.azure.net/secrets/openai-api-key/)

# Cache
REDIS_PASSWORD=@Microsoft.KeyVault(SecretUri=https://${KEY_VAULT_NAME}.vault.azure.net/secrets/redis-password-${ENVIRONMENT}/)

# Webhooks
WEBHOOK_SECRET=@Microsoft.KeyVault(SecretUri=https://${KEY_VAULT_NAME}.vault.azure.net/secrets/webhook-secret-${ENVIRONMENT}/)

# Environment
NODE_ENV=$ENVIRONMENT
ENVIRONMENT=$ENVIRONMENT
EOF

print_success "Environment template saved to: $ENV_TEMPLATE_FILE"

# Set up managed identity permissions (if needed)
print_info "Checking managed identity permissions..."

# Get current user/service principal
CURRENT_USER=$(az account show --query user.name -o tsv)
print_info "Current user: $CURRENT_USER"

# Summary
print_info "Secret setup completed for environment: $ENVIRONMENT"
print_info "Key Vault: $KEY_VAULT_NAME"
print_info "Secrets created: ${#secrets[@]}"

print_success "🚀 Key Vault setup completed successfully for $ENVIRONMENT environment!"

# Security reminder
print_warning "SECURITY REMINDER:"
print_warning "- Keep the generated environment template secure"
print_warning "- Verify Key Vault access policies are correctly configured"
print_warning "- Monitor Key Vault access logs regularly"  
print_warning "- Rotate secrets periodically according to your security policy"

print_info "Next steps:"
print_info "1. Update your parameter files with Key Vault references"
print_info "2. Configure managed identities for your applications"
print_info "3. Deploy your infrastructure with the updated configuration"
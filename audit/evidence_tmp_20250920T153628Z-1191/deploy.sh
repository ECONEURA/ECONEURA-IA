#!/bin/bash

# ECONEURA Deployment Script
# Mediterranean CRM+ERP+AI System - Complete Azure Deployment

set -euo pipefail

# Color functions
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_step() { echo -e "${PURPLE}🚀 $1${NC}"; }

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_LOG="/tmp/econeura-deployment-$(date +%Y%m%d-%H%M%S).log"

# Default values
ENVIRONMENT="dev"
SUBSCRIPTION_ID=""
RESOURCE_GROUP=""
LOCATION="West Europe"
SKIP_INFRA="false"
SKIP_BUILD="false"
SKIP_DEPLOY="false"
DRY_RUN="false"
FORCE_DEPLOY="false"

# Usage function
usage() {
    cat << EOF
ECONEURA Deployment Script

Usage: $0 [OPTIONS]

OPTIONS:
    -e, --environment <env>       Target environment (dev|staging|prod) [default: dev]
    -s, --subscription <id>       Azure subscription ID
    -r, --resource-group <name>   Resource group name [auto-generated if not provided]
    -l, --location <location>     Azure region [default: West Europe]
    --skip-infra                  Skip infrastructure deployment
    --skip-build                  Skip application build
    --skip-deploy                 Skip application deployment
    --dry-run                     Show what would be done without executing
    --force                       Force deployment without confirmation
    -h, --help                   Show this help message

EXAMPLES:
    $0 -e dev -s "12345678-1234-1234-1234-123456789012"
    $0 -e prod -s "12345678-1234-1234-1234-123456789012" --force
    $0 -e staging --skip-infra --resource-group "my-rg"

ENVIRONMENT REQUIREMENTS:
    - Azure CLI installed and logged in
    - Node.js 18+ installed
    - Docker installed (for containerized deployment)
    - Sufficient Azure permissions for resource creation

EOF
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
        -l|--location)
            LOCATION="$2"
            shift 2
            ;;
        --skip-infra)
            SKIP_INFRA="true"
            shift
            ;;
        --skip-build)
            SKIP_BUILD="true"
            shift
            ;;
        --skip-deploy)
            SKIP_DEPLOY="true"
            shift
            ;;
        --dry-run)
            DRY_RUN="true"
            shift
            ;;
        --force)
            FORCE_DEPLOY="true"
            shift
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

# Validate requirements
validate_requirements() {
    print_step "Validating deployment requirements"
    
    # Check Azure CLI
    if ! command -v az &> /dev/null; then
        print_error "Azure CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $NODE_VERSION -lt 18 ]]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    # Validate environment
    if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "prod" ]]; then
        print_error "Environment must be one of: dev, staging, prod"
        exit 1
    fi
    
    # Validate subscription ID
    if [[ -z "$SUBSCRIPTION_ID" ]]; then
        print_error "Azure subscription ID is required"
        usage
    fi
    
    # Set default resource group if not provided
    if [[ -z "$RESOURCE_GROUP" ]]; then
        RESOURCE_GROUP="econeura-${ENVIRONMENT}-rg"
    fi
    
    print_success "Requirements validation completed"
}

# Azure login and setup
setup_azure() {
    print_step "Setting up Azure context"
    
    # Check if logged in
    if ! az account show &> /dev/null; then
        print_info "Not logged in to Azure. Please login..."
        az login
    fi
    
    # Set subscription
    print_info "Setting Azure subscription: $SUBSCRIPTION_ID"
    az account set --subscription "$SUBSCRIPTION_ID"
    
    # Verify subscription
    CURRENT_SUB=$(az account show --query id -o tsv)
    if [[ "$CURRENT_SUB" != "$SUBSCRIPTION_ID" ]]; then
        print_error "Failed to set subscription to $SUBSCRIPTION_ID"
        exit 1
    fi
    
    print_success "Azure context configured"
}

# Infrastructure deployment
deploy_infrastructure() {
    if [[ "$SKIP_INFRA" == "true" ]]; then
        print_warning "Skipping infrastructure deployment"
        return
    fi
    
    print_step "Deploying Azure infrastructure"
    
    local bicep_file="$PROJECT_ROOT/infrastructure/azure/bicep/main.bicep"
    local params_file="$PROJECT_ROOT/infrastructure/azure/bicep/parameters.$ENVIRONMENT.json"
    
    if [[ ! -f "$bicep_file" ]]; then
        print_error "Bicep template not found: $bicep_file"
        exit 1
    fi
    
    if [[ ! -f "$params_file" ]]; then
        print_error "Parameters file not found: $params_file"
        exit 1
    fi
    
    # Create resource group
    print_info "Creating resource group: $RESOURCE_GROUP"
    if [[ "$DRY_RUN" != "true" ]]; then
        az group create \
            --name "$RESOURCE_GROUP" \
            --location "$LOCATION" \
            --tags \
                Environment="$ENVIRONMENT" \
                Project="ECONEURA" \
                CreatedBy="deployment-script" \
                CreatedAt="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    else
        print_info "[DRY RUN] Would create resource group: $RESOURCE_GROUP"
    fi
    
    # Deploy infrastructure
    print_info "Deploying infrastructure to: $RESOURCE_GROUP"
    if [[ "$DRY_RUN" != "true" ]]; then
        az deployment group create \
            --resource-group "$RESOURCE_GROUP" \
            --template-file "$bicep_file" \
            --parameters "$params_file" \
            --name "econeura-infra-$(date +%Y%m%d-%H%M%S)"
    else
        print_info "[DRY RUN] Would deploy infrastructure using $bicep_file"
    fi
    
    print_success "Infrastructure deployment completed"
}

# Application build
build_applications() {
    if [[ "$SKIP_BUILD" == "true" ]]; then
        print_warning "Skipping application build"
        return
    fi
    
    print_step "Building ECONEURA applications"
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies
    print_info "Installing dependencies..."
    if [[ "$DRY_RUN" != "true" ]]; then
        npm ci --frozen-lockfile
    else
        print_info "[DRY RUN] Would run: npm ci --frozen-lockfile"
    fi
    
    # Generate Prisma client
    print_info "Generating Prisma client..."
    if [[ "$DRY_RUN" != "true" ]]; then
        npx prisma generate
    else
        print_info "[DRY RUN] Would run: npx prisma generate"
    fi
    
    # Build applications
    print_info "Building web application..."
    if [[ "$DRY_RUN" != "true" ]]; then
        npm run build:web
    else
        print_info "[DRY RUN] Would run: npm run build:web"
    fi
    
    print_info "Building API application..."
    if [[ "$DRY_RUN" != "true" ]]; then
        npm run build:api
    else
        print_info "[DRY RUN] Would run: npm run build:api"
    fi
    
    print_success "Application build completed"
}

# Database setup
setup_database() {
    print_step "Setting up database"
    
    # Get database connection details
    print_info "Retrieving database connection details..."
    local db_host
    local key_vault_name
    
    if [[ "$DRY_RUN" != "true" ]]; then
        db_host=$(az deployment group show \
            --resource-group "$RESOURCE_GROUP" \
            --name "econeura-infra-latest" \
            --query "properties.outputs.postgresHost.value" \
            --output tsv 2>/dev/null || echo "")
        
        key_vault_name=$(az deployment group show \
            --resource-group "$RESOURCE_GROUP" \
            --name "econeura-infra-latest" \
            --query "properties.outputs.keyVaultName.value" \
            --output tsv 2>/dev/null || echo "")
    fi
    
    if [[ -n "$db_host" ]]; then
        print_info "Database host: $db_host"
        
        # Run database migrations
        print_info "Running database migrations..."
        if [[ "$DRY_RUN" != "true" ]]; then
            # Get database URL from Key Vault
            local db_url
            db_url=$(az keyvault secret show \
                --vault-name "$key_vault_name" \
                --name "database-url-$ENVIRONMENT" \
                --query value \
                --output tsv)
            
            export DATABASE_URL="$db_url"
            npx prisma migrate deploy
        else
            print_info "[DRY RUN] Would run database migrations"
        fi
    else
        print_warning "Could not retrieve database connection details"
    fi
    
    print_success "Database setup completed"
}

# Application deployment
deploy_applications() {
    if [[ "$SKIP_DEPLOY" == "true" ]]; then
        print_warning "Skipping application deployment"
        return
    fi
    
    print_step "Deploying applications to Azure App Service"
    
    local web_app_name="econeura-${ENVIRONMENT}-web"
    local api_app_name="econeura-${ENVIRONMENT}-api"
    
    # Deploy web application
    print_info "Deploying web application to: $web_app_name"
    if [[ "$DRY_RUN" != "true" ]]; then
        # Create deployment package
        cd "$PROJECT_ROOT/apps/web"
        zip -r "../web-deploy.zip" .next/ public/ package.json next.config.js
        
        # Deploy to Azure
        az webapp deployment source config-zip \
            --resource-group "$RESOURCE_GROUP" \
            --name "$web_app_name" \
            --src "../web-deploy.zip"
            
        rm "../web-deploy.zip"
    else
        print_info "[DRY RUN] Would deploy web app to $web_app_name"
    fi
    
    # Deploy API application
    print_info "Deploying API application to: $api_app_name"
    if [[ "$DRY_RUN" != "true" ]]; then
        # Create deployment package
        cd "$PROJECT_ROOT/apps/api"
        zip -r "../api-deploy.zip" dist/ package.json
        
        # Deploy to Azure
        az webapp deployment source config-zip \
            --resource-group "$RESOURCE_GROUP" \
            --name "$api_app_name" \
            --src "../api-deploy.zip"
            
        rm "../api-deploy.zip"
    else
        print_info "[DRY RUN] Would deploy API app to $api_app_name"
    fi
    
    print_success "Application deployment completed"
}

# Health checks
run_health_checks() {
    print_step "Running deployment health checks"
    
    local web_url="https://econeura-${ENVIRONMENT}-web.azurewebsites.net"
    local api_url="https://econeura-${ENVIRONMENT}-api.azurewebsites.net"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_info "[DRY RUN] Would run health checks on:"
        print_info "  Web: $web_url/api/health"
        print_info "  API: $api_url/api/health"
        return
    fi
    
    # Wait for applications to start
    print_info "Waiting for applications to start..."
    sleep 60
    
    # Check web application
    print_info "Checking web application health..."
    if curl -f -s "$web_url/api/health" > /dev/null; then
        print_success "Web application is healthy"
    else
        print_error "Web application health check failed"
    fi
    
    # Check API application
    print_info "Checking API application health..."
    if curl -f -s "$api_url/api/health" > /dev/null; then
        print_success "API application is healthy"
    else
        print_error "API application health check failed"
    fi
    
    print_success "Health checks completed"
}

# Deployment summary
print_deployment_summary() {
    print_step "Deployment Summary"
    
    echo ""
    print_info "ECONEURA Deployment Completed Successfully! 🎉"
    echo ""
    print_info "Environment: $ENVIRONMENT"
    print_info "Resource Group: $RESOURCE_GROUP"
    print_info "Location: $LOCATION"
    echo ""
    print_info "Application URLs:"
    print_info "  Web Application: https://econeura-${ENVIRONMENT}-web.azurewebsites.net"
    print_info "  API Application: https://econeura-${ENVIRONMENT}-api.azurewebsites.net"
    echo ""
    print_info "Next Steps:"
    print_info "  1. Configure custom domain names (if applicable)"
    print_info "  2. Set up SSL certificates"
    print_info "  3. Configure monitoring alerts"
    print_info "  4. Verify all integrations are working"
    print_info "  5. Run end-to-end tests"
    echo ""
    print_info "Deployment log: $DEPLOYMENT_LOG"
    echo ""
}

# Confirmation prompt
confirm_deployment() {
    if [[ "$FORCE_DEPLOY" == "true" || "$DRY_RUN" == "true" ]]; then
        return
    fi
    
    echo ""
    print_warning "DEPLOYMENT CONFIRMATION"
    print_info "Environment: $ENVIRONMENT"
    print_info "Subscription: $SUBSCRIPTION_ID"
    print_info "Resource Group: $RESOURCE_GROUP"
    print_info "Location: $LOCATION"
    echo ""
    
    read -p "Do you want to proceed with the deployment? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "Deployment cancelled by user"
        exit 0
    fi
}

# Main execution
main() {
    # Setup logging
    exec 1> >(tee -a "$DEPLOYMENT_LOG")
    exec 2> >(tee -a "$DEPLOYMENT_LOG" >&2)
    
    print_step "Starting ECONEURA deployment"
    print_info "Deployment started at: $(date)"
    
    validate_requirements
    confirm_deployment
    setup_azure
    deploy_infrastructure
    build_applications
    setup_database
    deploy_applications
    run_health_checks
    print_deployment_summary
    
    print_success "🚀 ECONEURA deployment completed successfully!"
    print_info "Total deployment time: $SECONDS seconds"
}

# Error handling
trap 'print_error "Deployment failed! Check $DEPLOYMENT_LOG for details."; exit 1' ERR

# Execute main function
main "$@"
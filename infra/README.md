# ECONEURA Azure Infrastructure

This directory contains the Azure infrastructure as code (IaC) for the ECONEURA platform.

## 🏗️ Architecture Overview

The infrastructure is designed for high availability, security, and EU data residency compliance.

### Core Components

- **Azure Container Registry (ACR)**: Private container registry for application images
- **Azure Container Apps**: Serverless container platform for API and Web applications
- **Azure PostgreSQL Flexible Server**: Managed PostgreSQL database with private networking
- **Azure Key Vault**: Secure secret management
- **Azure Application Insights**: Application monitoring and telemetry
- **Azure Front Door**: Global load balancer with WAF and CDN
- **Azure Functions**: Serverless compute for background jobs
- **Virtual Network**: Private networking for database and container apps

### Network Architecture

```
Internet
    ↓
Azure Front Door (WAF + CDN)
    ↓
Container Apps Environment
    ├── API Container App
    └── Web Container App
    ↓
Virtual Network
    ├── PostgreSQL Flexible Server (Private)
    └── Private DNS Zone
```

## 📁 Files Structure

```
infra/
├── main.bicep              # Main infrastructure template
├── azure-pipelines.yml     # Azure DevOps pipeline
└── README.md              # This file
```

## 🚀 Deployment

### Prerequisites

1. **Azure CLI** installed and authenticated
2. **Bicep CLI** installed (`az bicep install`)
3. **Resource Group** created in West Europe
4. **Azure Service Principal** with appropriate permissions

### Required Secrets

The following secrets must be configured in your CI/CD system:

#### Azure Authentication
- `AZURE_CLIENT_ID`: Service Principal Client ID
- `AZURE_TENANT_ID`: Azure Tenant ID
- `AZURE_SUBSCRIPTION_ID`: Azure Subscription ID

#### Application Secrets
- `DOMAIN_NAME`: Custom domain name (e.g., `econeura.com`)
- `POSTGRES_PASSWORD`: PostgreSQL admin password
- `MISTRAL_BASE_URL`: Local Mistral AI endpoint
- `AZURE_OPENAI_ENDPOINT`: Azure OpenAI endpoint
- `AZURE_OPENAI_API_KEY`: Azure OpenAI API key
- `AZURE_CLIENT_SECRET`: Service Principal Client Secret
- `MAKE_WEBHOOK_HMAC_SECRET`: HMAC secret for Make webhooks
- `MAKE_ALLOWED_IPS`: Comma-separated list of allowed IPs

#### Container Registry
- `ACR_USERNAME`: ACR admin username
- `ACR_PASSWORD`: ACR admin password

#### Notifications
- `TEAMS_WEBHOOK_URL`: Microsoft Teams webhook URL

### Manual Deployment

```bash
# Set environment variables
export ENVIRONMENT="staging"
export RESOURCE_GROUP="econeura-rg"
export LOCATION="West Europe"

# Deploy infrastructure
az deployment group create \
  --resource-group $RESOURCE_GROUP \
  --template-file main.bicep \
  --parameters \
    environment=$ENVIRONMENT \
    location=$LOCATION \
    domainName="your-domain.com" \
    enableFrontDoor=true \
    enableACR=true \
    enableKeyVault=true \
    enableAppInsights=true \
    enablePostgreSQL=true \
    enableFunctions=true \
    enableContainerApps=true \
  --verbose
```

### CI/CD Deployment

#### GitHub Actions

The deployment is automated via GitHub Actions workflow (`.github/workflows/deploy.yml`):

1. **Infrastructure Deployment**: Deploys Azure resources using Bicep
2. **Build and Push Images**: Builds and pushes container images to ACR
3. **Application Deployment**: Updates Container Apps with new images
4. **Database Migration**: Runs database migrations
5. **Smoke Tests**: Validates deployment with health checks
6. **Performance Tests**: Runs performance tests (production only)
7. **Notifications**: Sends deployment notifications

#### Azure DevOps

Alternative deployment using Azure Pipelines (`azure-pipelines.yml`):

- Multi-stage pipeline with approval gates
- Integrated with Azure DevOps environments
- Built-in security scanning and compliance

## 🔧 Configuration

### Environment-Specific Settings

| Environment | Container Apps | PostgreSQL | Front Door | Functions |
|-------------|----------------|------------|------------|-----------|
| dev         | 1 replica      | B1ms       | Disabled   | Consumption |
| staging     | 2 replicas     | B1ms       | Enabled    | Consumption |
| prod        | 3-10 replicas  | B2ms       | Enabled    | Premium    |

### Scaling Configuration

#### Container Apps
- **API**: 1-10 replicas, HTTP-based scaling
- **Web**: 1-5 replicas, HTTP-based scaling
- **CPU**: 0.5 cores per replica
- **Memory**: 1GB per replica

#### PostgreSQL
- **Dev/Staging**: Burstable B1ms (1 vCore, 2GB RAM)
- **Production**: Burstable B2ms (2 vCores, 4GB RAM)
- **Storage**: 32GB with auto-scaling
- **Backup**: 7 days retention

### Security Configuration

#### Network Security
- **Private Endpoints**: PostgreSQL database
- **VNet Integration**: Container Apps and Functions
- **NSG Rules**: Restrictive inbound rules
- **WAF**: Azure Front Door with OWASP rules

#### Access Control
- **RBAC**: Role-based access control on all resources
- **Managed Identity**: Container Apps use managed identities
- **Key Vault**: Centralized secret management
- **Private DNS**: Internal name resolution

## 📊 Monitoring

### Application Insights
- **Performance Monitoring**: Response times, throughput
- **Error Tracking**: Exception monitoring and alerting
- **User Analytics**: User behavior and usage patterns
- **Custom Metrics**: Business-specific metrics

### Log Analytics
- **Centralized Logging**: All application and infrastructure logs
- **Query Capabilities**: KQL for log analysis
- **Retention**: 30 days for operational logs

### Alerts
- **Availability**: 99.9% SLA monitoring
- **Performance**: Response time thresholds
- **Errors**: Error rate monitoring
- **Cost**: Budget alerts and spending limits

## 🔄 Maintenance

### Backup Strategy
- **Database**: Automated daily backups with 7-day retention
- **Configuration**: Infrastructure as Code in Git
- **Application Data**: Container images in ACR

### Update Strategy
- **Infrastructure**: Blue-green deployment for major changes
- **Applications**: Rolling updates with health checks
- **Database**: Zero-downtime migrations

### Disaster Recovery
- **RTO**: 4 hours (infrastructure recreation)
- **RPO**: 24 hours (database backup)
- **Backup Location**: Same region (EU compliance)

## 💰 Cost Optimization

### Resource Sizing
- **Development**: Minimal resources for cost efficiency
- **Staging**: Medium resources for testing
- **Production**: Optimized for performance and availability

### Cost Monitoring
- **Budget Alerts**: Monthly spending limits
- **Resource Optimization**: Right-sizing recommendations
- **Reserved Instances**: Long-term commitments for cost savings

### Estimated Monthly Costs (West Europe)

| Environment | Estimated Cost |
|-------------|----------------|
| dev         | €50-100        |
| staging     | €150-300       |
| prod        | €500-1000      |

*Costs vary based on usage and scaling*

## 🔒 Compliance

### EU Data Residency
- **Region**: West Europe (Netherlands)
- **Data Storage**: All data stored within EU
- **Processing**: All compute within EU
- **Backup**: Same region backup storage

### Security Standards
- **ISO 27001**: Information security management
- **SOC 2**: Security, availability, and confidentiality
- **GDPR**: Data protection and privacy compliance

### Audit and Governance
- **Activity Logs**: All administrative actions logged
- **Resource Locks**: Prevent accidental deletion
- **Tagging**: Resource organization and cost allocation
- **Policy Enforcement**: Azure Policy for compliance

## 🚨 Troubleshooting

### Common Issues

#### Container Apps Not Starting
```bash
# Check container app logs
az containerapp logs show \
  --name econeura-staging-api \
  --resource-group econeura-rg \
  --follow
```

#### Database Connection Issues
```bash
# Test database connectivity
az postgres flexible-server execute \
  --name econeura-staging-psql \
  --resource-group econeura-rg \
  --querytext "SELECT version();"
```

#### Front Door Routing Issues
```bash
# Check Front Door health
az network front-door backend-pool health-probe show \
  --name api-health-probe \
  --resource-group econeura-rg \
  --front-door-name econeura-staging-fd
```

### Support Resources
- **Azure Documentation**: [docs.microsoft.com/azure](https://docs.microsoft.com/azure)
- **Bicep Documentation**: [docs.microsoft.com/azure/azure-resource-manager/bicep](https://docs.microsoft.com/azure/azure-resource-manager/bicep)
- **Container Apps**: [docs.microsoft.com/azure/container-apps](https://docs.microsoft.com/azure/container-apps)
- **PostgreSQL Flexible Server**: [docs.microsoft.com/azure/postgresql/flexible-server](https://docs.microsoft.com/azure/postgresql/flexible-server)

# 🏗️ ECONEURA Azure Infrastructure

## Mediterranean CRM+ERP+AI System - Azure Deployment Infrastructure

This directory contains all the necessary infrastructure-as-code (IaC) templates, scripts, and configuration files for deploying ECONEURA to Microsoft Azure.

### 📁 Directory Structure

```
infrastructure/azure/
├── bicep/                      # Bicep templates for infrastructure
│   ├── main.bicep             # Main infrastructure template
│   ├── parameters.dev.json    # Development environment parameters
│   ├── parameters.staging.json # Staging environment parameters
│   └── parameters.prod.json   # Production environment parameters
├── scripts/                   # Deployment and management scripts
│   ├── setup-keyvault-secrets.sh   # Key Vault secrets setup (Bash)
│   └── setup-keyvault-secrets.ps1  # Key Vault secrets setup (PowerShell)
├── monitoring/                # Monitoring and alerting configuration
│   └── alert-rules.json      # Application Insights alert rules
├── templates/                 # ARM templates (if needed)
└── README.md                 # This file
```

## 🚀 Quick Deployment

### Prerequisites

- Azure CLI installed and logged in
- Appropriate Azure subscription permissions
- Bicep CLI installed (comes with Azure CLI 2.20+)

### One-Command Infrastructure Deployment

```bash
# Deploy to development
az deployment group create \
  --resource-group econeura-dev-rg \
  --template-file bicep/main.bicep \
  --parameters bicep/parameters.dev.json

# Deploy to production
az deployment group create \
  --resource-group econeura-prod-rg \
  --template-file bicep/main.bicep \
  --parameters bicep/parameters.prod.json
```

## 🏗️ Infrastructure Components

### Core Resources

| Resource | Type | Purpose | Environment Scaling |
|----------|------|---------|-------------------|
| **App Service Plan** | Microsoft.Web/serverfarms | Hosts web and API applications | B2 (dev) → P1v3 (prod) |
| **PostgreSQL Server** | Microsoft.DBforPostgreSQL/flexibleServers | Primary database | B1ms (dev) → D2s_v3 (prod) |
| **Key Vault** | Microsoft.KeyVault/vaults | Secrets and certificate management | Standard (all environments) |
| **Application Insights** | Microsoft.Insights/components | Monitoring and analytics | Standard (all environments) |
| **Storage Account** | Microsoft.Storage/storageAccounts | File storage and backups | LRS (dev) → GRS (prod) |

### Security Features

- **Managed Identity**: Apps use system-assigned managed identities
- **Key Vault Integration**: All sensitive configuration via Key Vault references
- **Network Security**: Private endpoints and firewall rules
- **SSL/TLS**: HTTPS only with minimum TLS 1.2
- **RBAC**: Role-based access control for all resources

### High Availability Features (Production)

- **Zone Redundancy**: Database and App Service across availability zones
- **Geo-Redundant Storage**: Automatic geographic replication
- **Auto-scaling**: Horizontal and vertical scaling capabilities
- **Backup Strategy**: Automated daily backups with 35-day retention

## 🔐 Security Configuration

### Key Vault Secrets

The following secrets are automatically managed:

```bash
# Authentication secrets
jwt-secret-{environment}
nextauth-secret-{environment}
postgres-admin-password

# AI integration
openai-api-key

# Caching and sessions
redis-password-{environment}

# Webhook security
webhook-secret-{environment}

# Database connection
database-url-{environment}
```

### Managed Identity Permissions

Each App Service is granted the following Key Vault permissions:
- **Secrets**: Get, List
- **Certificates**: Get, List (if applicable)

### Network Security

- **Application Gateway**: Web Application Firewall (WAF) in production
- **Private Endpoints**: Database and Key Vault in production
- **Network Security Groups**: Restrictive inbound/outbound rules
- **Azure Front Door**: Global load balancing and DDoS protection

## 📊 Monitoring & Observability

### Application Insights Configuration

```json
{
  "components": [
    {
      "name": "Request Monitoring",
      "features": ["Auto-collection", "Dependency tracking", "Performance counters"]
    },
    {
      "name": "Custom Business Events",
      "features": ["CRM activities", "ERP transactions", "AI usage metrics"]
    },
    {
      "name": "Exception Tracking", 
      "features": ["Unhandled exceptions", "Custom error events", "Stack traces"]
    }
  ]
}
```

### Pre-configured Alerts

| Alert Name | Condition | Severity | Recipients |
|------------|-----------|----------|------------|
| High Error Rate | >5% errors in 5 min | Medium | DevOps, Support |
| Database Connection Issues | >3 DB failures in 5 min | High | DBA, DevOps |
| Performance Degradation | >2s avg response time | Low | Performance Team |
| Security Events | Any security event | Critical | Security Team, Management |
| Memory Usage Critical | <100MB available | High | Infrastructure Team |

### Custom Dashboards

1. **Operations Dashboard**
   - Request rates and response times
   - Error rates and exception tracking
   - Database performance metrics
   - Resource utilization (CPU, memory)

2. **Business Intelligence Dashboard**
   - User activity patterns
   - CRM conversion metrics
   - ERP transaction volumes
   - AI usage and cost tracking

3. **Security Dashboard**
   - Authentication events
   - Failed login attempts
   - Suspicious activity patterns
   - Compliance metrics

## 🌍 Multi-Environment Strategy

### Environment Differences

| Feature | Development | Staging | Production |
|---------|------------|---------|------------|
| **Compute** | B2 App Service | P1v3 App Service | P1v3+ with auto-scaling |
| **Database** | B1ms single-zone | GP 2-core multi-zone | GP 4-core zone-redundant |
| **Storage** | LRS (local redundant) | ZRS (zone redundant) | GRS (geo-redundant) |
| **Backup** | 7-day retention | 30-day retention | 35-day retention |
| **Monitoring** | Basic | Standard | Premium with custom alerts |
| **SSL** | App Service Managed | App Service Managed | Custom certificate |
| **Domain** | *.azurewebsites.net | staging.econeura.com | econeura.com |

### Environment Promotion

```bash
# Promote from dev to staging
az deployment group create \
  --resource-group econeura-staging-rg \
  --template-file bicep/main.bicep \
  --parameters bicep/parameters.staging.json \
  --parameters imageTag=latest

# Promote from staging to production
az deployment group create \
  --resource-group econeura-prod-rg \
  --template-file bicep/main.bicep \
  --parameters bicep/parameters.prod.json \
  --parameters imageTag=v1.2.3
```

## 📋 Deployment Checklist

### Pre-Deployment

- [ ] Azure CLI authenticated with appropriate subscription
- [ ] Resource groups created with proper naming convention
- [ ] Service principal configured for GitHub Actions
- [ ] Domain names registered and DNS configured (production)
- [ ] SSL certificates obtained (production)

### Infrastructure Deployment

- [ ] Bicep templates validated locally
- [ ] Parameter files updated with environment-specific values
- [ ] Key Vault secrets configured
- [ ] Managed identities configured
- [ ] Network security rules validated

### Post-Deployment Validation

- [ ] All resources provisioned successfully
- [ ] Database connectivity verified
- [ ] Key Vault access working
- [ ] Application Insights receiving telemetry
- [ ] Health endpoints responding
- [ ] SSL certificates installed and validated

### Production Readiness

- [ ] WAF policies configured and tested
- [ ] Backup and restore procedures tested
- [ ] Disaster recovery plan validated
- [ ] Monitoring alerts configured and tested
- [ ] Security scanning completed
- [ ] Performance testing completed
- [ ] Documentation updated

## 🔧 Advanced Configuration

### Custom Domain Setup

```bash
# Add custom domain
az webapp config hostname add \
  --resource-group econeura-prod-rg \
  --webapp-name econeura-prod-web \
  --hostname www.econeura.com

# Bind SSL certificate
az webapp config ssl bind \
  --resource-group econeura-prod-rg \
  --name econeura-prod-web \
  --certificate-thumbprint YOUR_CERT_THUMBPRINT \
  --ssl-type SNI
```

### Auto-scaling Configuration

```bash
# Configure auto-scaling rules
az monitor autoscale create \
  --resource-group econeura-prod-rg \
  --resource econeura-prod-plan \
  --resource-type Microsoft.Web/serverfarms \
  --name econeura-autoscale \
  --min-count 2 \
  --max-count 10 \
  --count 2

# Add CPU-based scale rule
az monitor autoscale rule create \
  --resource-group econeura-prod-rg \
  --autoscale-name econeura-autoscale \
  --scale-out 2 \
  --condition "Percentage CPU > 70 avg 5m"
```

### Database Performance Tuning

```bash
# Configure database parameters
az postgres flexible-server parameter set \
  --resource-group econeura-prod-rg \
  --server-name econeura-prod-postgres \
  --name shared_preload_libraries \
  --value "pg_stat_statements"

# Enable Query Store
az postgres flexible-server parameter set \
  --resource-group econeura-prod-rg \
  --server-name econeura-prod-postgres \
  --name pg_qs.query_capture_mode \
  --value TOP
```

## 🚨 Disaster Recovery

### Backup Strategy

1. **Database Backups**
   - Automated daily backups
   - Point-in-time recovery (35 days in production)
   - Cross-region geo-redundant backups

2. **Application Backups**
   - Infrastructure-as-Code templates in Git
   - Application code in Git repositories
   - Configuration in Key Vault (backed up)

3. **Data Backups**
   - File storage geo-replicated
   - Database transaction log backups
   - Application Insights data retention

### Recovery Procedures

```bash
# Database recovery
az postgres flexible-server restore \
  --resource-group econeura-prod-rg \
  --name econeura-restored \
  --source-server econeura-prod-postgres \
  --restore-time "2024-01-15T10:00:00Z"

# Cross-region deployment
az deployment group create \
  --resource-group econeura-dr-rg \
  --template-file bicep/main.bicep \
  --parameters bicep/parameters.dr.json \
  --parameters location="East US 2"
```

### Business Continuity Testing

- **Monthly**: Backup verification and restore testing
- **Quarterly**: Full disaster recovery simulation
- **Annually**: Business continuity plan review and update

## 🔍 Troubleshooting

### Common Issues

#### Bicep Deployment Failures

```bash
# Check deployment status
az deployment group show \
  --resource-group econeura-dev-rg \
  --name DEPLOYMENT_NAME

# Get deployment logs
az deployment operation group list \
  --resource-group econeura-dev-rg \
  --name DEPLOYMENT_NAME
```

#### Key Vault Access Issues

```bash
# Check access policies
az keyvault show \
  --name econeura-dev-kv \
  --query properties.accessPolicies

# Verify managed identity
az webapp identity show \
  --resource-group econeura-dev-rg \
  --name econeura-dev-web
```

#### Database Connection Problems

```bash
# Check firewall rules
az postgres flexible-server firewall-rule list \
  --resource-group econeura-dev-rg \
  --server-name econeura-dev-postgres

# Test connectivity
az postgres flexible-server connect \
  --name econeura-dev-postgres \
  --admin-user econeura_admin \
  --database-name econeura_db
```

### Support Resources

- **Azure Support**: Premium support plan recommended for production
- **Documentation**: [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- **Community**: Azure GitHub repositories and Stack Overflow
- **Monitoring**: Application Insights and Azure Monitor dashboards

---

## 📞 Contact Information

For infrastructure-related questions or support:

- **Infrastructure Team**: infrastructure@econeura.com
- **DevOps Lead**: devops@econeura.com  
- **Security Team**: security@econeura.com
- **On-call Support**: +1-xxx-xxx-xxxx (production issues only)

---

**Last Updated**: $(date +"%Y-%m-%d")  
**Version**: 1.0.0  
**Maintained by**: ECONEURA DevOps Team
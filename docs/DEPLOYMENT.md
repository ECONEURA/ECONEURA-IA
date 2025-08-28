# 🚀 ECONEURA Azure Deployment Guide

## Mediterranean CRM+ERP+AI System - Complete Production Deployment

### 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Infrastructure Setup](#infrastructure-setup)
5. [Application Deployment](#application-deployment)
6. [Monitoring & Alerts](#monitoring--alerts)
7. [Security Configuration](#security-configuration)
8. [Troubleshooting](#troubleshooting)
9. [Maintenance & Updates](#maintenance--updates)

---

## 🌟 Overview

ECONEURA is a comprehensive Mediterranean-themed CRM+ERP+AI system built with:

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Express.js with TypeScript, Prisma ORM
- **Database**: PostgreSQL with multi-tenant architecture
- **AI**: OpenAI GPT-4 integration with FinOps controls
- **Infrastructure**: Azure App Service, Key Vault, Application Insights
- **CI/CD**: GitHub Actions with automated testing and deployment
- **Monitoring**: Application Insights, custom dashboards, alerting

### 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Azure Infrastructure                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Web App   │  │   API App   │  │ PostgreSQL  │         │
│  │  (Next.js)  │  │ (Express)   │  │  Flexible   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                │                 │                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Key Vault   │  │App Insights │  │   Storage   │         │
│  │ (Secrets)   │  │(Monitoring) │  │  Account    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

### Required Software

- **Azure CLI** 2.50+ ([Installation Guide](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli))
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/))
- **Docker** (optional, for containerized deployment)

### Azure Requirements

- Azure subscription with appropriate permissions
- Service Principal for GitHub Actions (recommended)
- Resource group creation permissions
- Key Vault access permissions

### Environment Setup

```bash
# Verify installations
az --version
node --version
npm --version
git --version

# Login to Azure
az login
az account list
az account set --subscription "your-subscription-id"
```

---

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/your-org/econeura.git
cd econeura

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Configure your environment variables
nano .env.local
```

### 2. One-Command Deployment

```bash
# Deploy to development environment
./scripts/deploy.sh -e dev -s "your-subscription-id"

# Deploy to production (requires confirmation)
./scripts/deploy.sh -e prod -s "your-subscription-id"

# Dry run to see what would be deployed
./scripts/deploy.sh -e dev -s "your-subscription-id" --dry-run
```

### 3. Verify Deployment

After deployment, your applications will be available at:

- **Web**: `https://econeura-{environment}-web.azurewebsites.net`
- **API**: `https://econeura-{environment}-api.azurewebsites.net`

---

## 🏗️ Infrastructure Setup

### Manual Infrastructure Deployment

If you prefer to deploy infrastructure separately:

```bash
# Create resource group
az group create \
  --name "econeura-dev-rg" \
  --location "West Europe"

# Deploy infrastructure
az deployment group create \
  --resource-group "econeura-dev-rg" \
  --template-file infrastructure/azure/bicep/main.bicep \
  --parameters infrastructure/azure/bicep/parameters.dev.json
```

### Infrastructure Components

| Component | Purpose | SKU/Tier |
|-----------|---------|----------|
| App Service Plan | Hosts web and API apps | B2 (dev), P1v3 (prod) |
| PostgreSQL Flexible Server | Database | B1ms (dev), D2s_v3 (prod) |
| Key Vault | Secrets management | Standard |
| Application Insights | Monitoring | Standard |
| Storage Account | File uploads | Standard_LRS (dev), Standard_GRS (prod) |

### Environment Differences

| Feature | Development | Staging | Production |
|---------|------------|---------|------------|
| High Availability | ❌ | ✅ | ✅ |
| Geo-Redundant Backup | ❌ | ❌ | ✅ |
| Auto-scaling | ❌ | ✅ | ✅ |
| SSL Certificates | Self-signed | Let's Encrypt | Custom/Wildcard |
| Monitoring Retention | 30 days | 60 days | 90 days |

---

## 🔐 Security Configuration

### Key Vault Setup

```bash
# Run the Key Vault setup script
./infrastructure/azure/scripts/setup-keyvault-secrets.sh \
  -e dev \
  -s "your-subscription-id"

# Or use PowerShell version
./infrastructure/azure/scripts/setup-keyvault-secrets.ps1 \
  -Environment dev \
  -SubscriptionId "your-subscription-id"
```

### Required Secrets

The following secrets are automatically generated:

- `jwt-secret-{environment}`: JWT signing key
- `postgres-admin-password`: Database admin password
- `nextauth-secret-{environment}`: NextAuth signing key
- `redis-password-{environment}`: Redis authentication
- `webhook-secret-{environment}`: Webhook signature validation
- `database-url-{environment}`: Complete database connection string

**Manual Secret (Required):**
- `openai-api-key`: Your OpenAI API key (entered during setup)

### App Service Configuration

Applications are configured with managed identities and Key Vault references:

```bash
# Example Key Vault reference in App Settings
DATABASE_URL=@Microsoft.KeyVault(SecretUri=https://your-kv.vault.azure.net/secrets/database-url-dev/)
```

---

## 📊 Monitoring & Alerts

### Application Insights Setup

Application Insights is automatically configured with:

- **Request tracking**: HTTP requests, response times, failure rates
- **Dependency tracking**: Database calls, external API calls
- **Exception tracking**: Unhandled exceptions and errors
- **Custom events**: Business logic events and user activities
- **Performance counters**: CPU, memory, and custom metrics

### Pre-configured Alerts

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| High Error Rate | >5% errors in 5 min | Medium | Email + Slack |
| Database Issues | >3 DB failures in 5 min | High | Email |
| High Response Time | >2s avg response time | Low | Email |
| Memory Critical | <100MB available | High | Email |
| Security Events | Any security event | Critical | Email + SMS |

### Custom Dashboards

Access pre-built dashboards:

1. **Operations Dashboard**: Request rates, errors, performance
2. **Business Metrics**: User activity, CRM/ERP transactions
3. **Security Dashboard**: Authentication, authorization events

### Setting Up Alerts

```bash
# Deploy monitoring configuration
az monitor alert-rule create \
  --resource-group "econeura-dev-rg" \
  --name "ECONEURA High Error Rate" \
  --description "Alert when error rate exceeds 5%" \
  --condition "requests/failed GreaterThan 5 Percentage PT5M" \
  --action email admin@econeura.com
```

---

## 🚀 CI/CD Pipeline

### GitHub Actions Workflows

Two main workflows are configured:

1. **ci-cd.yml**: Main CI/CD pipeline
2. **infrastructure-deploy.yml**: Infrastructure-only deployments

### Workflow Triggers

| Workflow | Triggers | Environment |
|----------|----------|-------------|
| CI/CD | Push to `develop` | Development |
| CI/CD | Push to `main` | Staging |
| CI/CD | Manual dispatch (prod) | Production |
| Infrastructure | Manual dispatch | Any environment |

### Required GitHub Secrets

Configure these secrets in your GitHub repository:

```bash
# Azure credentials for each environment
AZURE_CREDENTIALS_DEV
AZURE_CREDENTIALS_STAGING  
AZURE_CREDENTIALS_PROD

# Shared secrets
AZURE_SUBSCRIPTION_ID
DATABASE_URL_DEV
DATABASE_URL_STAGING
DATABASE_URL_PROD
```

### Manual Deployment

```bash
# Trigger deployment via GitHub CLI
gh workflow run ci-cd.yml \
  --field environment=dev

# Or use the GitHub web interface
# Navigate to Actions > CI/CD Pipeline > Run workflow
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Deployment Failures

**Issue**: Bicep template validation errors
```bash
# Validate template
az deployment group validate \
  --resource-group "econeura-dev-rg" \
  --template-file infrastructure/azure/bicep/main.bicep \
  --parameters infrastructure/azure/bicep/parameters.dev.json
```

**Issue**: Key Vault access denied
```bash
# Check access policies
az keyvault show \
  --name "your-keyvault-name" \
  --query "properties.accessPolicies"

# Add access policy
az keyvault set-policy \
  --name "your-keyvault-name" \
  --object-id "your-object-id" \
  --secret-permissions get list
```

#### 2. Application Issues

**Issue**: Database connection failures
```bash
# Check database status
az postgres flexible-server show \
  --resource-group "econeura-dev-rg" \
  --name "econeura-dev-postgres"

# Check firewall rules
az postgres flexible-server firewall-rule list \
  --resource-group "econeura-dev-rg" \
  --server-name "econeura-dev-postgres"
```

**Issue**: Application won't start
```bash
# Check application logs
az webapp log tail \
  --resource-group "econeura-dev-rg" \
  --name "econeura-dev-web"

# Check application settings
az webapp config appsettings list \
  --resource-group "econeura-dev-rg" \
  --name "econeura-dev-web"
```

#### 3. Performance Issues

**Issue**: Slow response times
```bash
# Check Application Insights
az monitor app-insights query \
  --app "econeura-dev-insights" \
  --analytics-query "requests | summarize avg(duration) by bin(timestamp, 5m)"
```

### Debugging Commands

```bash
# Get deployment status
az deployment group list \
  --resource-group "econeura-dev-rg" \
  --query "[].{Name:name, State:properties.provisioningState}"

# Check resource health
az resource list \
  --resource-group "econeura-dev-rg" \
  --query "[].{Name:name, Type:type, Location:location}"

# Application logs
az webapp log download \
  --resource-group "econeura-dev-rg" \
  --name "econeura-dev-web" \
  --log-file "webapp-logs.zip"
```

---

## 🔄 Maintenance & Updates

### Regular Maintenance Tasks

#### Weekly
- [ ] Review Application Insights dashboards
- [ ] Check security alerts and logs
- [ ] Verify backup completion
- [ ] Update dependency vulnerabilities

#### Monthly  
- [ ] Rotate Key Vault secrets
- [ ] Review and optimize Azure costs
- [ ] Update application dependencies
- [ ] Performance optimization review

#### Quarterly
- [ ] Disaster recovery testing
- [ ] Security audit and penetration testing
- [ ] Database performance tuning
- [ ] Infrastructure scaling review

### Update Procedures

#### Application Updates

```bash
# Update to latest version
git pull origin main

# Run tests
npm test

# Deploy via CI/CD
gh workflow run ci-cd.yml --field environment=prod
```

#### Infrastructure Updates

```bash
# Update Bicep templates
git add infrastructure/azure/bicep/
git commit -m "Update infrastructure templates"

# Deploy infrastructure changes
./scripts/deploy.sh -e prod --skip-build --skip-deploy
```

#### Database Schema Updates

```bash
# Create new migration
npx prisma migrate dev --name "description-of-changes"

# Deploy to production
npx prisma migrate deploy
```

### Backup & Recovery

#### Database Backups

```bash
# Create manual backup
az postgres flexible-server backup create \
  --resource-group "econeura-prod-rg" \
  --server-name "econeura-prod-postgres" \
  --backup-name "manual-backup-$(date +%Y%m%d)"

# Restore from backup
az postgres flexible-server restore \
  --resource-group "econeura-prod-rg" \
  --name "econeura-restored" \
  --source-server "econeura-prod-postgres" \
  --restore-time "2024-01-15T10:00:00Z"
```

#### Application Backups

```bash
# Backup application settings
az webapp config backup create \
  --resource-group "econeura-prod-rg" \
  --webapp-name "econeura-prod-web" \
  --backup-name "config-backup-$(date +%Y%m%d)" \
  --container-url "https://yourstorage.blob.core.windows.net/backups"
```

---

## 📞 Support & Contact

### Emergency Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| DevOps Lead | devops@econeura.com | 24/7 |
| Security Team | security@econeura.com | Business hours |
| Database Admin | dba@econeura.com | On-call |

### Escalation Procedures

1. **P1 (Critical)**: System down, data loss
   - Contact DevOps Lead immediately
   - Create incident in monitoring system
   - Escalate to management after 30 minutes

2. **P2 (High)**: Performance degradation, partial outage
   - Create support ticket
   - Contact relevant team lead
   - Provide regular updates

3. **P3 (Medium)**: Non-critical issues
   - Standard support ticket
   - Business hours response expected

### Documentation & Resources

- **Architecture Documentation**: `/docs/ARCHITECTURE.md`
- **API Documentation**: `/docs/API.md`
- **Security Guidelines**: `/docs/SECURITY.md`
- **Development Guide**: `/docs/DEVELOPMENT.md`

---

## 🎯 Next Steps After Deployment

1. **Configure Custom Domain**
   - Purchase SSL certificates
   - Configure DNS records
   - Update CORS settings

2. **Performance Optimization**
   - Enable CDN for static assets
   - Configure caching policies
   - Optimize database queries

3. **Security Hardening**
   - Configure WAF rules
   - Set up DDoS protection
   - Enable advanced threat protection

4. **Business Configuration**
   - Create initial organizations and users
   - Configure AI Router settings
   - Set up integrations and webhooks

---

**🎉 Congratulations! ECONEURA is now deployed and ready for use!**

For additional support or questions, please contact our DevOps team or create an issue in the repository.
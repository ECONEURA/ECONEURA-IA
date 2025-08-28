# Production Deployment Guide

## Prerequisites

1. Azure subscription
2. Azure CLI installed
3. Terraform installed (>= 1.0)
4. GitHub repository with secrets configured

## Infrastructure Setup

### 1. Initialize Terraform

```bash
cd infrastructure/terraform
terraform init
```

### 2. Create terraform.tfvars

```hcl
tenant_id           = "your-azure-tenant-id"
db_admin_password   = "secure-password"
jwt_secret          = "your-jwt-secret"
jwt_refresh_secret  = "your-jwt-refresh-secret"
encryption_key      = "your-32-char-encryption-key"
```

### 3. Apply Infrastructure

```bash
terraform plan
terraform apply
```

## Application Deployment

### 1. Configure GitHub Secrets

Add these secrets to your GitHub repository:

- `AZURE_WEBAPP_PUBLISH_PROFILE_API`: API app publish profile
- `AZURE_WEBAPP_PUBLISH_PROFILE_WEB`: Web app publish profile
- `DATABASE_URL`: PostgreSQL connection string
- `SLACK_WEBHOOK`: Slack notification webhook (optional)

### 2. Initial Database Setup

```bash
# Connect to Azure PostgreSQL
psql -h psql-econeura-prod.postgres.database.azure.com \
     -U econeura_admin@psql-econeura-prod \
     -d econeura

# Run initial migration
npm run migrate:deploy

# Seed initial data
npm run seed
```

### 3. Deploy Applications

Push to main branch or manually trigger workflow:

```bash
gh workflow run deploy.yml
```

## Monitoring Setup

### 1. Application Insights

- Navigate to Azure Portal > Application Insights
- Configure alerts for:
  - Response time > 2s
  - Error rate > 1%
  - Availability < 99.9%

### 2. Database Monitoring

```sql
-- Enable query performance insights
ALTER DATABASE econeura SET log_statement = 'all';
ALTER DATABASE econeura SET log_duration = on;
```

### 3. Cost Monitoring

Set up budget alerts in Azure Cost Management:
- Monthly budget: €500
- Alert at 80% and 100%

## Backup Configuration

### 1. Database Backups

- Automated daily backups (30-day retention)
- Geo-redundant storage enabled
- Point-in-time recovery available

### 2. Application Backups

```bash
# Manual backup
az webapp config backup create \
  --resource-group rg-econeura-prod \
  --webapp-name app-econeura-api-prod \
  --backup-name "manual-backup-$(date +%Y%m%d)"
```

## Security Checklist

- [ ] SSL certificates configured
- [ ] Firewall rules configured
- [ ] Secrets in Key Vault
- [ ] RBAC permissions set
- [ ] Security Center recommendations reviewed
- [ ] DDoS protection enabled
- [ ] WAF rules configured

## Scaling Configuration

### Horizontal Scaling

```bash
# Scale out to 3 instances
az webapp scale \
  --resource-group rg-econeura-prod \
  --name app-econeura-api-prod \
  --instance-count 3
```

### Vertical Scaling

```bash
# Upgrade to P2v2
az appservice plan update \
  --resource-group rg-econeura-prod \
  --name asp-econeura-prod \
  --sku P2v2
```

## Rollback Procedure

1. **Application Rollback**
```bash
# Revert to previous slot
az webapp deployment slot swap \
  --resource-group rg-econeura-prod \
  --name app-econeura-api-prod \
  --slot staging \
  --target-slot production
```

2. **Database Rollback**
```bash
# Restore from point-in-time
az postgres flexible-server restore \
  --resource-group rg-econeura-prod \
  --name psql-econeura-prod-restored \
  --source-server psql-econeura-prod \
  --restore-time "2024-01-15T13:00:00Z"
```

## Performance Optimization

1. **Enable Redis caching**
2. **Configure CDN caching rules**
3. **Enable response compression**
4. **Optimize database indexes**
5. **Enable connection pooling**

## Maintenance Mode

```bash
# Enable maintenance mode
az webapp config appsettings set \
  --resource-group rg-econeura-prod \
  --name app-econeura-web-prod \
  --settings MAINTENANCE_MODE=true

# Disable maintenance mode
az webapp config appsettings set \
  --resource-group rg-econeura-prod \
  --name app-econeura-web-prod \
  --settings MAINTENANCE_MODE=false
```

## Support Contacts

- **Infrastructure**: infrastructure@econeura.com
- **Security**: security@econeura.com
- **On-call**: +34 900 123 456
- **Escalation**: cto@econeura.com
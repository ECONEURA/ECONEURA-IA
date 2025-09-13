# Azure Deployment Playbook

Guía completa para deployments en Azure App Service con estrategias de blue-green deployment.

## Índice

1. [DEV Environment](#dev-environment)
2. [Staging Environment](#staging-environment)
3. [Production Environment](#production-environment)
4. [Rollback Procedures](#rollback-procedures)
5. [Monitoring & Alerts](#monitoring--alerts)
6. [Troubleshooting](#troubleshooting)

---

## DEV Environment

### Overview
Environment de desarrollo para testing y validación de features antes de staging.

### Configuration

#### App Service Settings
```bash
# Environment variables
ENVIRONMENT=dev
LOG_LEVEL=debug
ENABLE_DEBUG_MODE=true
ENABLE_EXPERIMENTAL_FEATURES=true

# Feature flags
FEATURE_NEW_UI=false
FEATURE_AI_FEATURES=true
FEATURE_ANALYTICS=false
```

#### Deployment Strategy
- **Method**: ZIP run-from-package
- **Branch**: `dev`
- **Trigger**: Push to `dev` branch
- **Auto-deploy**: Enabled

#### Deployment Process

1. **Pre-deployment Checks**
   ```bash
   # Verify branch
   git branch --show-current  # Should be 'dev'
   
   # Run quality gates
   pnpm -w lint
   pnpm -w test
   pnpm -w build
   ```

2. **Deploy to DEV**
   ```bash
   # Push to dev branch (triggers auto-deploy)
   git push origin dev
   
   # Monitor deployment
   az webapp deployment list --name econeura-dev --resource-group econeura-rg
   ```

3. **Post-deployment Verification**
   ```bash
   # Health check
   curl https://econeura-dev.azurewebsites.net/health
   
   # Smoke tests
   pnpm k6:smoke
   
   # Check logs
   az webapp log tail --name econeura-dev --resource-group econeura-rg
   ```

#### Feature Flags (DEV)
```json
{
  "ENABLE_DEBUG_MODE": true,
  "ENABLE_EXPERIMENTAL_FEATURES": true,
  "ENABLE_AI_FEATURES": true,
  "ENABLE_NEW_UI": false,
  "ENABLE_ANALYTICS": false,
  "LOG_LEVEL": "debug"
}
```

#### Monitoring
- **Health Endpoint**: `/health`
- **Metrics**: Application Insights
- **Logs**: Azure Monitor
- **Alerts**: Email notifications for failures

---

## Staging Environment

### Overview
Environment de staging para validación final antes de producción.

### Configuration

#### App Service Settings
```bash
# Environment variables
ENVIRONMENT=staging
LOG_LEVEL=info
ENABLE_DEBUG_MODE=false
ENABLE_EXPERIMENTAL_FEATURES=false

# Feature flags
FEATURE_NEW_UI=true
FEATURE_AI_FEATURES=true
FEATURE_ANALYTICS=true
```

#### Deployment Strategy
- **Method**: Blue-Green with staging slot
- **Branch**: `main`
- **Trigger**: Manual or scheduled
- **Auto-deploy**: Disabled

#### Deployment Process

1. **Pre-deployment Checks**
   ```bash
   # Verify main branch
   git checkout main
   git pull origin main
   
   # Run full test suite
   pnpm -w lint
   pnpm -w test -- --coverage
   pnpm -w build
   pnpm e2e:ui
   ```

2. **Deploy to Staging Slot**
   ```bash
   # Deploy to staging slot
   az webapp deployment slot swap \
     --name econeura-staging \
     --resource-group econeura-rg \
     --slot staging \
     --target-slot production
   ```

3. **Validation**
   ```bash
   # Health check
   curl https://econeura-staging.azurewebsites.net/health
   
   # Full test suite
   pnpm e2e:ui
   pnpm k6:load
   ```

4. **Swap to Production**
   ```bash
   # Swap staging to production
   az webapp deployment slot swap \
     --name econeura-staging \
     --resource-group econeura-rg \
     --slot staging \
     --target-slot production
   ```

#### Feature Flags (Staging)
```json
{
  "ENABLE_DEBUG_MODE": false,
  "ENABLE_EXPERIMENTAL_FEATURES": false,
  "ENABLE_AI_FEATURES": true,
  "ENABLE_NEW_UI": true,
  "ENABLE_ANALYTICS": true,
  "LOG_LEVEL": "info"
}
```

---

## Production Environment

### Overview
Environment de producción con máxima estabilidad y performance.

### Configuration

#### App Service Settings
```bash
# Environment variables
ENVIRONMENT=production
LOG_LEVEL=warn
ENABLE_DEBUG_MODE=false
ENABLE_EXPERIMENTAL_FEATURES=false

# Feature flags
FEATURE_NEW_UI=true
FEATURE_AI_FEATURES=true
FEATURE_ANALYTICS=true
```

#### Deployment Strategy
- **Method**: Blue-Green with zero-downtime
- **Branch**: `main` (tagged releases)
- **Trigger**: Manual approval required
- **Auto-deploy**: Disabled

#### Deployment Process

1. **Release Preparation**
   ```bash
   # Create release tag
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   
   # Generate changelog
   pnpm changelog
   ```

2. **Deploy to Production**
   ```bash
   # Deploy to production slot
   az webapp deployment slot swap \
     --name econeura-prod \
     --resource-group econeura-rg \
     --slot staging \
     --target-slot production
   ```

3. **Post-deployment Monitoring**
   ```bash
   # Health check
   curl https://econeura-prod.azurewebsites.net/health
   
   # Performance tests
   pnpm k6:load
   pnpm k6:chaos
   ```

#### Feature Flags (Production)
```json
{
  "ENABLE_DEBUG_MODE": false,
  "ENABLE_EXPERIMENTAL_FEATURES": false,
  "ENABLE_AI_FEATURES": true,
  "ENABLE_NEW_UI": true,
  "ENABLE_ANALYTICS": true,
  "LOG_LEVEL": "warn"
}
```

---

## Rollback Procedures

### Automatic Rollback
- **Trigger**: Health check failures
- **Timeout**: 5 minutes
- **Action**: Revert to previous slot

### Manual Rollback

#### DEV Environment
```bash
# Revert to previous commit
git revert HEAD
git push origin dev
```

#### Staging Environment
```bash
# Swap back to previous slot
az webapp deployment slot swap \
  --name econeura-staging \
  --resource-group econeura-rg \
  --slot production \
  --target-slot staging
```

#### Production Environment
```bash
# Emergency rollback
az webapp deployment slot swap \
  --name econeura-prod \
  --resource-group econeura-rg \
  --slot production \
  --target-slot staging
```

---

## Monitoring & Alerts

### Health Checks
- **Endpoint**: `/health`
- **Frequency**: Every 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 3

### Metrics
- **Response Time**: < 2 seconds
- **Error Rate**: < 1%
- **CPU Usage**: < 80%
- **Memory Usage**: < 85%

### Alerts
- **Email**: ops@econeura.com
- **Slack**: #alerts-econeura
- **PagerDuty**: Critical alerts

---

## Troubleshooting

### Common Issues

#### Deployment Failures
```bash
# Check deployment logs
az webapp deployment list --name econeura-dev --resource-group econeura-rg

# Check application logs
az webapp log tail --name econeura-dev --resource-group econeura-rg
```

#### Performance Issues
```bash
# Check metrics
az monitor metrics list --resource econeura-dev --resource-group econeura-rg

# Scale up if needed
az webapp update --name econeura-dev --resource-group econeura-rg --sku S2
```

#### Health Check Failures
```bash
# Check health endpoint
curl -v https://econeura-dev.azurewebsites.net/health

# Check dependencies
curl -v https://econeura-dev.azurewebsites.net/health/dependencies
```

### Emergency Procedures

#### Complete Service Outage
1. Check Azure status page
2. Verify resource group status
3. Check application logs
4. Consider rollback to previous version
5. Scale up resources if needed

#### Data Issues
1. Check database connectivity
2. Verify backup status
3. Check data migration logs
4. Consider data restore if necessary

---

## Security Considerations

### Access Control
- **RBAC**: Role-based access control
- **Service Principals**: For automated deployments
- **Key Vault**: For secrets management

### Network Security
- **VNet Integration**: For private connectivity
- **Private Endpoints**: For database access
- **WAF**: Web Application Firewall

### Compliance
- **GDPR**: Data protection compliance
- **SOC 2**: Security controls
- **ISO 27001**: Information security management

---

## Contact Information

- **DevOps Team**: devops@econeura.com
- **On-Call**: +1-555-ECONEURA
- **Emergency**: ops@econeura.com
- **Slack**: #econeura-ops
# 🚀 ECONEURA Azure Deployment Guide

## Azure Configuration Requirements

### Constants (IMMUTABLE)
- **Resource Group**: `appsvc_linux_northeurope_basic`
- **Web App**: `econeura-web-dev`
- **Web FQDN**: `https://econeura-web-dev-dpehcua9augngbcb.northeurope-01.azurewebsites.net`
- **API App**: `econeura-api-dev`  
- **API URL**: `https://econeura-api-dev.azurewebsites.net`
- **Public Domain**: `https://www.econeura.com`
- **Runtime**: Node 20 LTS, HTTPS only, TLS≥1.2, HTTP/2

## 1. CORS Configuration (API App Service)

### Portal Steps:
1. Navigate to Azure Portal → App Services → `econeura-api-dev`
2. Go to **API** → **CORS**
3. **IMPORTANT**: Clear all existing origins
4. Add exactly these 2 origins:
   ```
   https://www.econeura.com
   https://econeura-web-dev-dpehcua9augngbcb.northeurope-01.azurewebsites.net
   ```
5. **DO NOT** check "Enable Access-Control-Allow-Credentials"
6. Click **Save**

### Verification:
```bash
curl -H "Origin: https://www.econeura.com" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: X-Requested-With" -X OPTIONS https://econeura-api-dev.azurewebsites.net/health
```

Expected headers in response:
```
Access-Control-Allow-Origin: https://www.econeura.com
```

## 2. Access Restrictions (API App Service)

### Portal Steps:
1. Navigate to Azure Portal → App Services → `econeura-api-dev`
2. Go to **Networking** → **Access restrictions**
3. **CRITICAL**: Set "Use same restrictions for SCM" = **On**
4. Configure main site restrictions:
   - **Default action**: Deny
   - Add allowed IPs/ranges (NO 0.0.0.0/0)
   - Example allowed ranges:
     ```
     10.0.0.0/8     (Private networks)
     172.16.0.0/12  (Private networks) 
     192.168.0.0/16 (Private networks)
     ```
5. Click **Save**

### Verification:
```bash
# Should fail from unauthorized IP
curl -I https://econeura-api-dev.azurewebsites.net/health

# Should work from authorized network
curl -I https://econeura-api-dev.azurewebsites.net/health
```

## 3. Application Settings (Web App Service)

### Portal Steps:
1. Navigate to Azure Portal → App Services → `econeura-web-dev`
2. Go to **Settings** → **Configuration** → **Application settings**
3. Add/Update these settings:
   ```
   NEXT_PUBLIC_API_URL=https://econeura-api-dev.azurewebsites.net
   NODE_ENV=production
   PORT=8080
   ```
4. Click **Save**
5. **IMPORTANT**: Click **Restart** after saving

### Verification:
```bash
curl https://econeura-web-dev-dpehcua9augngbcb.northeurope-01.azurewebsites.net/api/health
```

## 4. Health Check Configuration

### API App Service:
1. Navigate to Azure Portal → App Services → `econeura-api-dev`
2. Go to **Monitoring** → **Health check**
3. Enable health check: **On**
4. Health check path: `/health`
5. **Save**

### Web App Service:
1. Navigate to Azure Portal → App Services → `econeura-web-dev`
2. Go to **Monitoring** → **Health check**
3. Enable health check: **On**
4. Health check path: `/api/health`
5. **Save**

### Verification:
```bash
# API health (< 200ms)
time curl https://econeura-api-dev.azurewebsites.net/health

# Web health
curl https://econeura-web-dev-dpehcua9augngbcb.northeurope-01.azurewebsites.net/api/health
```

## 5. Application Insights Setup

### Create Application Insights:
1. Navigate to Azure Portal → Create a resource
2. Search for "Application Insights"
3. Create with these settings:
   - **Resource Group**: `appsvc_linux_northeurope_basic`
   - **Name**: `econeura-insights`
   - **Region**: North Europe
   - **Resource Mode**: Classic

### Connect to App Services:
1. For each App Service (`econeura-api-dev`, `econeura-web-dev`):
2. Go to **Settings** → **Application Insights**
3. **Turn on Application Insights**
4. Select existing resource: `econeura-insights`
5. **Apply**

### Availability Tests:
1. Navigate to Application Insights → `econeura-insights`
2. Go to **Availability**
3. **Add Classic test**:
   - **Test name**: `api-health-check`
   - **URL**: `https://econeura-api-dev.azurewebsites.net/health`
   - **Test frequency**: 1 minute
   - **Test locations**: Select 3-5 locations
4. **Add Classic test**:
   - **Test name**: `web-health-check`
   - **URL**: `https://econeura-web-dev-dpehcua9augngbcb.northeurope-01.azurewebsites.net/api/health`
   - **Test frequency**: 1 minute

## 6. Alerts Configuration

### Create Alert Rules:
1. Navigate to Application Insights → `econeura-insights`
2. Go to **Alerts** → **Alert rules** → **Create**

#### Availability Alert:
- **Signal**: Availability
- **Condition**: Less than 100%
- **Threshold**: 100%
- **Evaluation frequency**: 1 minute
- **Action**: Create action group for notifications

#### Performance Alert:
- **Signal**: Server response time
- **Condition**: Greater than 1500ms
- **Aggregation**: Average
- **Evaluation frequency**: 5 minutes

#### Error Rate Alert:
- **Signal**: Failed requests
- **Condition**: Greater than 5 requests per minute
- **Evaluation frequency**: 5 minutes

## 7. Deployment Slots (Optional)

### Create Staging Slot:
1. Navigate to App Service → **Deployment** → **Deployment slots**
2. **Add slot**:
   - **Name**: `staging`
   - **Clone settings from**: Production
3. Configure staging-specific settings
4. Use for blue/green deployments

## 8. Monitoring and Metrics

### Key Metrics to Monitor:
- **Response Time (p95)**: < 350ms for API, < 2.5s for AI
- **Availability**: > 99.9%
- **Error Rate**: < 1%
- **Memory Usage**: < 80%
- **CPU Usage**: < 80%

### Custom Metrics:
```javascript
// In application code
appInsights.trackMetric({
  name: "agent_execution_time",
  value: executionTimeMs,
  properties: {
    agentId: agentId,
    orgId: orgId
  }
});
```

## 9. Security Configuration

### TLS/SSL:
1. Navigate to App Service → **Settings** → **TLS/SSL settings**
2. **Minimum TLS version**: 1.2
3. **HTTPS Only**: On
4. **HTTP Version**: 2.0

### Authentication (if needed):
1. Navigate to App Service → **Settings** → **Authentication**
2. Configure Azure AD or other providers

## 10. Scaling Configuration

### Auto-scaling:
1. Navigate to App Service → **Settings** → **Scale out (App Service plan)**
2. **Enable autoscale**: On
3. Configure rules based on:
   - CPU percentage > 70%
   - Memory percentage > 80%
   - HTTP queue length > 100

## Verification Checklist

### ✅ CORS Verification:
```bash
# Test CORS preflight
curl -H "Origin: https://www.econeura.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://econeura-api-dev.azurewebsites.net/v1/agents
```

### ✅ Access Restrictions:
```bash
# Should return 403 from unauthorized IP
curl -I https://econeura-api-dev.azurewebsites.net/health
```

### ✅ Health Endpoints:
```bash
# API health (must be < 200ms)
time curl https://econeura-api-dev.azurewebsites.net/health

# Web health  
curl https://econeura-web-dev-dpehcua9augngbcb.northeurope-01.azurewebsites.net/api/health
```

### ✅ Agent System:
```bash
# List agents
curl https://econeura-api-dev.azurewebsites.net/v1/agents

# Execute agent
curl -X POST https://econeura-api-dev.azurewebsites.net/v1/agents/run \
  -H "Content-Type: application/json" \
  -H "X-Org-Id: test-org" \
  -H "X-User-Id: test-user" \
  -d '{
    "agentId": "lead-enrich",
    "inputs": {"companyName": "Test Company"},
    "context": {"orgId": "test-org", "userId": "test-user", "correlationId": "test-123"}
  }'
```

### ✅ Cockpit Dashboard:
```bash
# Overview
curl https://econeura-api-dev.azurewebsites.net/v1/cockpit/overview

# Agent stats
curl https://econeura-api-dev.azurewebsites.net/v1/cockpit/agents

# Cost breakdown
curl https://econeura-api-dev.azurewebsites.net/v1/cockpit/costs
```

### ✅ Headers Validation:
```bash
# Check FinOps headers in agent execution response
curl -I -X POST https://econeura-api-dev.azurewebsites.net/v1/agents/run \
  -H "Content-Type: application/json" \
  -H "X-Org-Id: test-org" \
  -d '{"agentId":"lead-enrich","inputs":{"companyName":"Test"},"context":{"orgId":"test-org","userId":"test","correlationId":"123"}}'
```

Expected headers:
- `X-Est-Cost-EUR`
- `X-Execution-Time-ms` 
- `X-Request-Id`
- `X-Org-Id`

## Troubleshooting

### Common Issues:

1. **CORS Errors**:
   - Verify exactly 2 origins in CORS settings
   - Check for trailing slashes
   - Clear browser cache

2. **Access Denied (403)**:
   - Check Access Restrictions configuration
   - Verify "Use same restrictions for SCM" is On
   - Check IP allowlist

3. **Health Check Failures**:
   - Verify `/health` endpoint returns 200
   - Check response time < 200ms
   - Ensure no database calls in health endpoint

4. **Slow Performance**:
   - Check Application Insights metrics
   - Review scaling configuration
   - Analyze database queries

5. **Agent Execution Failures**:
   - Check Application Insights logs
   - Verify agent registry initialization
   - Check Zod validation errors

## Production Readiness

Before going live:

1. ✅ All health checks passing
2. ✅ CORS configured correctly
3. ✅ Access restrictions in place
4. ✅ Monitoring and alerts active
5. ✅ Auto-scaling configured
6. ✅ All 60 agents registered and tested
7. ✅ Cockpit dashboard functional
8. ✅ Performance metrics within SLA
9. ✅ Security scan completed
10. ✅ Backup and disaster recovery plan

---

**Status**: Ready for deployment with all Azure requirements met.
**SLA Targets**: p95 API ≤ 350ms, Availability > 99.9%, Error rate < 1%
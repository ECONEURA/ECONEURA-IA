# Troubleshooting Guide - DEV Verification

## 🚨 Quick Diagnostics

### Health Check Commands

```bash
# 1. Basic connectivity
curl -I https://econeura-api-dev.azurewebsites.net/health

# 2. Detailed response
curl -v https://econeura-api-dev.azurewebsites.net/health

# 3. Check response time
curl -w "@curl-format.txt" -o /dev/null -s https://econeura-api-dev.azurewebsites.net/health
```

### System Diagnostics

```bash
# Check system resources
top -l 1 | head -10
vm_stat | head -5
df -h .

# Check network connectivity
ping -c 3 econeura-api-dev.azurewebsites.net
nslookup econeura-api-dev.azurewebsites.net
```

## 🔍 Error Code Reference

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | ✅ Success | Continue verification |
| 404 | ❌ Not Found | Check endpoint URL |
| 500 | ❌ Server Error | Check Azure App Service |
| 502 | ❌ Bad Gateway | Check Azure infrastructure |
| 503 | ❌ Service Unavailable | Check Azure scaling |
| 000 | ❌ Connection Failed | Check network/firewall |

### Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | ✅ Success | All checks passed |
| 1 | ❌ General Error | Check logs for details |
| 2 | ❌ Dependency Error | Run dependency check |
| 3 | ❌ Network Error | Check connectivity |
| 4 | ❌ Configuration Error | Check environment variables |

## 🛠️ Common Fixes

### 1. API Health Check Fails

**Problem:** Health endpoint returns 404/500

**Diagnosis:**
```bash
# Check if endpoint exists
curl -s https://econeura-api-dev.azurewebsites.net/health

# Check Azure App Service status
az webapp show --name econeura-api-dev --resource-group econeura-rg --query "state"

# Check application logs
az webapp log tail --name econeura-api-dev --resource-group econeura-rg
```

**Solutions:**
```bash
# 1. Restart App Service
az webapp restart --name econeura-api-dev --resource-group econeura-rg

# 2. Check deployment
az webapp deployment list --name econeura-api-dev --resource-group econeura-rg

# 3. Verify configuration
az webapp config show --name econeura-api-dev --resource-group econeura-rg
```

### 2. OpenAPI Specification Issues

**Problem:** OpenAPI diff fails or spec not found

**Diagnosis:**
```bash
# Check if OpenAPI endpoint exists
curl -s https://econeura-api-dev.azurewebsites.net/v1/openapi.json | jq '.info'

# Compare live vs snapshot
diff <(jq '.paths' .artifacts/openapi.live.json) <(jq '.paths' snapshots/openapi.runtime.json)
```

**Solutions:**
```bash
# 1. Update snapshot if changes are intentional
cp .artifacts/openapi.live.json snapshots/openapi.runtime.json

# 2. Check API versioning
curl -s https://econeura-api-dev.azurewebsites.net/v1/openapi.json | jq '.info.version'

# 3. Validate OpenAPI spec
npx swagger-parser validate .artifacts/openapi.live.json
```

### 3. CORS Configuration Problems

**Problem:** CORS preflight requests fail

**Diagnosis:**
```bash
# Test CORS manually
curl -X OPTIONS \
  -H "Origin: https://econeura-web-dev-dpehcua9augngbcb.northeurope-01.azurewebsites.net" \
  -H "Access-Control-Request-Method: GET" \
  -v https://econeura-api-dev.azurewebsites.net/health
```

**Solutions:**
```bash
# 1. Check CORS configuration in Azure
az webapp cors show --name econeura-api-dev --resource-group econeura-rg

# 2. Update CORS settings
az webapp cors add --name econeura-api-dev --resource-group econeura-rg \
  --allowed-origins "https://econeura-web-dev-dpehcua9augngbcb.northeurope-01.azurewebsites.net"

# 3. Check application CORS middleware
grep -r "cors" apps/api/src/
```

### 4. Security Headers Missing

**Problem:** CSP/HSTS headers not present

**Diagnosis:**
```bash
# Check headers
curl -I https://econeura-api-dev.azurewebsites.net/health | grep -i "content-security-policy\|strict-transport-security"
```

**Solutions:**
```bash
# 1. Check middleware configuration
grep -r "helmet\|csp\|hsts" apps/api/src/

# 2. Verify Azure configuration
az webapp config show --name econeura-api-dev --resource-group econeura-rg --query "siteConfig"

# 3. Check custom headers
az webapp config appsettings list --name econeura-api-dev --resource-group econeura-rg
```

### 5. FinOps Integration Issues

**Problem:** FinOps headers or 402 endpoint not working

**Diagnosis:**
```bash
# Check FinOps headers
curl -I https://econeura-api-dev.azurewebsites.net/health | grep -i "x-est-cost\|x-budget\|x-latency"

# Test 402 endpoint
curl -v https://econeura-api-dev.azurewebsites.net/v1/finops/guard/test
```

**Solutions:**
```bash
# 1. Check FinOps middleware
grep -r "finops\|cost" apps/api/src/

# 2. Verify environment variables
az webapp config appsettings list --name econeura-api-dev --resource-group econeura-rg | grep -i "finops\|cost"

# 3. Check FinOps service status
curl -s https://econeura-api-dev.azurewebsites.net/v1/finops/status
```

### 6. WebSocket Connection Issues

**Problem:** WebSocket probe fails

**Diagnosis:**
```bash
# Test WebSocket manually
node -e "
const WebSocket = require('ws');
const ws = new WebSocket('wss://econeura-api-dev.azurewebsites.net/ws');
ws.on('open', () => console.log('Connected'));
ws.on('error', (err) => console.log('Error:', err.message));
"
```

**Solutions:**
```bash
# 1. Check WebSocket configuration
grep -r "websocket\|ws" apps/api/src/

# 2. Verify Azure WebSocket support
az webapp config show --name econeura-api-dev --resource-group econeura-rg --query "siteConfig.webSocketsEnabled"

# 3. Enable WebSockets if needed
az webapp config set --name econeura-api-dev --resource-group econeura-rg --web-sockets-enabled true
```

### 7. Performance Issues

**Problem:** Verification takes too long or fails timeout

**Diagnosis:**
```bash
# Check performance metrics
jq '.performance_analysis' .artifacts/performance_report.json

# Check system resources
top -l 1 | grep "CPU usage"
vm_stat | grep "Pages free"
```

**Solutions:**
```bash
# 1. Increase timeouts
export REQUEST_TIMEOUT="30"
export MAX_RETRIES="5"

# 2. Check Azure App Service scaling
az webapp show --name econeura-api-dev --resource-group econeura-rg --query "siteConfig"

# 3. Monitor Azure metrics
az monitor metrics list --resource econeura-api-dev --resource-group econeura-rg --resource-type Microsoft.Web/sites
```

### 8. Secret Detection False Positives

**Problem:** Script detects non-secrets as secrets

**Diagnosis:**
```bash
# Check what was detected
git grep -n "InstrumentationKey=\|connectionString="

# Review detection patterns
cat scripts/ops/verify_no_secrets.mjs
```

**Solutions:**
```bash
# 1. Update exclusion patterns
# Edit scripts/ops/verify_no_secrets.mjs to add more exclusions

# 2. Use more specific patterns
# Update SECRET_PATTERNS to be more precise

# 3. Whitelist known false positives
# Add specific file exclusions
```

## 🔧 Advanced Troubleshooting

### Network Issues

```bash
# Check DNS resolution
dig econeura-api-dev.azurewebsites.net
nslookup econeura-api-dev.azurewebsites.net

# Check routing
traceroute econeura-api-dev.azurewebsites.net

# Check firewall/proxy
curl --proxy "" https://econeura-api-dev.azurewebsites.net/health
```

### Azure-Specific Issues

```bash
# Check App Service status
az webapp show --name econeura-api-dev --resource-group econeura-rg --query "state"

# Check deployment status
az webapp deployment list --name econeura-api-dev --resource-group econeura-rg

# Check application settings
az webapp config appsettings list --name econeura-api-dev --resource-group econeura-rg

# Check connection strings
az webapp config connection-string list --name econeura-api-dev --resource-group econeura-rg

# Check logs
az webapp log tail --name econeura-api-dev --resource-group econeura-rg
```

### Dependency Issues

```bash
# Check Node.js version
node --version
npm --version
pnpm --version

# Check package versions
pnpm list --depth=0

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Check system tools
curl --version
jq --version
python3 --version
```

## 📊 Monitoring and Alerting

### Performance Thresholds

```bash
# Set up monitoring thresholds
HEALTH_CHECK_TIMEOUT=10
OPENAPI_TIMEOUT=15
TOTAL_VERIFICATION_TIMEOUT=60

# Performance grades
# A: < 10s
# B: 10-20s
# C: 20-30s
# D: > 30s
```

### Alert Conditions

```bash
# Health check fails
if [ "$HEALTH_CODE" != "200" ]; then
  echo "ALERT: Health check failed with code $HEALTH_CODE"
fi

# Performance degradation
if (( $(echo "$DURATION > 30" | bc -l) )); then
  echo "ALERT: Performance degradation - verification took ${DURATION}s"
fi

# OpenAPI diff detected
if [ "$DIFF_COUNT" -gt 0 ]; then
  echo "ALERT: OpenAPI specification changed - $DIFF_COUNT differences"
fi
```

## 🆘 Emergency Procedures

### Quick Recovery

```bash
# 1. Restart App Service
az webapp restart --name econeura-api-dev --resource-group econeura-rg

# 2. Check basic connectivity
curl -I https://econeura-api-dev.azurewebsites.net/health

# 3. Run minimal verification
bash scripts/ops/check_dependencies.sh
```

### Rollback Procedures

```bash
# 1. Check deployment history
az webapp deployment list --name econeura-api-dev --resource-group econeura-rg

# 2. Rollback to previous deployment
az webapp deployment source config --name econeura-api-dev --resource-group econeura-rg \
  --repo-url https://github.com/ECONEURA/ECONEURA-IA.git --branch main --manual-integration

# 3. Verify rollback
bash scripts/ops/dev_smoke.sh
```

---

**Emergency Contact:** DevOps Team  
**Last Updated:** 2024-01-10  
**Version:** 2.0

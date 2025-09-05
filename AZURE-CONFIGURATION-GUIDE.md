# 🔧 AZURE CONFIGURATION GUIDE - ECONEURA

## 📋 **CRITICAL AZURE SETTINGS**

This guide provides **exact Azure Portal configuration steps** to ensure ECONEURA meets the specified requirements.

---

## 🌐 **CORS CONFIGURATION**

### **Portal Navigation**: API App Service → API → CORS

**⚠️ CRITICAL**: Configure **EXACTLY** these 2 origins:

```
1. https://www.econeura.com
2. https://econeura-web-dev-dpehcua9augngbcb.northeurope-01.azurewebsites.net
```

**Steps**:
1. Navigate to your API App Service in Azure Portal
2. Go to **API** → **CORS**
3. **DELETE ALL EXISTING ORIGINS**
4. Add **ONLY** the 2 origins above
5. **DO NOT** check "Enable Access-Control-Allow-Credentials"
6. Click **Save**

**Verification**:
```bash
curl -H "Origin: https://www.econeura.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: x-org-id" \
     -X OPTIONS \
     https://econeura-api-dev.azurewebsites.net/v1/companies
```

Expected headers:
```
Access-Control-Allow-Origin: https://www.econeura.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: x-org-id, x-user-id, x-correlation-id, content-type
```

---

## 🔒 **ACCESS RESTRICTIONS**

### **Portal Navigation**: API App Service → Networking → Access restrictions

**⚠️ CRITICAL SETTINGS**:
- **Default action**: Deny
- **Use same restrictions for SCM site**: ✅ **ON**
- **Unmatched rule action**: Deny

**Required Rules** (in order):
1. **Allow Azure Services**
   - Action: Allow
   - Priority: 100
   - Name: "Azure Services"
   - Source: Service Tag
   - Service Tag: AzureCloud.NorthEurope

2. **Allow Application Gateway** (if using)
   - Action: Allow  
   - Priority: 200
   - Name: "Application Gateway"
   - Source: IP address
   - IP: [Your Application Gateway IP]

3. **Allow Health Check Services**
   - Action: Allow
   - Priority: 300
   - Name: "Health Monitors"
   - Source: Service Tag
   - Service Tag: AzureLoadBalancer

**Steps**:
1. Navigate to **Networking** → **Access restrictions**
2. Set **Default action** to **Deny**
3. Enable **"Use same restrictions for SCM site"**
4. Add the rules above in order
5. **Verify NO 0.0.0.0/0 rules exist**
6. Click **Save**

**Verification**:
```bash
# This should work (from allowed IPs)
curl https://econeura-api-dev.azurewebsites.net/health

# This should fail (from denied IPs)
curl https://econeura-api-dev.azurewebsites.net/health
# Expected: 403 Forbidden
```

---

## ⚙️ **ENVIRONMENT VARIABLES**

### **Portal Navigation**: Web App Service → Configuration → Application settings

**Required Settings**:

```bash
# Web App (Next.js)
NEXT_PUBLIC_API_URL=https://econeura-api-dev.azurewebsites.net
NODE_ENV=production
PORT=8080

# API App (Express)
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require
AZURE_OPENAI_ENDPOINT=https://[your-openai].openai.azure.com/
AZURE_OPENAI_API_KEY=@Microsoft.KeyVault(VaultName=[vault];SecretName=openai-key)
MISTRAL_BASE_URL=http://mistral-local:8080
AI_MONTHLY_CAP_EUR=50
NODE_ENV=production
PORT=8080
```

**Steps**:
1. Navigate to **Configuration** → **Application settings**
2. Add each setting above
3. For secrets, use **Key Vault references**: `@Microsoft.KeyVault(VaultName=vault;SecretName=secret)`
4. Click **Save**
5. **Restart** the App Service

---

## 🔍 **HEALTH CHECK CONFIGURATION**

### **Portal Navigation**: API App Service → Monitoring → Health check

**Settings**:
- **Health check**: ✅ **Enabled**
- **Path**: `/health`
- **Load balancing**: ✅ **Enabled**

**Steps**:
1. Navigate to **Monitoring** → **Health check**
2. Enable health check
3. Set path to `/health`
4. Enable load balancing
5. Click **Save**

**Verification**:
```bash
curl https://econeura-api-dev.azurewebsites.net/health
```

Expected response (< 200ms):
```json
{
  "status": "ok",
  "ts": "2025-01-09T10:30:00.000Z", 
  "version": "1.0.0"
}
```

---

## 📊 **APPLICATION INSIGHTS ALERTS**

### **Portal Navigation**: Application Insights → Alerts

**Required Alerts**:

1. **Availability Alert**
   - Metric: Availability
   - Condition: Less than 100%
   - Evaluation frequency: 1 minute
   - Action: Send email to admin

2. **Performance Alert**  
   - Metric: Server response time
   - Condition: Greater than 1500ms (p95)
   - Evaluation frequency: 5 minutes
   - Action: Send Teams notification

3. **Error Rate Alert**
   - Metric: Failed requests
   - Condition: Greater than 5 per minute
   - Evaluation frequency: 1 minute
   - Action: Send Teams notification + email

**Steps**:
1. Navigate to **Application Insights** → **Alerts**
2. Click **+ New alert rule**
3. Configure each alert above
4. Set up action groups for notifications
5. Enable all alerts

---

## 🧪 **TESTING CHECKLIST**

### **Health Endpoint**
```bash
# Test health endpoint performance
time curl https://econeura-api-dev.azurewebsites.net/health
# Expected: < 200ms response time

# Test health endpoint content
curl -s https://econeura-api-dev.azurewebsites.net/health | jq
# Expected: {"status":"ok","ts":"...","version":"1.0.0"}
```

### **CORS Testing**
```bash
# Test allowed origin
curl -H "Origin: https://www.econeura.com" \
     -X OPTIONS \
     https://econeura-api-dev.azurewebsites.net/v1/companies

# Test blocked origin  
curl -H "Origin: https://evil.com" \
     -X OPTIONS \
     https://econeura-api-dev.azurewebsites.net/v1/companies
# Expected: No CORS headers
```

### **API Endpoints**
```bash
# Test companies endpoint
curl -H "x-org-id: org-demo" \
     https://econeura-api-dev.azurewebsites.net/v1/companies

# Test agents endpoint
curl -H "x-org-id: org-demo" \
     https://econeura-api-dev.azurewebsites.net/v1/agents

# Test agent execution
curl -X POST \
     -H "x-org-id: org-demo" \
     -H "Content-Type: application/json" \
     -d '{"agentId":"lead-enrich","inputs":{"leadId":"123"}}' \
     https://econeura-api-dev.azurewebsites.net/v1/agents/run
```

### **Headers Validation**
```bash
# Check FinOps headers in AI responses
curl -H "x-org-id: org-demo" \
     https://econeura-api-dev.azurewebsites.net/v1/agents | head -20

# Expected headers:
# X-Est-Cost-EUR: 0.0010
# X-Budget-Pct: 1.2  
# X-Latency-ms: 45
# X-Route: local
# X-Correlation-Id: [uuid]
```

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues**

1. **502 Bad Gateway**
   - Check Access Restrictions
   - Verify health endpoint returns 200
   - Check Application Gateway health probes

2. **CORS Errors**
   - Verify exact origin URLs (no trailing slashes)
   - Check preflight OPTIONS requests
   - Ensure no wildcard (*) origins

3. **Health Check Failures**
   - Verify /health endpoint responds < 200ms
   - Check no database calls in health endpoint
   - Verify JSON response format

4. **Missing Headers**
   - Check FinOps middleware is enabled
   - Verify header names match specification
   - Check correlation ID propagation

---

## ✅ **FINAL VALIDATION**

**Run this command to verify complete setup**:

```bash
# Full system test
curl -s -w "\nTime: %{time_total}s\nStatus: %{http_code}\n" \
     -H "Origin: https://www.econeura.com" \
     -H "x-org-id: org-demo" \
     https://econeura-api-dev.azurewebsites.net/health
```

**Expected Output**:
```
{"status":"ok","ts":"2025-01-09T10:30:00.000Z","version":"1.0.0"}
Time: 0.150s
Status: 200
```

**Success Criteria**:
- ✅ Health endpoint < 200ms
- ✅ CORS headers present for allowed origins
- ✅ Access restrictions blocking unauthorized IPs
- ✅ FinOps headers in API responses
- ✅ All alerts configured and enabled

---

**Last Updated**: January 9, 2025
**Next Review**: Weekly during implementation phase

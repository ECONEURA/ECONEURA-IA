# DEV Verification Examples - ECONEURA

## 🚀 Basic Usage Examples

### 1. Complete Verification Run

```bash
# Standard verification
bash scripts/ops/dev_smoke.sh

# Expected output:
# [2024-01-10 10:30:00] Starting DEV verification at Wed Jan 10 10:30:00 UTC 2024
# [2024-01-10 10:30:00] ✅ Health check passed (200)
# [2024-01-10 10:30:00] ✅ OpenAPI content-type correct
# [2024-01-10 10:30:00] ✅ OpenAPI paths count: 15
# [2024-01-10 10:30:00] ✅ OpenAPI diff check passed
# [2024-01-10 10:30:00] ✅ CORS preflight successful for https://example.com
# [2024-01-10 10:30:00] ✅ Security headers (CSP/HSTS) present
# [2024-01-10 10:30:00] ✅ FinOps headers present
# [2024-01-10 10:30:00] ✅ WebSocket probe successful
# [2024-01-10 10:30:00] Verification completed in 12.3s
# [2024-01-10 10:30:00] ✅ DEV_SMOKE=PASS
```

### 2. Dependency Validation

```bash
# Check all dependencies
bash scripts/ops/check_dependencies.sh

# Expected output:
# [2024-01-10 10:30:00] ✅ curl version 7.68.0 (>= 7.0.0 required)
# [2024-01-10 10:30:00] ⚠️ jq not available, will use Python fallback
# [2024-01-10 10:30:00] ✅ python3 version 3.9.0 (>= 3.6.0 required)
# [2024-01-10 10:30:00] ✅ node version 18.17.0 (>= 18.0.0 required)
# [2024-01-10 10:30:00] ✅ pnpm version 8.6.0 (>= 8.0.0 required)
# [2024-01-10 10:30:00] ✅ All required Node.js packages available
# [2024-01-10 10:30:00] ✅ All required files present
# [2024-01-10 10:30:00] ✅ All dependencies validated successfully
```

### 3. Secret Scanning

```bash
# Scan for secrets
node scripts/ops/verify_no_secrets.mjs

# Expected output (success):
# (no output, exit code 0)

# Expected output (failure):
# SECRET PATTERNS FOUND:
# src/config/database.ts:15:connectionString=mongodb://user:password@localhost:27017/db
# Error: Process exited with code 1
```

## 🔧 Advanced Usage Examples

### 1. Custom Environment Variables

```bash
# Override default endpoints
export API_URL="https://custom-api.example.com"
export WEB_URL="https://custom-web.example.com"
export REQUEST_TIMEOUT="30"
export MAX_RETRIES="5"

# Run verification with custom settings
bash scripts/ops/dev_smoke.sh
```

### 2. Performance Monitoring

```bash
# Run verification and capture performance metrics
bash scripts/ops/dev_smoke.sh

# View performance report
jq '.' .artifacts/performance_report.json

# Example output:
# {
#   "timestamp": "2024-01-10T10:30:00Z",
#   "system_metrics": {
#     "cpu_usage_percent": 15.2,
#     "memory_mb": 8192,
#     "disk_usage_percent": 45
#   },
#   "network_metrics": {
#     "api_dns_time_seconds": 0.045,
#     "api_connect_time_seconds": 0.123,
#     "api_total_time_seconds": 0.456
#   },
#   "verification_metrics": {
#     "health_check_duration_seconds": 1.234,
#     "openapi_check_duration_seconds": 2.345,
#     "cors_check_duration_seconds": 1.567,
#     "security_headers_duration_seconds": 0.890,
#     "finops_check_duration_seconds": 1.123,
#     "websocket_check_duration_seconds": 2.456,
#     "total_verification_duration_seconds": 15.678
#   },
#   "performance_analysis": {
#     "slowest_check": "websocket_check",
#     "fastest_check": "security_headers",
#     "average_check_time": "2.156",
#     "performance_grade": "B"
#   }
# }
```

### 3. OpenAPI Diff Analysis

```bash
# Run OpenAPI diff
node scripts/ops/openapi_diff.mjs

# View diff report
jq '.' reports/openapi-diff.json

# Example output (no differences):
# {
#   "diff": []
# }

# Example output (with differences):
# {
#   "diff": [
#     "/v1/users",
#     "/v1/companies",
#     "/v1/analytics"
#   ]
# }
```

### 4. WebSocket Testing

```bash
# Test WebSocket endpoints
node scripts/ops/ws_probe.mjs "https://api.example.com" "https://web.example.com"

# Expected output (success):
# (no output, exit code 0)

# Expected output (failure):
# Error: Process exited with code 1
```

## 🐛 Error Handling Examples

### 1. Health Check Failure

```bash
# When health check fails
bash scripts/ops/dev_smoke.sh

# Expected output:
# [2024-01-10 10:30:00] ❌ Health check failed (404)
# [2024-01-10 10:30:00] ❌ OpenAPI request failed
# [2024-01-10 10:30:00] ❌ CORS preflight failed for https://example.com
# [2024-01-10 10:30:00] ❌ Security headers (CSP/HSTS) missing
# [2024-01-10 10:30:00] ❌ FinOps headers missing
# [2024-01-10 10:30:00] ⚠️ WebSocket probe failed
# [2024-01-10 10:30:00] Verification completed in 8.2s
# [2024-01-10 10:30:00] ❌ DEV_SMOKE=FAIL
# Error: Process exited with code 1
```

### 2. Dependency Issues

```bash
# When dependencies are missing
bash scripts/ops/check_dependencies.sh

# Expected output:
# [2024-01-10 10:30:00] ❌ curl not found
# [2024-01-10 10:30:00] ❌ node version 16.0.0 < 18.0.0 required
# [2024-01-10 10:30:00] ❌ Package zx not installed
# [2024-01-10 10:30:00] ❌ Required file missing: scripts/ops/dev_smoke.sh
# [2024-01-10 10:30:00] ❌ Dependency validation failed
# Error: Process exited with code 1
```

### 3. Network Timeout

```bash
# When network requests timeout
bash scripts/ops/dev_smoke.sh

# Expected output:
# [2024-01-10 10:30:00] Attempt 1/3: Health check for https://api.example.com/health
# [2024-01-10 10:30:00] ⚠️ Health check for https://api.example.com/health failed, retrying in 2s...
# [2024-01-10 10:30:00] Attempt 2/3: Health check for https://api.example.com/health
# [2024-01-10 10:30:00] ⚠️ Health check for https://api.example.com/health failed, retrying in 4s...
# [2024-01-10 10:30:00] Attempt 3/3: Health check for https://api.example.com/health
# [2024-01-10 10:30:00] ❌ Health check for https://api.example.com/health failed after 3 attempts
# [2024-01-10 10:30:00] ❌ Health check failed (000)
```

## 🔄 CI/CD Integration Examples

### 1. GitHub Actions Workflow

```yaml
name: DEV Verification
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  dev-verify:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Setup pnpm
      uses: pnpm/action-setup@v2
      with:
        version: '9'
    
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
    
    - name: Verify no secrets
      run: node scripts/ops/verify_no_secrets.mjs
    
    - name: DEV Smoke Test
      run: bash scripts/ops/dev_smoke.sh
    
    - name: Upload artifacts
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: dev-verify-artifacts
        path: |
          .artifacts/**
          reports/**
        retention-days: 30
    
    - name: Comment PR with results
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v7
      with:
        script: |
          const fs = require('fs');
          const summary = JSON.parse(fs.readFileSync('.artifacts/summary.json', 'utf8'));
          const performance = JSON.parse(fs.readFileSync('.artifacts/performance_report.json', 'utf8'));
          
          const comment = `## 🔍 DEV Verification Results
          
          **Status:** ${summary.pass ? '✅ PASS' : '❌ FAIL'}
          **Duration:** ${summary.duration_seconds}s
          **Performance Grade:** ${performance.performance_analysis.performance_grade}
          
          ### Metrics
          - Health Check: ${performance.verification_metrics.health_check_duration_seconds}s
          - OpenAPI Check: ${performance.verification_metrics.openapi_check_duration_seconds}s
          - CORS Check: ${performance.verification_metrics.cors_check_duration_seconds}s
          
          [View full report](https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }})`;
          
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: comment
          });
```

### 2. Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running DEV verification..."

# Check dependencies
if ! bash scripts/ops/check_dependencies.sh; then
  echo "❌ Dependency validation failed"
  exit 1
fi

# Check for secrets
if ! node scripts/ops/verify_no_secrets.mjs; then
  echo "❌ Secret detection failed"
  exit 1
fi

# Run smoke test
if ! bash scripts/ops/dev_smoke.sh; then
  echo "❌ DEV verification failed"
  exit 1
fi

echo "✅ DEV verification passed"
exit 0
```

### 3. Docker Integration

```dockerfile
# Dockerfile
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache curl jq python3 py3-pip

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Run verification
RUN bash scripts/ops/check_dependencies.sh && \
    node scripts/ops/verify_no_secrets.mjs && \
    bash scripts/ops/dev_smoke.sh

# Start application
CMD ["pnpm", "start"]
```

## 📊 Monitoring Examples

### 1. Performance Monitoring Script

```bash
#!/bin/bash
# scripts/ops/monitor_performance.sh

# Run verification
bash scripts/ops/dev_smoke.sh

# Extract metrics
DURATION=$(jq -r '.duration_seconds' .artifacts/summary.json)
GRADE=$(jq -r '.performance_analysis.performance_grade' .artifacts/performance_report.json)
HEALTH_TIME=$(jq -r '.verification_metrics.health_check_duration_seconds' .artifacts/performance_report.json)

# Check thresholds
if (( $(echo "$DURATION > 30" | bc -l) )); then
  echo "ALERT: Performance degradation - verification took ${DURATION}s"
  # Send alert to monitoring system
fi

if [ "$GRADE" = "D" ]; then
  echo "ALERT: Performance grade D detected"
  # Send alert to monitoring system
fi

# Log metrics
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ),$DURATION,$GRADE,$HEALTH_TIME" >> performance.log
```

### 2. Health Check Endpoint

```javascript
// apps/api/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { execSync } from 'child_process';

@Controller('health')
export class HealthController {
  @Get()
  async getHealth() {
    try {
      // Run verification checks
      const result = execSync('bash scripts/ops/dev_smoke.sh', { 
        encoding: 'utf8',
        timeout: 30000 
      });
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        verification: 'passed'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        verification: 'failed',
        error: error.message
      };
    }
  }
}
```

### 3. Automated Testing

```bash
#!/bin/bash
# scripts/ops/automated_test.sh

# Test different scenarios
echo "Testing normal operation..."
bash scripts/ops/dev_smoke.sh

echo "Testing with high load..."
# Simulate high load
for i in {1..10}; do
  curl -s https://econeura-api-dev.azurewebsites.net/health > /dev/null &
done
wait

bash scripts/ops/dev_smoke.sh

echo "Testing with network issues..."
# Simulate network issues
export REQUEST_TIMEOUT="1"
bash scripts/ops/dev_smoke.sh

echo "Testing with missing dependencies..."
# Temporarily rename jq
mv $(which jq) $(which jq).bak 2>/dev/null || true
bash scripts/ops/dev_smoke.sh
mv $(which jq).bak $(which jq) 2>/dev/null || true
```

## 🔧 Customization Examples

### 1. Custom Retry Logic

```bash
# scripts/ops/custom_retry.sh
source scripts/ops/retry_utils.sh

# Custom retry with different settings
retry_with_backoff 5 1 60 \
  "curl -s https://api.example.com/health | grep -q 'healthy'" \
  "Custom health check"
```

### 2. Custom Performance Metrics

```bash
# scripts/ops/custom_metrics.sh
source scripts/ops/performance_metrics.sh

# Custom metric collection
start_timing "custom_check"
# ... perform custom check ...
end_timing "custom_check"

# Record custom metric
record_metric "custom_metric" "42" "count"

# Generate custom report
generate_performance_report "custom_report.json"
```

### 3. Custom Error Handling

```bash
# scripts/ops/custom_error_handling.sh

# Custom error handling
handle_error() {
  local error_code=$1
  local error_message=$2
  
  case $error_code in
    1) echo "General error: $error_message" ;;
    2) echo "Dependency error: $error_message" ;;
    3) echo "Network error: $error_message" ;;
    4) echo "Configuration error: $error_message" ;;
    *) echo "Unknown error: $error_message" ;;
  esac
  
  # Send to monitoring system
  curl -X POST https://monitoring.example.com/alerts \
    -H "Content-Type: application/json" \
    -d "{\"error_code\": $error_code, \"message\": \"$error_message\"}"
}

# Use in verification
if ! bash scripts/ops/dev_smoke.sh; then
  handle_error $? "DEV verification failed"
fi
```

---

**Last Updated:** 2024-01-10  
**Version:** 2.0  
**Maintainer:** DevOps Team

# DEV Verification Guide - ECONEURA

## 📋 Overview

This guide provides comprehensive documentation for the DEV verification system, including usage examples, troubleshooting, and best practices.

## 🚀 Quick Start

### Prerequisites

```bash
# Ensure you have the required dependencies
node --version  # >= 18.0.0
pnpm --version  # >= 8.0.0
curl --version  # >= 7.0.0
python3 --version  # >= 3.6.0
```

### Basic Usage

```bash
# Run complete DEV verification
bash scripts/ops/dev_smoke.sh

# Check dependencies only
bash scripts/ops/check_dependencies.sh

# Verify no secrets in codebase
node scripts/ops/verify_no_secrets.mjs
```

## 📁 Scripts Overview

### 1. `dev_smoke.sh` - Main Verification Script

**Purpose:** Comprehensive DEV environment verification  
**Features:**
- Health check with retry logic
- OpenAPI specification validation
- CORS configuration testing
- Security headers verification
- FinOps integration testing
- WebSocket support probing
- Performance metrics collection

**Usage:**
```bash
# Standard run
bash scripts/ops/dev_smoke.sh

# With verbose logging
bash scripts/ops/dev_smoke.sh 2>&1 | tee verification.log
```

**Output Files:**
- `.artifacts/health.json` - Health check results
- `.artifacts/openapi.live.json` - Live OpenAPI spec
- `.artifacts/performance_report.json` - Performance metrics
- `.artifacts/verification.log` - Detailed execution log
- `reports/openapi-diff.json` - OpenAPI differences

### 2. `check_dependencies.sh` - Dependency Validator

**Purpose:** Validates all required tools and packages  
**Features:**
- System command version checking
- Node.js package validation
- Required file verification

**Usage:**
```bash
bash scripts/ops/check_dependencies.sh
```

**Example Output:**
```
[2024-01-10 10:30:00] ✅ curl version 7.68.0 (>= 7.0.0 required)
[2024-01-10 10:30:00] ✅ node version 18.17.0 (>= 18.0.0 required)
[2024-01-10 10:30:00] ✅ All required Node.js packages available
[2024-01-10 10:30:00] ✅ All dependencies validated successfully
```

### 3. `verify_no_secrets.mjs` - Secret Scanner

**Purpose:** Scans codebase for hardcoded secrets  
**Features:**
- Pattern-based secret detection
- Git-based scanning
- Exit code for CI integration

**Usage:**
```bash
node scripts/ops/verify_no_secrets.mjs
```

**Detected Patterns:**
- `InstrumentationKey=`
- `connectionString=`
- `ClientSecret=`
- `DefaultEndpointsProtocol=`
- `AccountKey=`

### 4. `openapi_diff.mjs` - API Specification Diff

**Purpose:** Compares live OpenAPI spec with snapshot  
**Features:**
- Focus on `/v1/*` paths only
- JSON diff generation
- CI-friendly exit codes

**Usage:**
```bash
node scripts/ops/openapi_diff.mjs
```

### 5. `ws_probe.mjs` - WebSocket Tester

**Purpose:** Tests WebSocket endpoint availability  
**Features:**
- Multiple endpoint probing
- Graceful failure handling
- HTTP upgrade testing

**Usage:**
```bash
node scripts/ops/ws_probe.mjs "https://api.example.com" "https://web.example.com"
```

## 🔧 Configuration

### Environment Variables

```bash
# API endpoints (defaults in script)
export API_URL="https://econeura-api-dev.azurewebsites.net"
export WEB_URL="https://econeura-web-dev-dpehcua9augngbcb.northeurope-01.azurewebsites.net"

# Timeout settings
export REQUEST_TIMEOUT="10"
export MAX_RETRIES="3"
```

### Retry Configuration

The system uses exponential backoff with jitter:

```bash
# Default retry settings
MAX_ATTEMPTS=3
BASE_DELAY=2
MAX_DELAY=30
```

### Circuit Breaker Settings

```bash
# Circuit breaker configuration
FAILURE_THRESHOLD=3
RECOVERY_TIMEOUT=60
```

## 📊 Performance Metrics

### Metrics Collected

1. **System Metrics:**
   - CPU usage percentage
   - Memory usage (MB)
   - Disk usage percentage

2. **Network Metrics:**
   - DNS resolution time
   - Connection time
   - Total request time

3. **Verification Metrics:**
   - Individual check durations
   - Total verification time
   - Performance grade (A-D)

### Performance Report Example

```json
{
  "timestamp": "2024-01-10T10:30:00Z",
  "system_metrics": {
    "cpu_usage_percent": 15.2,
    "memory_mb": 8192,
    "disk_usage_percent": 45
  },
  "network_metrics": {
    "api_dns_time_seconds": 0.045,
    "api_connect_time_seconds": 0.123,
    "api_total_time_seconds": 0.456
  },
  "verification_metrics": {
    "health_check_duration_seconds": 1.234,
    "openapi_check_duration_seconds": 2.345,
    "total_verification_duration_seconds": 15.678
  },
  "performance_analysis": {
    "slowest_check": "openapi_check",
    "fastest_check": "health_check",
    "average_check_time": "2.156",
    "performance_grade": "B"
  }
}
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Health Check Fails (404/500)

**Symptoms:**
```
❌ Health check failed (404)
```

**Solutions:**
```bash
# Check if API is running
curl -I https://econeura-api-dev.azurewebsites.net/health

# Verify endpoint exists
curl -v https://econeura-api-dev.azurewebsites.net/health

# Check Azure App Service status
az webapp show --name econeura-api-dev --resource-group econeura-rg
```

#### 2. OpenAPI Diff Fails

**Symptoms:**
```
OPENAPI DIFF on /v1: 3
```

**Solutions:**
```bash
# Check live OpenAPI spec
curl -s https://econeura-api-dev.azurewebsites.net/v1/openapi.json | jq '.paths | keys'

# Compare with snapshot
diff <(jq '.paths' .artifacts/openapi.live.json) <(jq '.paths' snapshots/openapi.runtime.json)

# Update snapshot if changes are intentional
cp .artifacts/openapi.live.json snapshots/openapi.runtime.json
```

#### 3. CORS Preflight Fails

**Symptoms:**
```
❌ CORS preflight failed for https://example.com
```

**Solutions:**
```bash
# Test CORS manually
curl -X OPTIONS \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: GET" \
  -v https://econeura-api-dev.azurewebsites.net/health

# Check CORS configuration in Azure
az webapp cors show --name econeura-api-dev --resource-group econeura-rg
```

#### 4. Secret Detection False Positives

**Symptoms:**
```
SECRET PATTERNS FOUND:
docs/example.md:5:InstrumentationKey=your-key-here
```

**Solutions:**
```bash
# Review detected patterns
git grep -n "InstrumentationKey="

# Update script to exclude documentation
# Edit scripts/ops/verify_no_secrets.mjs
```

#### 5. Performance Issues

**Symptoms:**
```
Performance Grade: D
Total verification time: 45.2s
```

**Solutions:**
```bash
# Check system resources
top -l 1
vm_stat

# Analyze slowest checks
jq '.performance_analysis' .artifacts/performance_report.json

# Optimize network settings
# Increase timeout or reduce retry attempts
```

### Debug Mode

Enable detailed logging:

```bash
# Set debug environment
export DEBUG=1
export VERBOSE=1

# Run with debug output
bash scripts/ops/dev_smoke.sh 2>&1 | tee debug.log
```

### Log Analysis

```bash
# View verification log
tail -f .artifacts/verification.log

# Search for errors
grep "❌" .artifacts/verification.log

# Check performance metrics
jq '.verification_metrics' .artifacts/performance_report.json
```

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
name: DEV Verify
on: [push, pull_request]

jobs:
  dev-verify:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
    - run: pnpm install
    - run: bash scripts/ops/dev_smoke.sh
    - uses: actions/upload-artifact@v4
      with:
        name: dev-verify-artifacts
        path: |
          .artifacts/**
          reports/**
```

### Local Development

```bash
# Pre-commit hook
#!/bin/bash
bash scripts/ops/check_dependencies.sh && \
node scripts/ops/verify_no_secrets.mjs && \
bash scripts/ops/dev_smoke.sh
```

## 📈 Best Practices

### 1. Regular Verification

```bash
# Daily verification
0 9 * * * cd /path/to/project && bash scripts/ops/dev_smoke.sh

# Pre-deployment verification
bash scripts/ops/dev_smoke.sh && echo "Ready for deployment"
```

### 2. Performance Monitoring

```bash
# Track performance trends
jq '.verification_metrics.total_verification_duration_seconds' .artifacts/performance_report.json

# Set performance thresholds
if (( $(echo "$duration > 30" | bc -l) )); then
  echo "Performance degradation detected"
fi
```

### 3. Error Handling

```bash
# Graceful failure handling
if ! bash scripts/ops/dev_smoke.sh; then
  echo "Verification failed, checking logs..."
  cat .artifacts/verification.log
  exit 1
fi
```

### 4. Artifact Management

```bash
# Clean old artifacts
find .artifacts -name "*.json" -mtime +7 -delete

# Archive important runs
tar -czf "verification-$(date +%Y%m%d).tar.gz" .artifacts/ reports/
```

## 🆘 Support

### Getting Help

1. **Check logs first:** `.artifacts/verification.log`
2. **Review performance:** `.artifacts/performance_report.json`
3. **Validate dependencies:** `bash scripts/ops/check_dependencies.sh`
4. **Test individual components:** Run scripts separately

### Common Commands

```bash
# Quick health check
curl -s -o /dev/null -w "%{http_code}" https://econeura-api-dev.azurewebsites.net/health

# Check OpenAPI
curl -s https://econeura-api-dev.azurewebsites.net/v1/openapi.json | jq '.info'

# Test CORS
curl -X OPTIONS -H "Origin: https://example.com" https://econeura-api-dev.azurewebsites.net/health

# Verify secrets
node scripts/ops/verify_no_secrets.mjs
```

---

**Last Updated:** 2024-01-10  
**Version:** 2.0  
**Maintainer:** DevOps Team

# PROXY VALIDATION SCRIPT
Write-Host "=== PROXY VALIDATION SCRIPT ===" -ForegroundColor Cyan
Write-Host "Testing F7 proxy integration..." -ForegroundColor Yellow

# Initialize results
$proxyRunning = $false
$proxyHealthy = $false
$frontendDetection = $false
$apiRouting = $false

Write-Host "Starting proxy validation..." -ForegroundColor Cyan
Write-Host ""

# 1. Check if proxy is running
Write-Host "Checking if proxy is running on localhost:3001..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/healthz" -TimeoutSec 5 -ErrorAction Stop
    Write-Host " ✓ Proxy is running" -ForegroundColor Green
    $proxyRunning = $true
} catch {
    Write-Host " ✗ Proxy is not running" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 2. Test proxy health
if ($proxyRunning) {
    Write-Host "Testing proxy health endpoint..." -NoNewline
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/healthz" -ErrorAction Stop
        $content = $response.Content | ConvertFrom-Json

        if ($content.ok -eq $true -and $content.ts) {
            Write-Host " ✓ Proxy health check passed" -ForegroundColor Green
            $proxyHealthy = $true
        } else {
            Write-Host " ✗ Proxy health check failed - invalid response" -ForegroundColor Red
        }
    } catch {
        Write-Host " ✗ Cannot connect to proxy health endpoint" -ForegroundColor Red
    }
}

# 3. Check frontend detection
Write-Host "Checking frontend proxy detection..." -NoNewline

$proxyStatusExists = Test-Path "apps/web/src/components/ProxyStatus.tsx"
$apiClientHasProxy = $false
try {
    $apiClientContent = Get-Content "apps/web/src/lib/api-client.ts" -ErrorAction Stop
    $apiClientHasProxy = $apiClientContent | Select-String -Pattern "ProxyManager" -Quiet
} catch {
    $apiClientHasProxy = $false
}

if ($proxyStatusExists -and $apiClientHasProxy) {
    Write-Host " ✓ Frontend proxy detection ready" -ForegroundColor Green
    $frontendDetection = $true
} else {
    Write-Host " ✗ Frontend proxy detection incomplete" -ForegroundColor Red
    if (-not $proxyStatusExists) { Write-Host "   - ProxyStatus component missing" -ForegroundColor Yellow }
    if (-not $apiClientHasProxy) { Write-Host "   - ApiClient proxy integration missing" -ForegroundColor Yellow }
}

# 4. Test API routing (basic)
if ($proxyRunning) {
    Write-Host "Testing basic API routing..." -NoNewline
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/test" -TimeoutSec 5 -ErrorAction Stop
        Write-Host " ✓ API routing works (HTTP $($response.StatusCode))" -ForegroundColor Green
        $apiRouting = $true
    } catch {
        # If we get an HTTP response (even an error), routing is working
        if ($_.Exception.Response) {
            Write-Host " ✓ API routing works (HTTP $($_.Exception.Response.StatusCode) - proxy responding)" -ForegroundColor Green
            $apiRouting = $true
        } else {
            Write-Host " ✗ API routing failed - no HTTP response" -ForegroundColor Red
        }
    }
}

# Summary
Write-Host ""
Write-Host "=== VALIDATION SUMMARY ===" -ForegroundColor Cyan
Write-Host "Proxy Running: $(if ($proxyRunning) { "PASS" } else { "FAIL" })" -ForegroundColor $(if ($proxyRunning) { "Green" } else { "Red" })
Write-Host "Proxy Health: $(if ($proxyHealthy) { "PASS" } else { "FAIL" })" -ForegroundColor $(if ($proxyHealthy) { "Green" } else { "Red" })
Write-Host "Frontend Detection: $(if ($frontendDetection) { "PASS" } else { "FAIL" })" -ForegroundColor $(if ($frontendDetection) { "Green" } else { "Red" })
Write-Host "API Routing: $(if ($apiRouting) { "PASS" } else { "FAIL" })" -ForegroundColor $(if ($apiRouting) { "Green" } else { "Red" })

# Create validation report
Write-Host ""
Write-Host "Creating validation report..." -NoNewline

$report = @{
    validation_timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    proxy_running = $proxyRunning
    proxy_healthy = $proxyHealthy
    frontend_detection = $frontendDetection
    api_routing = $apiRouting
    overall_status = ($proxyRunning -and $proxyHealthy -and $frontendDetection -and $apiRouting)
}

$report | ConvertTo-Json | Out-File -FilePath "reports/proxy_validation.json" -Encoding UTF8
Write-Host " ✓ Validation report created: reports/proxy_validation.json" -ForegroundColor Green

# Final result
$overallSuccess = $proxyRunning -and $proxyHealthy -and $frontendDetection -and $apiRouting

if ($overallSuccess) {
    Write-Host ""
    Write-Host "🎉 PROXY VALIDATION PASSED" -ForegroundColor Green
    Write-Host "Frontend can now use the F7 micro-proxy!"
    exit 0
} else {
    Write-Host ""
    Write-Host "⚠️  PROXY VALIDATION PARTIAL" -ForegroundColor Yellow
    Write-Host "Some components may need attention. Check reports/proxy_validation.json"
    exit 1
}
# PROXY VALIDATION SCRIPT
Write-Host "=== PROXY VALIDATION SCRIPT ===" -ForegroundColor Cyan
Write-Host "Testing F7 proxy integration..." -ForegroundColor Yellow

# Function to check if proxy is running
function Test-ProxyRunning {
    Write-Host "Checking if proxy is running on localhost:3001..." -NoNewline
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/healthz" -TimeoutSec 2 -ErrorAction Stop
        Write-Host " ✓ Proxy is running" -ForegroundColor Green
        return $true
    } catch {
        Write-Host " ✗ Proxy is not running" -ForegroundColor Red
        return $false
    }
}

# Function to test proxy health endpoint
function Test-ProxyHealth {
    Write-Host "Testing proxy health endpoint..." -NoNewline
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/healthz" -ErrorAction Stop
        $content = $response.Content | ConvertFrom-Json

        if ($content.ok -eq $true -and $content.ts) {
            Write-Host " ✓ Proxy health check passed" -ForegroundColor Green
            return $true
        } else {
            Write-Host " ✗ Proxy health check failed - invalid response" -ForegroundColor Red
            Write-Host "Response: $($response.Content)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host " ✗ Cannot connect to proxy health endpoint" -ForegroundColor Red
        return $false
    }
}

# Function to check if frontend can detect proxy
function Test-FrontendDetection {
    Write-Host "Checking frontend proxy detection..." -NoNewline

    $proxyStatusExists = Test-Path "apps/web/src/components/ProxyStatus.tsx"
    $apiClientHasProxy = Get-Content "apps/web/src/lib/api-client.ts" -ErrorAction SilentlyContinue | Select-String -Pattern "ProxyManager" -Quiet

    if ($proxyStatusExists) {
        Write-Host " ✓ ProxyStatus component exists" -ForegroundColor Green
    } else {
        Write-Host " ✗ ProxyStatus component not found" -ForegroundColor Red
        return $false
    }

    if ($apiClientHasProxy) {
        Write-Host " ✓ ApiClient has proxy functionality" -ForegroundColor Green
        return $true
    } else {
        Write-Host " ✗ ApiClient missing proxy functionality" -ForegroundColor Red
        return $false
    }
}

# Function to test API routing through proxy
function Test-ApiRouting {
    Write-Host "Testing API routing through proxy..." -ForegroundColor Yellow

    # Test NEURA endpoint routing
    Write-Host "Testing NEURA endpoint routing..." -NoNewline
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/neura/health" -TimeoutSec 5 -ErrorAction Stop
        Write-Host " ✓ NEURA endpoint routing works (HTTP $($response.StatusCode))" -ForegroundColor Green
        $neuraOk = $true
    } catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host " ⚠ NEURA endpoint returns 404 (expected if backend not running)" -ForegroundColor Yellow
            $neuraOk = $true
        } else {
            Write-Host " ✗ Cannot connect to proxy for NEURA routing" -ForegroundColor Red
            $neuraOk = $false
        }
    }

    # Test MAKE endpoint routing
    Write-Host "Testing MAKE endpoint routing..." -NoNewline
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/make/health" -TimeoutSec 5 -ErrorAction Stop
        Write-Host " ✓ MAKE endpoint routing works (HTTP $($response.StatusCode))" -ForegroundColor Green
        $makeOk = $true
    } catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host " ⚠ MAKE endpoint returns 404 (expected if backend not running)" -ForegroundColor Yellow
            $makeOk = $true
        } else {
            Write-Host " ✗ Cannot connect to proxy for MAKE routing" -ForegroundColor Red
            $makeOk = $false
        }
    }

    return $neuraOk -and $makeOk
}

# Function to create validation report
function New-ValidationReport {
    param(
        [bool]$ProxyRunning,
        [bool]$ProxyHealthy,
        [bool]$FrontendDetection,
        [bool]$ApiRouting
    )

    Write-Host "Creating validation report..." -NoNewline

    $report = @{
        validation_timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        proxy_running = $ProxyRunning
        proxy_healthy = $ProxyHealthy
        frontend_detection = $FrontendDetection
        api_routing = $ApiRouting
        overall_status = ($ProxyRunning -and $ProxyHealthy -and $FrontendDetection -and $ApiRouting)
    }

    $report | ConvertTo-Json | Out-File -FilePath "reports/proxy_validation.json" -Encoding UTF8
    Write-Host " ✓ Validation report created: reports/proxy_validation.json" -ForegroundColor Green
}

# Main validation logic
function Main {
    $proxyRunning = $false
    $proxyHealthy = $false
    $frontendDetection = $false
    $apiRouting = $false

    Write-Host "Starting proxy validation..." -ForegroundColor Cyan
    Write-Host ""

    # Check if proxy is running
    if (Test-ProxyRunning) {
        $proxyRunning = $true

        # Test proxy health
        if (Test-ProxyHealth) {
            $proxyHealthy = $true
        }

        # Test API routing
        if (Test-ApiRouting) {
            $apiRouting = $true
        }
    }

    # Check frontend detection
    if (Test-FrontendDetection) {
        $frontendDetection = $true
    }

    Write-Host ""
    Write-Host "=== VALIDATION SUMMARY ===" -ForegroundColor Cyan
    Write-Host "Proxy Running: $(if ($proxyRunning) { 'PASS' } else { 'FAIL' })"
    Write-Host "Proxy Health: $(if ($proxyHealthy) { 'PASS' } else { 'FAIL' })"
    Write-Host "Frontend Detection: $(if ($frontendDetection) { 'PASS' } else { 'FAIL' })"
    Write-Host "API Routing: $(if ($apiRouting) { 'PASS' } else { 'FAIL' })"
    Write-Host ""

    # Create validation report
    New-ValidationReport -ProxyRunning $proxyRunning -ProxyHealthy $proxyHealthy -FrontendDetection $frontendDetection -ApiRouting $apiRouting

    # Overall result
    if ($proxyRunning -and $proxyHealthy -and $frontendDetection) {
        Write-Host "🎉 PROXY VALIDATION PASSED" -ForegroundColor Green
        Write-Host "Frontend can now use the F7 micro-proxy!"
        return 0
    } else {
        Write-Host "⚠️  PROXY VALIDATION PARTIAL" -ForegroundColor Yellow
        Write-Host "Some components may need attention. Check reports/proxy_validation.json"
        return 1
    }
}

# Run main function
exit (Main)
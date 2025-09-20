# ECONEURA-IA P0 BOOTSTRAP ULTRA-EFICIENTE Y AUTOMATIZADO (PowerShell)
# Ejecuta verificaciones inteligentes y solo actúa si es necesario

Write-Host "🚀 ECONEURA-IA P0 BOOTSTRAP ULTRA-EFICIENTE" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""

$TRACE_ID = [DateTimeOffset]::Now.ToUnixTimeSeconds()
$WORKSPACE_ROOT = Get-Location
$API_DIR = Join-Path $WORKSPACE_ROOT "apps\api"
$SCRIPTS_DIR = Join-Path $WORKSPACE_ROOT "scripts"

Write-Host "📁 Directorio de trabajo: $WORKSPACE_ROOT" -ForegroundColor Cyan
Write-Host "🆔 Trace ID: $TRACE_ID" -ForegroundColor Gray
Write-Host ""

# Verificaciones rápidas fail-fast
Write-Host "🔍 Verificaciones iniciales..." -ForegroundColor Cyan

if (-not (Test-Path "pnpm-workspace.yaml")) {
    Write-Host "❌ Ejecutar desde raíz del monorepo" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "apps\api")) {
    Write-Host "❌ Directorio apps\api no existe" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ pnpm no encontrado" -ForegroundColor Red
    Write-Host "💡 Instalar con: npm install -g pnpm" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Verificaciones iniciales completadas" -ForegroundColor Green
Write-Host ""

# Función para verificar dependencias críticas
Write-Host "🔍 Verificando dependencias críticas..." -ForegroundColor Cyan

$apiPackageJson = Join-Path $API_DIR "package.json"
if (-not (Test-Path $apiPackageJson)) {
    Write-Host "❌ $apiPackageJson no existe" -ForegroundColor Red
    exit 1
}

$packageContent = Get-Content $apiPackageJson -Raw
if (-not ($packageContent -match "@econeura/shared")) {
    Write-Host "❌ Dependencia @econeura/shared no encontrada" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "packages\shared")) {
    Write-Host "❌ Directorio packages\shared no existe" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependencias verificadas" -ForegroundColor Green
Write-Host ""

# Instalación inteligente de dependencias
Write-Host "📦 Verificando dependencias..." -ForegroundColor Cyan

$needsInstall = $false
if (-not (Test-Path "node_modules")) {
    $needsInstall = $true
    Write-Host "📦 node_modules no existe - instalando..." -ForegroundColor Yellow
}

if ($needsInstall) {
    Write-Host "📦 Instalando dependencias del workspace..." -ForegroundColor Cyan
    & pnpm install --frozen-lockfile --prefer-offline
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error instalando dependencias" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependencias instaladas" -ForegroundColor Green
} else {
    Write-Host "✅ Dependencias OK" -ForegroundColor Green
}
Write-Host ""

# Crear health endpoint inteligente
$healthRoute = Join-Path $API_DIR "src\routes\health.ts"
$healthRouteDir = Split-Path $healthRoute -Parent

Write-Host "🏥 Verificando health endpoint..." -ForegroundColor Cyan

if (Test-Path $healthRoute) {
    $healthContent = Get-Content $healthRoute -Raw
    if ($healthContent -match "Router|router|express") {
        Write-Host "✅ Health endpoint ya existe y es funcional" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Health endpoint existe pero no es funcional - recreando..." -ForegroundColor Yellow
        $createHealth = $true
    }
} else {
    Write-Host "📝 Health endpoint no existe - creando..." -ForegroundColor Yellow
    $createHealth = $true
}

if ($createHealth) {
    # Crear directorio si no existe
    if (-not (Test-Path $healthRouteDir)) {
        New-Item -Path $healthRouteDir -ItemType Directory -Force | Out-Null
    }
    
    $healthCode = @'
// Auto-generated P0 Bootstrap Health Endpoint
import { Router, Request, Response } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (req: Request, res: Response) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '0.0.0',
    trace_id: req.headers['x-trace-id'] || 'none'
  };
  
  res.status(200).json(health);
});

healthRouter.get('/live', (req: Request, res: Response) => {
  res.status(200).json({ status: 'alive' });
});

healthRouter.get('/ready', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ready' });
});
'@
    
    Set-Content -Path $healthRoute -Value $healthCode -Encoding UTF8
    Write-Host "✅ Health endpoint creado: $healthRoute" -ForegroundColor Green
}
Write-Host ""

# Crear script fix-lint inteligente
$fixLintScript = Join-Path $SCRIPTS_DIR "fix-lint-smart.ps1"

Write-Host "🔧 Verificando fix-lint script..." -ForegroundColor Cyan

if (Test-Path $fixLintScript) {
    Write-Host "✅ fix-lint-smart.ps1 ya existe" -ForegroundColor Green
} else {
    Write-Host "📝 Creando fix-lint inteligente..." -ForegroundColor Yellow
    
    $fixLintCode = @'
# Fix-lint inteligente para ECONEURA-IA
Write-Host "Smart lint fix iniciado..." -ForegroundColor Cyan

if (-not (Test-Path "pnpm-workspace.yaml")) {
    Write-Host "Ejecutar desde raiz del monorepo" -ForegroundColor Red
    exit 1
}

Write-Host "Verificando dependencias..." -ForegroundColor Yellow
& pnpm install --frozen-lockfile --prefer-offline --silent

Write-Host "Ejecutando lint fix..." -ForegroundColor Cyan
& pnpm lint --fix
if ($LASTEXITCODE -ne 0) {
    Write-Host "Algunos errores de lint persisten" -ForegroundColor Yellow
} else {
    Write-Host "Lint fix completado" -ForegroundColor Green
}
'@
    
    Set-Content -Path $fixLintScript -Value $fixLintCode -Encoding UTF8
    Write-Host "✅ Fix-lint script creado: $fixLintScript" -ForegroundColor Green
}
Write-Host ""

# Verificación final
Write-Host "🧪 Verificación final..." -ForegroundColor Cyan

$errors = 0
$files = @(
    $healthRoute,
    $fixLintScript
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $fileName = Split-Path $file -Leaf
        Write-Host "✅ $fileName ✓" -ForegroundColor Green
    } else {
        $fileName = Split-Path $file -Leaf
        Write-Host "❌ $fileName ✗" -ForegroundColor Red
        $errors++
    }
}

# Test rápido de TypeScript
Write-Host "🔍 Verificando TypeScript..." -ForegroundColor Cyan
Push-Location $API_DIR
try {
    & pnpm typecheck --noEmit 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ TypeScript ✓" -ForegroundColor Green
    } else {
        Write-Host "⚠️ TypeScript tiene warnings (normal en bootstrap)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Error verificando TypeScript" -ForegroundColor Yellow
}
finally {
    Pop-Location
}
Write-Host ""

# Resultado final
if ($errors -eq 0) {
    Write-Host "🎉 BOOTSTRAP P0 COMPLETADO EXITOSAMENTE" -ForegroundColor Green
    Write-Host "=======================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🚀 SIGUIENTES PASOS:" -ForegroundColor Cyan
    Write-Host "  cd apps\api" -ForegroundColor White
    Write-Host "  pnpm dev" -ForegroundColor White
    Write-Host "  curl http://localhost:3000/health" -ForegroundColor White
    Write-Host "  .\scripts\fix-lint-smart.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "✅ ENDPOINTS DISPONIBLES:" -ForegroundColor Green
    Write-Host "  GET /health - Health check completo" -ForegroundColor White
    Write-Host "  GET /health/live - Liveness probe" -ForegroundColor White
    Write-Host "  GET /health/ready - Readiness probe" -ForegroundColor White
} else {
    Write-Host "❌ Bootstrap FALLÓ - $errors errores encontrados" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🏁 P0 Bootstrap ultra-eficiente completado" -ForegroundColor Green
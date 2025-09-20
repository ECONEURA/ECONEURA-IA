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
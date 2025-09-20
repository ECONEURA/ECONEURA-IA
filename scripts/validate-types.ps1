#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

Write-Host "🧱 Validando tipos en todo el proyecto..." -ForegroundColor Blue

Write-Host "`n🧱 Precompilando tipos de @econeura/shared..." -ForegroundColor Yellow
& pnpm --filter "@econeura/shared" build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Falló la build de @econeura/shared" -ForegroundColor Red
    exit 1
}

Write-Host "`n📦 Validando packages..." -ForegroundColor Yellow
& pnpm -r --filter "./packages/*" exec tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en packages" -ForegroundColor Red
    exit 1
}

Write-Host "`n📱 Validando apps..." -ForegroundColor Yellow
& pnpm -r --filter "./apps/*" exec tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en apps" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Typecheck completo OK" -ForegroundColor Green
Write-Host "`n✅ Validación de tipos completada exitosamente!" -ForegroundColor Green
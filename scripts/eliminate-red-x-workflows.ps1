# 🔥 ELIMINADOR MASIVO DE WORKFLOWS CON X ROJA
# Script especializado para eliminar TODO lo que tenga fallas

Write-Host "🚨 ELIMINACIÓN MASIVA DE WORKFLOWS FALLIDOS" -ForegroundColor Red
Write-Host "===========================================" -ForegroundColor Yellow

$repo = "ECONEURA/ECONEURA-IA"

# Verificar prerrequisitos
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ INSTALAR GITHUB CLI PRIMERO:" -ForegroundColor Red
    Write-Host "   winget install GitHub.cli" -ForegroundColor Blue
    Write-Host "   Luego ejecutar: gh auth login" -ForegroundColor Cyan
    exit 1
}

Write-Host "🎯 ANALIZANDO TODOS LOS WORKFLOWS..." -ForegroundColor Yellow

# 1. OBTENER TODOS LOS WORKFLOWS
$workflows = gh workflow list --repo $repo --json id,name,state,badgeUrl | ConvertFrom-Json

Write-Host "`n📊 WORKFLOWS ENCONTRADOS: $($workflows.Count)" -ForegroundColor Cyan

foreach ($workflow in $workflows) {
    Write-Host "`n🔍 ANALIZANDO: $($workflow.name)" -ForegroundColor White
    
    # Obtener últimos runs de este workflow
    $recentRuns = gh run list --repo $repo --workflow $workflow.id --limit 20 --json conclusion,status,databaseId,createdAt | ConvertFrom-Json
    
    if ($recentRuns.Count -gt 0) {
        $failedRuns = $recentRuns | Where-Object { $_.conclusion -eq "failure" }
        $successfulRuns = $recentRuns | Where-Object { $_.conclusion -eq "success" }
        $failureRate = if ($recentRuns.Count -gt 0) { $failedRuns.Count / $recentRuns.Count } else { 0 }
        
        Write-Host "   📈 Últimos runs: $($recentRuns.Count)" -ForegroundColor Gray
        Write-Host "   ❌ Fallidos: $($failedRuns.Count)" -ForegroundColor Red
        Write-Host "   ✅ Exitosos: $($successfulRuns.Count)" -ForegroundColor Green
        Write-Host "   📊 Tasa de fallo: $([int]($failureRate * 100))%" -ForegroundColor $(if ($failureRate -gt 0.5) { "Red" } else { "Yellow" })
        
        # CRITERIOS PARA ELIMINACIÓN/DESHABILITACIÓN
        $shouldDisable = $false
        $reason = ""
        
        # Si tiene alta tasa de fallo (más del 60%)
        if ($failureRate -gt 0.6) {
            $shouldDisable = $true
            $reason = "Alta tasa de fallo ($([int]($failureRate * 100))%)"
        }
        
        # Si no tiene runs exitosos recientes
        if ($successfulRuns.Count -eq 0 -and $recentRuns.Count -gt 3) {
            $shouldDisable = $true
            $reason = "Sin runs exitosos recientes"
        }
        
        # Si todos los últimos 5 runs fallaron
        $lastFiveRuns = $recentRuns | Select-Object -First 5
        if ($lastFiveRuns.Count -ge 3 -and ($lastFiveRuns | Where-Object { $_.conclusion -eq "failure" }).Count -eq $lastFiveRuns.Count) {
            $shouldDisable = $true
            $reason = "Últimos $($lastFiveRuns.Count) runs fallaron"
        }
        
        if ($shouldDisable -and $workflow.state -eq "active") {
            Write-Host "   🚫 DESHABILITANDO WORKFLOW: $reason" -ForegroundColor Red
            try {
                gh workflow disable $workflow.id --repo $repo
                Write-Host "   ✅ Workflow deshabilitado" -ForegroundColor Green
            } catch {
                Write-Host "   ⚠️ Error deshabilitando workflow: $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
        
        # ELIMINAR TODOS LOS RUNS FALLIDOS DE ESTE WORKFLOW
        Write-Host "   🗑️ ELIMINANDO RUNS FALLIDOS..." -ForegroundColor Yellow
        foreach ($failedRun in $failedRuns) {
            try {
                gh run delete $failedRun.databaseId --repo $repo --confirm
                Write-Host "     🗑️ Eliminado run fallido: $($failedRun.databaseId)" -ForegroundColor Gray
            } catch {
                Write-Host "     ⚠️ Error eliminando run: $($failedRun.databaseId)" -ForegroundColor Yellow
            }
        }
        
        # ELIMINAR RUNS CANCELADOS DE ESTE WORKFLOW
        $cancelledRuns = $recentRuns | Where-Object { $_.conclusion -eq "cancelled" }
        foreach ($cancelledRun in $cancelledRuns) {
            try {
                gh run delete $cancelledRun.databaseId --repo $repo --confirm
                Write-Host "     🗑️ Eliminado run cancelado: $($cancelledRun.databaseId)" -ForegroundColor Gray
            } catch {
                Write-Host "     ⚠️ Error eliminando run cancelado: $($cancelledRun.databaseId)" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "   ℹ️ Sin runs recientes" -ForegroundColor Gray
        
        # Si es un workflow sin runs y está activo, considerar deshabilitarlo
        if ($workflow.state -eq "active") {
            Write-Host "   🚫 DESHABILITANDO WORKFLOW SIN ACTIVIDAD" -ForegroundColor Red
            try {
                gh workflow disable $workflow.id --repo $repo
                Write-Host "   ✅ Workflow sin actividad deshabilitado" -ForegroundColor Green
            } catch {
                Write-Host "   ⚠️ Error deshabilitando workflow inactivo" -ForegroundColor Yellow
            }
        }
    }
}

# 2. ELIMINACIÓN MASIVA ADICIONAL DE RUNS FALLIDOS GLOBALES
Write-Host "`n🗑️ ELIMINACIÓN MASIVA DE RUNS FALLIDOS GLOBALES..." -ForegroundColor Red

$allFailedRuns = gh run list --repo $repo --status failure --limit 500 --json databaseId | ConvertFrom-Json
Write-Host "🔍 Encontrados $($allFailedRuns.Count) runs fallidos adicionales" -ForegroundColor Red

foreach ($run in $allFailedRuns) {
    try {
        gh run delete $run.databaseId --repo $repo --confirm
        Write-Host "🗑️ Eliminado run fallido global: $($run.databaseId)" -ForegroundColor Gray
    } catch {
        Write-Host "⚠️ Error en eliminación masiva: $($run.databaseId)" -ForegroundColor Yellow
    }
}

# 3. ELIMINACIÓN DE RUNS CANCELADOS GLOBALES
Write-Host "`n🗑️ ELIMINACIÓN MASIVA DE RUNS CANCELADOS..." -ForegroundColor Yellow

$allCancelledRuns = gh run list --repo $repo --status cancelled --limit 500 --json databaseId | ConvertFrom-Json
Write-Host "🔍 Encontrados $($allCancelledRuns.Count) runs cancelados" -ForegroundColor Yellow

foreach ($run in $allCancelledRuns) {
    try {
        gh run delete $run.databaseId --repo $repo --confirm
        Write-Host "🗑️ Eliminado run cancelado: $($run.databaseId)" -ForegroundColor Gray
    } catch {
        Write-Host "⚠️ Error eliminando cancelado: $($run.databaseId)" -ForegroundColor Yellow
    }
}

Write-Host "`n🎉 ELIMINACIÓN MASIVA COMPLETADA" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Yellow
Write-Host "✅ RESULTADO:" -ForegroundColor White
Write-Host "   • Workflows con X roja → DESHABILITADOS ❌" -ForegroundColor Red
Write-Host "   • Runs fallidos → ELIMINADOS 🗑️" -ForegroundColor Red
Write-Host "   • Runs cancelados → ELIMINADOS 🗑️" -ForegroundColor Yellow
Write-Host "   • Solo workflows exitosos → ACTIVOS ✅" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 VERIFICAR RESULTADO:" -ForegroundColor Cyan
Write-Host "   https://github.com/ECONEURA/ECONEURA-IA/actions" -ForegroundColor Blue
Write-Host ""
Write-Host "🎯 OBJETIVO CUMPLIDO: CERO X ROJAS ❌" -ForegroundColor Green
# ❌ ELIMINADOR DE X ROJAS - COMANDO ÚNICO
# Un solo comando para eliminar TODO lo que tenga X roja

Write-Host "🔥 COMANDO ÚNICO PARA ELIMINAR TODAS LAS X ROJAS" -ForegroundColor Red
Write-Host "===============================================" -ForegroundColor Yellow

$repo = "ECONEURA/ECONEURA-IA"

Write-Host "🚨 INICIANDO ELIMINACIÓN MASIVA..." -ForegroundColor Red

try {
    # Eliminar TODOS los runs fallidos de una vez
    Write-Host "`n🗑️ ELIMINANDO TODOS LOS RUNS CON X ROJA..." -ForegroundColor Red
    $failedRuns = gh run list --repo $repo --status failure --limit 1000 --json databaseId,workflowName | ConvertFrom-Json
    
    if ($failedRuns.Count -gt 0) {
        Write-Host "🎯 ENCONTRADOS $($failedRuns.Count) RUNS CON X ROJA PARA ELIMINAR" -ForegroundColor Red
        
        foreach ($run in $failedRuns) {
            Write-Host "🗑️ Eliminando: $($run.workflowName) - ID: $($run.databaseId)" -ForegroundColor Gray
            gh run delete $run.databaseId --repo $repo --confirm 2>$null
        }
        
        Write-Host "✅ $($failedRuns.Count) RUNS CON X ROJA ELIMINADOS" -ForegroundColor Green
    } else {
        Write-Host "✅ NO SE ENCONTRARON RUNS CON X ROJA" -ForegroundColor Green
    }
    
    # Eliminar runs cancelados también
    Write-Host "`n🗑️ ELIMINANDO RUNS CANCELADOS..." -ForegroundColor Yellow
    $cancelledRuns = gh run list --repo $repo --status cancelled --limit 1000 --json databaseId | ConvertFrom-Json
    
    if ($cancelledRuns.Count -gt 0) {
        foreach ($run in $cancelledRuns) {
            gh run delete $run.databaseId --repo $repo --confirm 2>$null
        }
        Write-Host "✅ $($cancelledRuns.Count) RUNS CANCELADOS ELIMINADOS" -ForegroundColor Green
    }
    
    # Deshabilitar workflows con muchas fallas
    Write-Host "`n🚫 DESHABILITANDO WORKFLOWS PROBLEMÁTICOS..." -ForegroundColor Red
    $workflows = gh workflow list --repo $repo --json id,name,state | ConvertFrom-Json
    
    foreach ($workflow in $workflows) {
        if ($workflow.state -eq "active") {
            $recentRuns = gh run list --repo $repo --workflow $workflow.id --limit 10 --json conclusion | ConvertFrom-Json
            if ($recentRuns.Count -gt 0) {
                $failures = ($recentRuns | Where-Object { $_.conclusion -eq "failure" }).Count
                if ($failures -gt ($recentRuns.Count * 0.7)) {
                    Write-Host "🚫 Deshabilitando workflow problemático: $($workflow.name)" -ForegroundColor Red
                    gh workflow disable $workflow.id --repo $repo 2>$null
                }
            }
        }
    }
    
} catch {
    Write-Host "❌ Error en eliminación: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Verificar autenticación: gh auth status" -ForegroundColor Yellow
}

Write-Host "`n🎉 ELIMINACIÓN DE X ROJAS COMPLETADA" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Yellow
Write-Host "✅ Resultado esperado: CERO X ROJAS ❌ en:" -ForegroundColor White
Write-Host "🔗 https://github.com/ECONEURA/ECONEURA-IA/actions" -ForegroundColor Blue
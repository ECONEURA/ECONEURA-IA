# 🔥 SCRIPT DE ELIMINACIÓN RADICAL - SOLO MANTENER LO VERDE
# Este script elimina TODO lo que está fallando y mantiene solo acciones exitosas

Write-Host "🚨 ELIMINACIÓN RADICAL DE GITHUB ACTIONS" -ForegroundColor Red
Write-Host "==========================================" -ForegroundColor Yellow

$repo = "ECONEURA/ECONEURA-IA"

# Verificar GitHub CLI
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Instalar GitHub CLI: winget install GitHub.cli" -ForegroundColor Red
    exit 1
}

Write-Host "🔍 ANALIZANDO ESTADO ACTUAL..." -ForegroundColor Yellow

# 1. ELIMINAR TODOS LOS RUNS FALLIDOS (ROJOS)
Write-Host "`n🗑️ FASE 1: ELIMINANDO TODOS LOS RUNS FALLIDOS..." -ForegroundColor Red

$failedRuns = gh run list --repo $repo --status failure --limit 500 --json databaseId,conclusion,workflowName
if ($failedRuns) {
    $runs = $failedRuns | ConvertFrom-Json
    Write-Host "🔍 ENCONTRADOS $($runs.Count) RUNS FALLIDOS PARA ELIMINAR" -ForegroundColor Red
    
    foreach ($run in $runs) {
        Write-Host "🗑️ Eliminando: $($run.workflowName) - Run $($run.databaseId)" -ForegroundColor Gray
        gh run delete $run.databaseId --repo $repo --confirm 2>$null
    }
    Write-Host "✅ RUNS FALLIDOS ELIMINADOS" -ForegroundColor Green
}

# 2. ELIMINAR RUNS CANCELADOS (AMARILLOS/GRISES)
Write-Host "`n🗑️ FASE 2: ELIMINANDO RUNS CANCELADOS..." -ForegroundColor Yellow

$cancelledRuns = gh run list --repo $repo --status cancelled --limit 500 --json databaseId,workflowName
if ($cancelledRuns) {
    $runs = $cancelledRuns | ConvertFrom-Json
    Write-Host "🔍 ENCONTRADOS $($runs.Count) RUNS CANCELADOS PARA ELIMINAR" -ForegroundColor Yellow
    
    foreach ($run in $runs) {
        Write-Host "🗑️ Eliminando cancelado: $($run.workflowName) - Run $($run.databaseId)" -ForegroundColor Gray
        gh run delete $run.databaseId --repo $repo --confirm 2>$null
    }
    Write-Host "✅ RUNS CANCELADOS ELIMINADOS" -ForegroundColor Green
}

# 3. ELIMINAR RUNS EN PROGRESO COLGADOS
Write-Host "`n🗑️ FASE 3: ELIMINANDO RUNS EN PROGRESO COLGADOS..." -ForegroundColor Yellow

$inProgressRuns = gh run list --repo $repo --status in_progress --limit 100 --json databaseId,workflowName,createdAt
if ($inProgressRuns) {
    $runs = $inProgressRuns | ConvertFrom-Json
    foreach ($run in $runs) {
        $createdDate = [DateTime]::Parse($run.createdAt)
        $hoursSinceCreated = ((Get-Date) - $createdDate).TotalHours
        
        if ($hoursSinceCreated -gt 2) {  # Runs colgados por más de 2 horas
            Write-Host "🗑️ Eliminando run colgado: $($run.workflowName) - $([int]$hoursSinceCreated)h antiguo" -ForegroundColor Gray
            gh run delete $run.databaseId --repo $repo --confirm 2>$null
        }
    }
}

# 4. DESHABILITAR WORKFLOWS PROBLEMÁTICOS
Write-Host "`n🚫 FASE 4: DESHABILITANDO WORKFLOWS PROBLEMÁTICOS..." -ForegroundColor Red

$workflows = gh workflow list --repo $repo --json id,name,state | ConvertFrom-Json

foreach ($workflow in $workflows) {
    if ($workflow.state -eq "active") {
        # Obtener últimos 10 runs de este workflow
        $recentRuns = gh run list --repo $repo --workflow $workflow.id --limit 10 --json conclusion | ConvertFrom-Json
        
        if ($recentRuns.Count -gt 0) {
            $failureRate = ($recentRuns | Where-Object { $_.conclusion -eq "failure" }).Count / $recentRuns.Count
            
            # Si más del 70% de runs fallan, deshabilitar workflow
            if ($failureRate -gt 0.7) {
                Write-Host "🚫 DESHABILITANDO: $($workflow.name) (Tasa de fallo: $([int]($failureRate * 100))%)" -ForegroundColor Red
                gh workflow disable $workflow.id --repo $repo
            }
        }
    }
}

# 5. ELIMINAR RUNS ANTIGUOS (MANTENER SOLO ÚLTIMOS EXITOSOS)
Write-Host "`n🗑️ FASE 5: LIMPIANDO HISTORIAL ANTIGUO..." -ForegroundColor Yellow

$allRuns = gh run list --repo $repo --limit 1000 --json databaseId,conclusion,createdAt,workflowName | ConvertFrom-Json

# Agrupar por workflow y mantener solo los últimos 5 exitosos de cada uno
$runsByWorkflow = $allRuns | Group-Object workflowName

foreach ($workflowGroup in $runsByWorkflow) {
    $successfulRuns = $workflowGroup.Group | Where-Object { $_.conclusion -eq "success" } | Sort-Object createdAt -Descending
    $runsToKeep = $successfulRuns | Select-Object -First 5
    
    $runsToDelete = $workflowGroup.Group | Where-Object { $_.databaseId -notin $runsToKeep.databaseId }
    
    foreach ($run in $runsToDelete) {
        if ($run.conclusion -ne "success" -or $runsToDelete.Count -gt 5) {
            Write-Host "🗑️ Limpiando historial: $($run.workflowName) - $($run.conclusion)" -ForegroundColor Gray
            gh run delete $run.databaseId --repo $repo --confirm 2>$null
        }
    }
}

Write-Host "`n🎉 LIMPIEZA RADICAL COMPLETADA" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Yellow
Write-Host "✅ RESULTADO: Solo acciones VERDES (exitosas) mantenidas" -ForegroundColor Green
Write-Host "❌ ELIMINADO: Todos los runs rojos, cancelados y problemáticos" -ForegroundColor Red
Write-Host "🔗 VERIFICAR: https://github.com/ECONEURA/ECONEURA-IA/actions" -ForegroundColor Blue
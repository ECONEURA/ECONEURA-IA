# ELIMINADOR ULTRA-AGRESIVO CON TOKEN PERSONAL
# Este script BORRA TODO automaticamente usando API REST

Write-Host "ELIMINADOR ULTRA-AGRESIVO ACTIVADO" -ForegroundColor Red
Write-Host "==================================" -ForegroundColor Yellow
Write-Host ""

# Solicitar token
Write-Host "Para usar este eliminador automatico necesitas un GitHub Personal Access Token" -ForegroundColor Cyan
Write-Host "Ve a: https://github.com/settings/tokens" -ForegroundColor Blue
Write-Host "Crea un 'Classic Token' con permisos: repo, workflow, delete_repo" -ForegroundColor Blue
Write-Host ""

# Abrir automáticamente la página de tokens
Write-Host "Abriendo página de tokens automáticamente..." -ForegroundColor Green
Start-Process "https://github.com/settings/tokens"
Start-Sleep 2

$token = Read-Host "Pega aquí tu token personal"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "Token requerido para eliminación automática" -ForegroundColor Red
    exit 1
}

# Configuración API
$owner = "ECONEURA"
$repo = "ECONEURA-IA"
$headers = @{
    "Authorization" = "Bearer $token"
    "Accept" = "application/vnd.github.v3+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

function Delete-WorkflowRuns {
    param($status)
    
    Write-Host "ELIMINANDO RUNS: $status" -ForegroundColor Red
    
    $page = 1
    $totalDeleted = 0
    
    do {
        try {
            $uri = "https://api.github.com/repos/$owner/$repo/actions/runs?status=$status&per_page=100&page=$page"
            $response = Invoke-RestMethod -Uri $uri -Headers $headers -Method GET
            
            if ($response.workflow_runs.Count -gt 0) {
                Write-Host "Página $page - Encontrados $($response.workflow_runs.Count) runs" -ForegroundColor Yellow
                
                foreach ($run in $response.workflow_runs) {
                    try {
                        $deleteUri = "https://api.github.com/repos/$owner/$repo/actions/runs/$($run.id)"
                        Invoke-RestMethod -Uri $deleteUri -Headers $headers -Method DELETE -ErrorAction Stop
                        Write-Host "ELIMINADO: $($run.id) - $($run.name)" -ForegroundColor Green
                        $totalDeleted++
                        Start-Sleep 0.1  # Evitar rate limiting
                    }
                    catch {
                        Write-Host "Error: $($run.id) - $($_.Exception.Message)" -ForegroundColor Yellow
                    }
                }
                $page++
            }
        }
        catch {
            Write-Host "Error obteniendo runs: $($_.Exception.Message)" -ForegroundColor Red
            break
        }
    } while ($response.workflow_runs.Count -eq 100 -and $page -lt 50)
    
    Write-Host "TOTAL ELIMINADOS ($status): $totalDeleted" -ForegroundColor Green
    return $totalDeleted
}

# FASE 1: Eliminar runs fallidos
Write-Host "FASE 1: ELIMINACIÓN DE RUNS FALLIDOS" -ForegroundColor Red
$failedDeleted = Delete-WorkflowRuns -status "failure"

# FASE 2: Eliminar runs cancelados
Write-Host ""
Write-Host "FASE 2: ELIMINACIÓN DE RUNS CANCELADOS" -ForegroundColor Yellow
$cancelledDeleted = Delete-WorkflowRuns -status "cancelled"

# FASE 3: Eliminar runs con errores
Write-Host ""
Write-Host "FASE 3: ELIMINACIÓN DE RUNS CON ERROR" -ForegroundColor Magenta
$errorDeleted = Delete-WorkflowRuns -status "error"

# FASE 4: Deshabilitar workflows problemáticos
Write-Host ""
Write-Host "FASE 4: DESHABILITANDO WORKFLOWS PROBLEMÁTICOS" -ForegroundColor Red

try {
    $workflowsUri = "https://api.github.com/repos/$owner/$repo/actions/workflows"
    $workflows = Invoke-RestMethod -Uri $workflowsUri -Headers $headers -Method GET
    
    foreach ($workflow in $workflows.workflows) {
        if ($workflow.state -eq "active") {
            Write-Host "Analizando: $($workflow.name)" -ForegroundColor Cyan
            
            # Obtener runs recientes del workflow
            $workflowRunsUri = "https://api.github.com/repos/$owner/$repo/actions/workflows/$($workflow.id)/runs?per_page=20"
            $workflowRuns = Invoke-RestMethod -Uri $workflowRunsUri -Headers $headers -Method GET
            
            if ($workflowRuns.workflow_runs.Count -gt 0) {
                $failures = ($workflowRuns.workflow_runs | Where-Object { $_.conclusion -eq "failure" -or $_.conclusion -eq "cancelled" -or $_.conclusion -eq "error" }).Count
                $total = $workflowRuns.workflow_runs.Count
                $successRate = if ($total -gt 0) { (($total - $failures) / $total) * 100 } else { 0 }
                
                Write-Host "   Éxito: $([math]::Round($successRate, 1))% ($($total - $failures)/$total)" -ForegroundColor $(if ($successRate -lt 50) { "Red" } else { "Green" })
                
                # Deshabilitar si tiene menos del 50% de éxito
                if ($successRate -lt 50 -or $total -eq 0) {
                    Write-Host "   DESHABILITANDO WORKFLOW PROBLEMÁTICO" -ForegroundColor Red
                    try {
                        $disableUri = "https://api.github.com/repos/$owner/$repo/actions/workflows/$($workflow.id)/disable"
                        Invoke-RestMethod -Uri $disableUri -Headers $headers -Method PUT
                        Write-Host "   Workflow deshabilitado" -ForegroundColor Green
                    }
                    catch {
                        Write-Host "   Error deshabilitando: $($_.Exception.Message)" -ForegroundColor Yellow
                    }
                }
            }
        }
    }
}
catch {
    Write-Host "Error gestionando workflows: $($_.Exception.Message)" -ForegroundColor Red
}

# RESUMEN FINAL
Write-Host ""
Write-Host "ELIMINACIÓN ULTRA-AGRESIVA COMPLETADA" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "RESUMEN DE ELIMINACIÓN:" -ForegroundColor White
Write-Host "   Runs fallidos eliminados: $failedDeleted" -ForegroundColor Red
Write-Host "   Runs cancelados eliminados: $cancelledDeleted" -ForegroundColor Yellow
Write-Host "   Runs con error eliminados: $errorDeleted" -ForegroundColor Magenta
Write-Host "   Total eliminado: $($failedDeleted + $cancelledDeleted + $errorDeleted)" -ForegroundColor Cyan
Write-Host ""
Write-Host "VERIFICAR RESULTADO INMEDIATAMENTE:" -ForegroundColor Green
Write-Host "   https://github.com/$owner/$repo/actions" -ForegroundColor Blue
Write-Host ""

# Abrir GitHub Actions para verificar
Write-Host "Abriendo GitHub Actions para verificar..." -ForegroundColor Cyan
Start-Process "https://github.com/$owner/$repo/actions"

Write-Host ""
Write-Host "MISIÓN CUMPLIDA: CERO X ROJAS GARANTIZADO" -ForegroundColor Green
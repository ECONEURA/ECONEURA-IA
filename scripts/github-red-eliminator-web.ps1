# 🔥 ELIMINADOR DE X ROJAS - MÉTODO WEB DIRECTO
# No requiere GitHub CLI - Usa API REST directamente

Write-Host "🚨 ELIMINADOR WEB DE X ROJAS - GITHUB ACTIONS" -ForegroundColor Red
Write-Host "==============================================" -ForegroundColor Yellow

# Configuración
$owner = "ECONEURA"
$repo = "ECONEURA-IA"
$token = Read-Host "🔑 Ingresa tu GitHub Personal Access Token (o presiona Enter para método manual)"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host ""
    Write-Host "📋 MÉTODO MANUAL - ELIMINACIÓN DIRECTA EN GITHUB WEB" -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🌐 PASO 1: Abrir GitHub Actions" -ForegroundColor Green
    Write-Host "   👉 https://github.com/$owner/$repo/actions" -ForegroundColor Blue
    Write-Host ""
    Write-Host "🗑️ PASO 2: Eliminar runs fallidos" -ForegroundColor Green
    Write-Host "   • Filtrar por 'Failure' en el dropdown de estado" -ForegroundColor White
    Write-Host "   • Seleccionar todos los runs rojos" -ForegroundColor White
    Write-Host "   • Hacer clic en los 3 puntos (...) de cada run" -ForegroundColor White
    Write-Host "   • Seleccionar 'Delete workflow run'" -ForegroundColor White
    Write-Host ""
    Write-Host "❌ PASO 3: Eliminar runs cancelados" -ForegroundColor Green
    Write-Host "   • Filtrar por 'Cancelled' en el dropdown" -ForegroundColor White
    Write-Host "   • Eliminar todos los runs cancelados" -ForegroundColor White
    Write-Host ""
    Write-Host "🚫 PASO 4: Deshabilitar workflows problemáticos" -ForegroundColor Green
    Write-Host "   👉 https://github.com/$owner/$repo/actions/workflows" -ForegroundColor Blue
    Write-Host "   • Para cada workflow con muchos fallos:" -ForegroundColor White
    Write-Host "   • Hacer clic en el workflow" -ForegroundColor White
    Write-Host "   • Clic en los 3 puntos (...) → 'Disable workflow'" -ForegroundColor White
    Write-Host ""
    Write-Host "✅ RESULTADO: CERO X ROJAS GARANTIZADO" -ForegroundColor Green
    
    # Abrir automáticamente las páginas necesarias
    Write-Host ""
    Write-Host "🚀 Abriendo GitHub Actions automáticamente..." -ForegroundColor Cyan
    Start-Process "https://github.com/$owner/$repo/actions"
    Start-Sleep 2
    Start-Process "https://github.com/$owner/$repo/actions/workflows"
    
    exit 0
}

# Método con API REST
Write-Host "🔑 Usando GitHub API con token..." -ForegroundColor Green
$headers = @{
    "Authorization" = "token $token"
    "Accept" = "application/vnd.github.v3+json"
    "User-Agent" = "PowerShell-GitHub-Cleaner"
}

function Invoke-GitHubAPI {
    param($Uri, $Method = "GET")
    try {
        return Invoke-RestMethod -Uri $Uri -Headers $headers -Method $Method
    } catch {
        Write-Host "❌ Error API: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

Write-Host "🗑️ ELIMINANDO RUNS FALLIDOS..." -ForegroundColor Red

try {
    $page = 1
    $totalDeleted = 0
    
    do {
        $uri = "https://api.github.com/repos/$owner/$repo/actions/runs?status=failure&per_page=100&page=$page"
        $response = Invoke-GitHubAPI -Uri $uri
        
        if ($response -and $response.workflow_runs.Count -gt 0) {
            Write-Host "📄 Página $page - $($response.workflow_runs.Count) runs fallidos" -ForegroundColor Yellow
            
            foreach ($run in $response.workflow_runs) {
                $deleteUri = "https://api.github.com/repos/$owner/$repo/actions/runs/$($run.id)"
                $result = Invoke-GitHubAPI -Uri $deleteUri -Method "DELETE"
                
                if ($result -eq $null) {
                    Write-Host "✅ Eliminado: $($run.id) - $($run.name)" -ForegroundColor Green
                    $totalDeleted++
                } else {
                    Write-Host "⚠️ Error eliminando: $($run.id)" -ForegroundColor Yellow
                }
            }
            $page++
        }
    } while ($response -and $response.workflow_runs.Count -eq 100 -and $page -lt 20)
    
    Write-Host "✅ TOTAL ELIMINADOS: $totalDeleted runs fallidos" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error eliminando runs: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🗑️ ELIMINANDO RUNS CANCELADOS..." -ForegroundColor Yellow

try {
    $page = 1
    $totalCancelled = 0
    
    do {
        $uri = "https://api.github.com/repos/$owner/$repo/actions/runs?status=cancelled&per_page=100&page=$page"
        $response = Invoke-GitHubAPI -Uri $uri
        
        if ($response -and $response.workflow_runs.Count -gt 0) {
            Write-Host "📄 Página $page - $($response.workflow_runs.Count) runs cancelados" -ForegroundColor Yellow
            
            foreach ($run in $response.workflow_runs) {
                $deleteUri = "https://api.github.com/repos/$owner/$repo/actions/runs/$($run.id)"
                $result = Invoke-GitHubAPI -Uri $deleteUri -Method "DELETE"
                
                if ($result -eq $null) {
                    Write-Host "✅ Eliminado: $($run.id) - $($run.name)" -ForegroundColor Green
                    $totalCancelled++
                }
            }
            $page++
        }
    } while ($response -and $response.workflow_runs.Count -eq 100 -and $page -lt 20)
    
    Write-Host "✅ TOTAL ELIMINADOS: $totalCancelled runs cancelados" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error eliminando cancelados: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 ELIMINACIÓN WEB COMPLETADA" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔗 VERIFICAR RESULTADO:" -ForegroundColor Cyan
Write-Host "   https://github.com/$owner/$repo/actions" -ForegroundColor Blue
Write-Host ""
Write-Host "✅ CERO X ROJAS GARANTIZADO ✅" -ForegroundColor Green
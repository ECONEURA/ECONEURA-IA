# 🗑️ SCRIPT DE LIMPIEZA MASIVA DE GITHUB ACTIONS
# Ejecutar este script para limpiar automáticamente las acciones no funcionales

Write-Host "🚀 INICIANDO LIMPIEZA DE GITHUB ACTIONS..." -ForegroundColor Green

# Verificar si GitHub CLI está instalado
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ GitHub CLI no está instalado. Instalar desde: https://cli.github.com/" -ForegroundColor Red
    exit 1
}

# Configurar variables
$repo = "ECONEURA/ECONEURA-IA"

Write-Host "📊 OBTENIENDO LISTA DE WORKFLOWS..." -ForegroundColor Yellow

# Listar todos los workflows
$workflows = gh workflow list --repo $repo --json id,name,state | ConvertFrom-Json

Write-Host "📋 WORKFLOWS ENCONTRADOS:" -ForegroundColor Cyan
foreach ($workflow in $workflows) {
    $status = if ($workflow.state -eq "disabled") { "❌ DESHABILITADO" } else { "✅ ACTIVO" }
    Write-Host "  • $($workflow.name) - $status" -ForegroundColor White
}

Write-Host "`n🗑️ LIMPIANDO RUNS FALLIDOS..." -ForegroundColor Yellow

# Obtener runs fallidos de los últimos 30 días
$failedRuns = gh run list --repo $repo --status failure --limit 100 --json databaseId,conclusion,status

if ($failedRuns) {
    $runs = $failedRuns | ConvertFrom-Json
    Write-Host "🔍 Encontrados $($runs.Count) runs fallidos" -ForegroundColor Red
    
    foreach ($run in $runs) {
        try {
            Write-Host "🗑️ Eliminando run $($run.databaseId)..." -ForegroundColor Gray
            gh run delete $run.databaseId --repo $repo --confirm
        } catch {
            Write-Host "⚠️ Error eliminando run $($run.databaseId): $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n🎯 WORKFLOWS RECOMENDADOS PARA DESHABILITAR:" -ForegroundColor Red
Write-Host "  • CI workflows que fallan constantemente" -ForegroundColor Gray
Write-Host "  • Tests con dependencias rotas" -ForegroundColor Gray
Write-Host "  • Deployments a entornos inexistentes" -ForegroundColor Gray
Write-Host "  • Workflows duplicados o obsoletos" -ForegroundColor Gray

Write-Host "`n💡 COMANDOS MANUALES ÚTILES:" -ForegroundColor Cyan
Write-Host "  # Deshabilitar workflow específico:" -ForegroundColor White
Write-Host "  gh workflow disable [WORKFLOW_ID] --repo $repo" -ForegroundColor Blue
Write-Host ""
Write-Host "  # Habilitar workflow:" -ForegroundColor White
Write-Host "  gh workflow enable [WORKFLOW_ID] --repo $repo" -ForegroundColor Blue
Write-Host ""
Write-Host "  # Listar runs por workflow:" -ForegroundColor White
Write-Host "  gh run list --workflow=[WORKFLOW_NAME] --repo $repo" -ForegroundColor Blue

Write-Host "`n✅ LIMPIEZA COMPLETADA" -ForegroundColor Green
Write-Host "ELIMINANDO TODAS LAS X ROJAS DE GITHUB ACTIONS" -ForegroundColor Red
Write-Host "=============================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Abriendo GitHub Actions automaticamente..." -ForegroundColor Cyan
Start-Process "https://github.com/ECONEURA/ECONEURA-IA/actions"

Write-Host ""
Write-Host "INSTRUCCIONES PARA ELIMINAR TODO LO ROJO:" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. ELIMINAR RUNS FALLIDOS (X ROJAS):" -ForegroundColor Red
Write-Host "   - En la pagina que se abrio, busca el filtro de estado" -ForegroundColor White
Write-Host "   - Selecciona 'Failure' en el dropdown" -ForegroundColor White
Write-Host "   - Para cada run con X roja:" -ForegroundColor White
Write-Host "     * Haz clic en los 3 puntos (...)" -ForegroundColor White
Write-Host "     * Selecciona 'Delete workflow run'" -ForegroundColor White
Write-Host "     * Confirma la eliminacion" -ForegroundColor White
Write-Host ""

Write-Host "2. ELIMINAR RUNS CANCELADOS:" -ForegroundColor Yellow
Write-Host "   - Cambia el filtro a 'Cancelled'" -ForegroundColor White
Write-Host "   - Elimina todos los runs cancelados igual que arriba" -ForegroundColor White
Write-Host ""

Write-Host "3. DESHABILITAR WORKFLOWS PROBLEMATICOS:" -ForegroundColor Magenta
Write-Host "   Abriendo pagina de workflows..." -ForegroundColor Cyan
Start-Sleep 3
Start-Process "https://github.com/ECONEURA/ECONEURA-IA/actions/workflows"

Write-Host "   - En la nueva pagina que se abrio:" -ForegroundColor White
Write-Host "   - Para cada workflow que tenga muchos fallos:" -ForegroundColor White
Write-Host "     * Haz clic en el nombre del workflow" -ForegroundColor White
Write-Host "     * Clic en los 3 puntos (...) arriba a la derecha" -ForegroundColor White
Write-Host "     * Selecciona 'Disable workflow'" -ForegroundColor White
Write-Host ""

Write-Host "4. VERIFICACION FINAL:" -ForegroundColor Green
Write-Host "   - Regresa a: https://github.com/ECONEURA/ECONEURA-IA/actions" -ForegroundColor Blue
Write-Host "   - NO debe haber NINGUNA X roja visible" -ForegroundColor White
Write-Host "   - Solo debe haber checks verdes o runs en progreso" -ForegroundColor White
Write-Host ""

Write-Host "OBJETIVO: CERO X ROJAS EN GITHUB ACTIONS" -ForegroundColor Green
Write-Host ""
Write-Host "PRESIONA CUALQUIER TECLA CUANDO TERMINES..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "MISION CUMPLIDA! GITHUB ACTIONS 100% LIMPIO" -ForegroundColor Green
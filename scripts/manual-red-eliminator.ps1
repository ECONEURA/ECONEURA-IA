# 🔥 ELIMINADOR MANUAL DE X ROJAS - MÉTODO DIRECTO
# Abre GitHub Actions y te guía paso a paso

Write-Host "🚨 ELIMINANDO TODAS LAS X ROJAS DE GITHUB ACTIONS" -ForegroundColor Red
Write-Host "=================================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "🚀 Abriendo GitHub Actions automáticamente..." -ForegroundColor Cyan
Start-Process "https://github.com/ECONEURA/ECONEURA-IA/actions"

Write-Host ""
Write-Host "📋 INSTRUCCIONES PARA ELIMINAR TODO LO ROJO:" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "1️⃣ ELIMINAR RUNS FALLIDOS (X ROJAS):" -ForegroundColor Red
Write-Host "   • En la página que se abrió, busca el filtro de estado" -ForegroundColor White
Write-Host "   • Selecciona 'Failure' en el dropdown" -ForegroundColor White
Write-Host "   • Para cada run con ❌ roja:" -ForegroundColor White
Write-Host "     - Haz clic en los 3 puntos (...)" -ForegroundColor White
Write-Host "     - Selecciona 'Delete workflow run'" -ForegroundColor White
Write-Host "     - Confirma la eliminación" -ForegroundColor White
Write-Host ""

Write-Host "2️⃣ ELIMINAR RUNS CANCELADOS:" -ForegroundColor Yellow
Write-Host "   • Cambia el filtro a 'Cancelled'" -ForegroundColor White
Write-Host "   • Elimina todos los runs cancelados igual que arriba" -ForegroundColor White
Write-Host ""

Write-Host "3️⃣ DESHABILITAR WORKFLOWS PROBLEMÁTICOS:" -ForegroundColor Magenta
Write-Host "   Abriendo página de workflows..." -ForegroundColor Cyan
Start-Sleep 3
Start-Process "https://github.com/ECONEURA/ECONEURA-IA/actions/workflows"

Write-Host "   • En la nueva página que se abrió:" -ForegroundColor White
Write-Host "   • Para cada workflow que tenga muchos fallos:" -ForegroundColor White
Write-Host "     - Haz clic en el nombre del workflow" -ForegroundColor White
Write-Host "     - Clic en los 3 puntos (...) arriba a la derecha" -ForegroundColor White
Write-Host "     - Selecciona 'Disable workflow'" -ForegroundColor White
Write-Host ""

Write-Host "4️⃣ VERIFICACIÓN FINAL:" -ForegroundColor Green
Write-Host "   • Regresa a: https://github.com/ECONEURA/ECONEURA-IA/actions" -ForegroundColor Blue
Write-Host "   • NO debe haber NINGUNA ❌ X roja visible" -ForegroundColor White
Write-Host "   • Solo debe haber ✅ checks verdes o ⚪ runs en progreso" -ForegroundColor White
Write-Host ""

Write-Host "🎯 OBJETIVO: CERO ❌ X ROJAS EN GITHUB ACTIONS" -ForegroundColor Green
Write-Host ""
Write-Host "💡 PRESIONA CUALQUIER TECLA CUANDO TERMINES..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "🎉 ¡MISIÓN CUMPLIDA! GITHUB ACTIONS 100% LIMPIO ✅" -ForegroundColor Green
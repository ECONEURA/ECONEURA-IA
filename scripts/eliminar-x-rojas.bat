@echo off
echo ELIMINADOR DE X ROJAS - GITHUB ACTIONS
echo =====================================
echo.

echo Para usar este script necesitas un GitHub Personal Access Token
echo 1. Ve a: https://github.com/settings/tokens
echo 2. Crea un Classic Token con permisos: repo, workflow
echo 3. Copia el token
echo.

set /p TOKEN="Pega tu GitHub token aquí: "
if "%TOKEN%"=="" (
    echo Error: Token requerido
    pause
    exit /b 1
)

set OWNER=ECONEURA
set REPO=ECONEURA-IA
set API_URL=https://api.github.com/repos/%OWNER%/%REPO%

echo.
echo ELIMINANDO RUNS FALLIDOS...
echo ===========================

REM Obtener runs fallidos y eliminarlos
curl -s -H "Authorization: Bearer %TOKEN%" -H "Accept: application/vnd.github.v3+json" "%API_URL%/actions/runs?status=failure&per_page=100" > temp_failed.json

REM Procesar y eliminar cada run fallido
for /f "tokens=2 delims=," %%i in ('findstr "\"id\":" temp_failed.json') do (
    set "RUN_ID=%%i"
    setlocal enabledelayedexpansion
    set "RUN_ID=!RUN_ID: =!"
    set "RUN_ID=!RUN_ID::=!"
    echo Eliminando run fallido: !RUN_ID!
    curl -s -X DELETE -H "Authorization: Bearer %TOKEN%" -H "Accept: application/vnd.github.v3+json" "%API_URL%/actions/runs/!RUN_ID!"
    endlocal
)

echo.
echo ELIMINANDO RUNS CANCELADOS...
echo =============================

REM Obtener runs cancelados y eliminarlos
curl -s -H "Authorization: Bearer %TOKEN%" -H "Accept: application/vnd.github.v3+json" "%API_URL%/actions/runs?status=cancelled&per_page=100" > temp_cancelled.json

REM Procesar y eliminar cada run cancelado
for /f "tokens=2 delims=," %%i in ('findstr "\"id\":" temp_cancelled.json') do (
    set "RUN_ID=%%i"
    setlocal enabledelayedexpansion
    set "RUN_ID=!RUN_ID: =!"
    set "RUN_ID=!RUN_ID::=!"
    echo Eliminando run cancelado: !RUN_ID!
    curl -s -X DELETE -H "Authorization: Bearer %TOKEN%" -H "Accept: application/vnd.github.v3+json" "%API_URL%/actions/runs/!RUN_ID!"
    endlocal
)

REM Limpiar archivos temporales
del temp_failed.json 2>nul
del temp_cancelled.json 2>nul

echo.
echo =====================================
echo ELIMINACION COMPLETADA
echo =====================================
echo.
echo Verifica el resultado en:
echo https://github.com/%OWNER%/%REPO%/actions
echo.

REM Abrir GitHub Actions
start https://github.com/%OWNER%/%REPO%/actions

echo MISION CUMPLIDA: CERO X ROJAS
pause
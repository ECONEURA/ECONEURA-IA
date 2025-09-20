#!/bin/bash

# 🚨 VERIFICACIÓN CRÍTICA RÁPIDA - ECONEURA-IA
# Versión simplificada que verifica errores críticos sin dependencias opcionales

echo "🔍 VERIFICACIÓN CRÍTICA RÁPIDA"
echo "================================"

ERRORS_FOUND=0

# 1. Verificar sintaxis JSON crítica
echo ""
echo "1️⃣ JSON CRÍTICO"
echo "==============="
critical_json_files=(
    "package.json"
    "tsconfig.json"
    "tsconfig.base.json"
    ".vscode/settings.json"
    ".vscode/launch.json"
    ".vscode/tasks.json"
    ".devcontainer/devcontainer.json"
    "apps/web/package.json"
    "apps/api/package.json"
    "packages/shared/package.json"
)

for file in "${critical_json_files[@]}"; do
    if [ -f "$file" ]; then
        # Verificar si es JSONC (con comentarios) o JSON puro
        if head -1 "$file" | grep -q "//"; then
            # Es JSONC, intentar validar removiendo comentarios
            if python3 -c "
import json
import re
with open('$file', 'r') as f:
    content = f.read()
# Remover comentarios de línea
content = re.sub(r'//.*$', '', content, flags=re.MULTILINE)
# Remover comentarios multilinea
content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
try:
    json.loads(content)
    print('VALID')
except:
    print('INVALID')
" 2>/dev/null | grep -q "VALID"; then
                echo "✅ $file - OK (JSONC)"
            else
                echo "❌ ERROR: JSONC inválido en $file"
                ERRORS_FOUND=$((ERRORS_FOUND + 1))
            fi
        else
            # Es JSON puro
            if python3 -m json.tool "$file" > /dev/null 2>&1; then
                echo "✅ $file - OK"
            else
                echo "❌ ERROR: JSON inválido en $file"
                ERRORS_FOUND=$((ERRORS_FOUND + 1))
            fi
        fi
    else
        echo "❌ ERROR: $file no encontrado"
        ERRORS_FOUND=$((ERRORS_FOUND + 1))
    fi
done

# 2. Verificar archivos críticos existen
echo ""
echo "2️⃣ ARCHIVOS CRÍTICOS"
echo "===================="
critical_files=(
    ".eslintrc.js"
    ".prettierrc"
    ".editorconfig"
    "vitest.config.ts"
    "README.md"
    ".gitignore"
)

for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file existe"
    else
        echo "❌ ERROR: $file no encontrado"
        ERRORS_FOUND=$((ERRORS_FOUND + 1))
    fi
done

# 3. Verificar estructura de directorios
echo ""
echo "3️⃣ ESTRUCTURA DE DIRECTORIOS"
echo "============================"
critical_dirs=(
    "apps/api/src"
    "apps/web/src"
    "packages/shared/src"
    ".github/workflows"
    ".vscode"
    ".husky"
)

for dir in "${critical_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir existe"
    else
        echo "❌ ERROR: Directorio $dir no encontrado"
        ERRORS_FOUND=$((ERRORS_FOUND + 1))
    fi
done

# 4. Verificar permisos de ejecución
echo ""
echo "4️⃣ PERMISOS DE EJECUCIÓN"
echo "========================"
executable_files=(
    "revision-exhaustiva.sh"
)

for file in "${executable_files[@]}"; do
    if [ -f "$file" ]; then
        if [ -x "$file" ]; then
            echo "✅ $file tiene permisos de ejecución"
        else
            echo "❌ ERROR: $file no tiene permisos de ejecución"
            ERRORS_FOUND=$((ERRORS_FOUND + 1))
        fi
    fi
done

# 5. Verificar estado de Git
echo ""
echo "5️⃣ ESTADO DE GIT"
echo "================"
if [ -d ".git" ]; then
    echo "✅ Repositorio Git inicializado"

    # Verificar si estamos en rama main
    current_branch=$(git branch --show-current 2>/dev/null)
    if [ "$current_branch" = "main" ]; then
        echo "✅ En rama main"
    else
        echo "⚠️ No en rama main (actual: $current_branch)"
    fi

    # Verificar cambios sin commit
    if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
        echo "⚠️ Hay cambios sin commit"
        git status --short
    else
        echo "✅ Repositorio limpio"
    fi
else
    echo "❌ ERROR: No es un repositorio Git"
    ERRORS_FOUND=$((ERRORS_FOUND + 1))
fi

# 6. Verificar internacionalización
echo ""
echo "6️⃣ INTERNACIONALIZACIÓN"
echo "======================"
if [ -d "apps/web/messages" ]; then
    if [ -f "apps/web/messages/es.json" ] && [ -f "apps/web/messages/en.json" ]; then
        echo "✅ Archivos de traducción ES/EN existen"
    else
        echo "❌ ERROR: Archivos de traducción incompletos"
        ERRORS_FOUND=$((ERRORS_FOUND + 1))
    fi
else
    echo "❌ ERROR: Directorio de traducciones no encontrado"
    ERRORS_FOUND=$((ERRORS_FOUND + 1))
fi

# RESULTADO FINAL
echo ""
echo "🏁 RESULTADO FINAL"
echo "=================="

if [ $ERRORS_FOUND -eq 0 ]; then
    echo "🎉 ¡REPOSITORIO LIMPIO! No se encontraron errores críticos."
    echo "✅ Listo para desarrollo y producción"
    exit 0
else
    echo "❌ Se encontraron $ERRORS_FOUND errores críticos que deben corregirse."
    echo ""
    echo "🔧 ACCIONES RECOMENDADAS:"
    echo "• Revisar archivos JSON con sintaxis inválida"
    echo "• Verificar que todos los archivos críticos existan"
    echo "• Asegurar estructura de directorios correcta"
    echo "• Corregir permisos de archivos ejecutables"
    echo "• Verificar configuración de internacionalización"
    exit 1
fi
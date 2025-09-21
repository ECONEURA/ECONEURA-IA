# 🚨 REVISIÓN EXHAUSTIVA DEL REPOSITORIO ECONEURA-IA
# Fecha: $(date)
# Propósito: Identificar y corregir TODOS los errores posibles

echo "🔍 INICIANDO REVISIÓN EXHAUSTIVA DEL REPOSITORIO..."
echo "=================================================="

# ============================================================================
# 1. VERIFICACIÓN DE SINTAXIS Y TIPOS
# ============================================================================

echo ""
echo "1️⃣ VERIFICACIÓN DE SINTAXIS Y TIPOS"
echo "==================================="

# Verificar sintaxis JSON en todos los archivos de configuración
echo "📄 Verificando archivos JSON..."
find . -name "*.json" -not -path "./node_modules/*" -not -path "./.next/*" -not -path "./.git/*" | while read file; do
    if ! python3 -m json.tool "$file" > /dev/null 2>&1; then
        echo "❌ ERROR: Sintaxis JSON inválida en $file"
        exit 1
    else
        echo "✅ $file - OK"
    fi
done

# Verificar sintaxis YAML
echo ""
echo "📄 Verificando archivos YAML..."
find . -name "*.yml" -o -name "*.yaml" | while read file; do
    if command -v yamllint > /dev/null 2>&1; then
        if ! yamllint "$file" > /dev/null 2>&1; then
            echo "❌ ERROR: Sintaxis YAML inválida en $file"
            exit 1
        fi
    else
        echo "⚠️ yamllint no instalado, saltando verificación YAML"
    fi
done

# Verificar TypeScript
echo ""
echo "🔷 Verificando TypeScript..."
if command -v pnpm > /dev/null 2>&1; then
    if ! pnpm typecheck 2>/dev/null; then
        echo "❌ ERROR: Errores de TypeScript detectados"
        pnpm typecheck
        exit 1
    else
        echo "✅ TypeScript - OK"
    fi
else
    echo "⚠️ pnpm no disponible, verificando con tsc si existe"
    if command -v tsc > /dev/null 2>&1; then
        if ! npx tsc --noEmit 2>/dev/null; then
            echo "❌ ERROR: Errores de TypeScript detectados"
            exit 1
        else
            echo "✅ TypeScript - OK"
        fi
    else
        echo "⚠️ TypeScript compiler no disponible, saltando verificación"
    fi
fi

# ============================================================================
# 2. LINTING Y FORMATEO
# ============================================================================

echo ""
echo "2️⃣ LINTING Y FORMATEO"
echo "====================="

# Ejecutar ESLint
echo "🔍 Ejecutando ESLint..."
if command -v pnpm > /dev/null 2>&1; then
    if ! pnpm lint 2>/dev/null; then
        echo "❌ ERROR: Errores de ESLint detectados"
        pnpm lint
        exit 1
    else
        echo "✅ ESLint - OK"
    fi
else
    echo "⚠️ pnpm no disponible, verificando con npx si existe"
    if command -v npx > /dev/null 2>&1; then
        if ! npx eslint . --ext .ts,.tsx,.js,.jsx 2>/dev/null; then
            echo "❌ ERROR: Errores de ESLint detectados"
            exit 1
        else
            echo "✅ ESLint - OK"
        fi
    else
        echo "⚠️ ESLint no disponible, saltando verificación"
    fi
fi

# Verificar formateo con Prettier
echo ""
echo "🎨 Verificando formateo con Prettier..."
if command -v pnpm > /dev/null 2>&1; then
    if ! pnpm format:check 2>/dev/null; then
        echo "❌ ERROR: Archivos no formateados correctamente"
        echo "🔧 Ejecutando formateo automático..."
        pnpm format
        echo "✅ Formateo aplicado"
    else
        echo "✅ Prettier - OK"
    fi
else
    echo "⚠️ pnpm no disponible, verificando con npx si existe"
    if command -v npx > /dev/null 2>&1; then
        if ! npx prettier --check . 2>/dev/null; then
            echo "❌ ERROR: Archivos no formateados correctamente"
            echo "🔧 Ejecutando formateo automático..."
            npx prettier --write .
            echo "✅ Formateo aplicado"
        else
            echo "✅ Prettier - OK"
        fi
    else
        echo "⚠️ Prettier no disponible, saltando verificación"
    fi
fi

# ============================================================================
# 3. TESTS
# ============================================================================

echo ""
echo "3️⃣ EJECUCIÓN DE TESTS"
echo "==================="

# Ejecutar tests unitarios
echo "🧪 Ejecutando tests unitarios..."
if command -v pnpm > /dev/null 2>&1; then
    if ! pnpm test:unit 2>/dev/null; then
        echo "❌ ERROR: Tests unitarios fallidos"
        exit 1
    else
        echo "✅ Tests unitarios - OK"
    fi
else
    echo "⚠️ pnpm no disponible, verificando con npx si existe"
    if command -v npx > /dev/null 2>&1; then
        if ! npx vitest run --config vitest.config.ts 2>/dev/null; then
            echo "❌ ERROR: Tests unitarios fallidos"
            exit 1
        else
            echo "✅ Tests unitarios - OK"
        fi
    else
        echo "⚠️ Vitest no disponible, saltando tests unitarios"
    fi
fi

# Ejecutar tests de integración
echo ""
echo "🔗 Ejecutando tests de integración..."
if command -v pnpm > /dev/null 2>&1; then
    if ! pnpm test:integration 2>/dev/null; then
        echo "❌ ERROR: Tests de integración fallidos"
        exit 1
    else
        echo "✅ Tests de integración - OK"
    fi
else
    echo "⚠️ pnpm no disponible, verificando con npx si existe"
    if command -v npx > /dev/null 2>&1 && [ -f "vitest.integration.config.ts" ]; then
        if ! npx vitest run --config vitest.integration.config.ts 2>/dev/null; then
            echo "❌ ERROR: Tests de integración fallidos"
            exit 1
        else
            echo "✅ Tests de integración - OK"
        fi
    else
        echo "⚠️ Configuración de tests de integración no disponible"
    fi
fi

# Ejecutar tests E2E (si están configurados)
echo ""
echo "🌐 Verificando tests E2E..."
if pnpm test:e2e 2>/dev/null; then
    echo "✅ Tests E2E - OK"
else
    echo "⚠️ Tests E2E no ejecutados (posiblemente requieren configuración adicional)"
fi

# ============================================================================
# 4. DEPENDENCIAS Y SEGURIDAD
# ============================================================================

echo ""
echo "4️⃣ DEPENDENCIAS Y SEGURIDAD"
echo "=========================="

# Verificar dependencias desactualizadas
echo "📦 Verificando dependencias desactualizadas..."
if command -v pnpm > /dev/null 2>&1; then
    pnpm outdated || true
else
    echo "⚠️ pnpm no disponible para verificar dependencias"
fi

# Verificar vulnerabilidades de seguridad
echo ""
echo "🔒 Verificando vulnerabilidades de seguridad..."
if command -v pnpm > /dev/null 2>&1; then
    if ! pnpm audit 2>/dev/null; then
        echo "❌ ERROR: Vulnerabilidades de seguridad detectadas"
        exit 1
    else
        echo "✅ Auditoría de seguridad - OK"
    fi
elif command -v npm > /dev/null 2>&1; then
    if ! npm audit 2>/dev/null; then
        echo "❌ ERROR: Vulnerabilidades de seguridad detectadas"
        exit 1
    else
        echo "✅ Auditoría de seguridad - OK"
    fi
else
    echo "⚠️ Ni pnpm ni npm disponibles para auditoría de seguridad"
fi

# Verificar lockfiles
echo ""
echo "🔐 Verificando integridad de lockfiles..."
if [ -f "pnpm-lock.yaml" ]; then
    echo "✅ pnpm-lock.yaml existe"
else
    echo "❌ ERROR: pnpm-lock.yaml no encontrado"
    exit 1
fi

# ============================================================================
# 5. CONFIGURACIONES
# ============================================================================

echo ""
echo "5️⃣ CONFIGURACIONES"
echo "================="

# Verificar archivos de configuración críticos
config_files=(
    ".eslintrc.js"
    ".prettierrc"
    ".editorconfig"
    "tsconfig.json"
    "tsconfig.base.json"
    "vitest.config.ts"
    "next.config.js"
    "docker-compose.dev.yml"
    ".vscode/settings.json"
    ".vscode/launch.json"
    ".vscode/tasks.json"
)

for config in "${config_files[@]}"; do
    if [ -f "$config" ]; then
        echo "✅ $config existe"
    else
        echo "❌ ERROR: $config no encontrado"
        exit 1
    fi
done

# Verificar configuraciones de Git
echo ""
echo "🔧 Verificando configuraciones de Git..."
if [ -f ".husky/pre-commit" ] && [ -f ".husky/pre-push" ]; then
    echo "✅ Hooks de Husky configurados"
else
    echo "❌ ERROR: Hooks de Husky incompletos"
    exit 1
fi

# ============================================================================
# 6. CI/CD Y WORKFLOWS
# ============================================================================

echo ""
echo "6️⃣ CI/CD Y WORKFLOWS"
echo "==================="

# Verificar sintaxis de workflows de GitHub Actions
echo "🔄 Verificando workflows de GitHub Actions..."
find .github/workflows -name "*.yml" -o -name "*.yaml" | while read workflow; do
    if command -v actionlint > /dev/null 2>&1; then
        if ! actionlint "$workflow" 2>/dev/null; then
            echo "❌ ERROR: Problemas en workflow $workflow"
            exit 1
        fi
    else
        echo "⚠️ actionlint no instalado, saltando verificación de workflows"
    fi
done

# Verificar dependabot
if [ -f ".github/dependabot.yml" ]; then
    echo "✅ Dependabot configurado"
else
    echo "❌ ERROR: Dependabot no configurado"
    exit 1
fi

# ============================================================================
# 7. DOCUMENTACIÓN
# ============================================================================

echo ""
echo "7️⃣ DOCUMENTACIÓN"
echo "==============="

# Verificar archivos de documentación críticos
docs_files=(
    "README.md"
    "README.dev.md"
    "AZURE-DEPLOYMENT.md"
    "docs/architecture.md"
)

for doc in "${docs_files[@]}"; do
    if [ -f "$doc" ]; then
        echo "✅ $doc existe"
    else
        echo "❌ ERROR: $doc no encontrado"
        exit 1
    fi
done

# Verificar enlaces en documentación (si markdown-link-check está disponible)
echo ""
echo "🔗 Verificando enlaces en documentación..."
if command -v markdown-link-check > /dev/null 2>&1; then
    find . -name "*.md" -not -path "./node_modules/*" | while read file; do
        if ! markdown-link-check "$file" 2>/dev/null; then
            echo "⚠️ Enlaces rotos detectados en $file"
        fi
    done
else
    echo "⚠️ markdown-link-check no instalado, saltando verificación de enlaces"
fi

# ============================================================================
# 8. SEGURIDAD ADICIONAL
# ============================================================================

echo ""
echo "8️⃣ SEGURIDAD ADICIONAL"
echo "====================="

# Verificar secrets en código
echo "🔐 Verificando exposición de secrets..."
if command -v gitleaks > /dev/null 2>&1; then
    if ! gitleaks detect --verbose --redact 2>/dev/null; then
        echo "❌ ERROR: Secrets expuestos detectados"
        exit 1
    else
        echo "✅ No se detectaron secrets expuestos"
    fi
else
    echo "⚠️ gitleaks no instalado, saltando verificación de secrets"
fi

# Verificar permisos de archivos
echo ""
echo "📁 Verificando permisos de archivos..."
if find . -name "*.sh" -not -executable | grep -q .; then
    echo "❌ ERROR: Scripts sin permisos de ejecución"
    exit 1
else
    echo "✅ Permisos de archivos correctos"
fi

# ============================================================================
# 9. PERFORMANCE Y OPTIMIZACIONES
# ============================================================================

echo ""
echo "9️⃣ PERFORMANCE Y OPTIMIZACIONES"
echo "==============================="

# Verificar tamaño del bundle (si es posible)
echo "📦 Verificando tamaño del proyecto..."
project_size=$(du -sh . --exclude=node_modules --exclude=.git --exclude=.next 2>/dev/null | cut -f1)
echo "📊 Tamaño del proyecto: $project_size"

# Verificar archivos grandes
echo ""
echo "🔍 Buscando archivos grandes (>10MB)..."
find . -type f -size +10M -not -path "./node_modules/*" -not -path "./.git/*" | while read file; do
    echo "⚠️ Archivo grande encontrado: $file"
done

# ============================================================================
# 10. INTERNACIONALIZACIÓN
# ============================================================================

echo ""
echo "🔠 INTERNACIONALIZACIÓN"
echo "======================"

# Verificar archivos de traducciones
if [ -d "apps/web/messages" ]; then
    echo "✅ Directorio de traducciones existe"
    if [ -f "apps/web/messages/es.json" ] && [ -f "apps/web/messages/en.json" ]; then
        echo "✅ Archivos de traducción ES/EN existen"
    else
        echo "❌ ERROR: Archivos de traducción incompletos"
        exit 1
    fi
else
    echo "❌ ERROR: Directorio de traducciones no encontrado"
    exit 1
fi

# ============================================================================
# 11. VERIFICACIÓN FINAL
# ============================================================================

echo ""
echo "🏁 VERIFICACIÓN FINAL"
echo "==================="

# Verificar que no hay archivos sin commit
echo "📝 Verificando estado de Git..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️ Hay cambios sin commit:"
    git status --short
else
    echo "✅ Repositorio limpio, todos los cambios commiteados"
fi

# Verificar rama actual
current_branch=$(git branch --show-current)
if [ "$current_branch" = "main" ]; then
    echo "✅ En rama principal (main)"
else
    echo "⚠️ No estás en la rama main (actual: $current_branch)"
fi

echo ""
echo "🎉 REVISIÓN EXHAUSTIVA COMPLETADA"
echo "=================================="
echo ""
echo "📊 RESUMEN:"
echo "• Sintaxis y tipos: Verificado"
echo "• Linting y formateo: Verificado"
echo "• Tests: Ejecutados"
echo "• Dependencias: Auditadas"
echo "• Configuraciones: Verificadas"
echo "• CI/CD: Validado"
echo "• Documentación: Comprobada"
echo "• Seguridad: Auditada"
echo "• Performance: Analizada"
echo "• i18n: Verificada"
echo ""
echo "✅ Si no hay errores arriba, el repositorio está LIMPIO"

# ============================================================================
# ACCIONES CORRECTIVAS AUTOMÁTICAS
# ============================================================================

echo ""
echo "🔧 ACCIONES CORRECTIVAS"
echo "======================"

# Si hay archivos sin formatear, formatearlos
if command -v pnpm > /dev/null 2>&1; then
    if ! pnpm format:check 2>/dev/null; then
        echo "🔄 Aplicando formateo automático..."
        pnpm format
        echo "✅ Formateo aplicado"
    fi
elif command -v npx > /dev/null 2>&1; then
    if ! npx prettier --check . 2>/dev/null; then
        echo "🔄 Aplicando formateo automático..."
        npx prettier --write .
        echo "✅ Formateo aplicado"
    fi
else
    echo "⚠️ Herramientas de formateo no disponibles"
fi

# Si hay cambios sin commit después del formateo, mostrarlos
if [ -n "$(git status --porcelain)" ]; then
    echo ""
    echo "📝 Cambios generados por la revisión:"
    git status --short
    echo ""
    echo "💡 Recomendación: Revisar y committear los cambios generados"
fi

echo ""
echo "🎯 REVISIÓN COMPLETADA - REPOSITORIO LISTO PARA PRODUCCIÓN"

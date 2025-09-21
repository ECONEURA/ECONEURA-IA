#!/usr/bin/env bash
# 🔍 ANÁLISIS EXHAUSTIVO DE WORKFLOWS DE GITHUB ACTIONS
# Fecha: $(date)
set -euo pipefail

echo "🔍 ANÁLISIS EXHAUSTIVO DE WORKFLOWS"
echo "===================================="

WORKFLOWS_DIR=".github/workflows"
#!/usr/bin/env bash
# 🔍 ANÁLISIS EXHAUSTIVO DE WORKFLOWS DE GITHUB ACTIONS
# Fecha: $(date -Iseconds)
set -euo pipefail

echo "🔍 ANÁLISIS EXHAUSTIVO DE WORKFLOWS"
echo "===================================="

WORKFLOWS_DIR=".github/workflows"
ARTIFACTS_DIR="artifacts"
LOG_FILE="$ARTIFACTS_DIR/analisis-workflows.log"
ISSUES_FOUND=0
WORKFLOW_COUNT=0

mkdir -p "$ARTIFACTS_DIR"
echo "Fecha de análisis: $(date -Iseconds)" > "$LOG_FILE"

action_has_command() {
    command -v "$1" >/dev/null 2>&1
}

analyze_workflow() {
    local file="$1"
    local base
    base=$(basename "$file")

    echo "" | tee -a "$LOG_FILE"
    echo "📄 Analizando: $base" | tee -a "$LOG_FILE"
    echo "────────────────────────" | tee -a "$LOG_FILE"

    WORKFLOW_COUNT=$((WORKFLOW_COUNT + 1))

    # yamllint si está disponible (formato/estilo)
    if action_has_command yamllint; then
        if ! yamllint -d '{extends: default, rules: {line-length: {max: 120}}}' "$file" >> "$LOG_FILE" 2>&1; then
            echo "⚠️  Posibles problemas de formato YAML (yamllint)" | tee -a "$LOG_FILE"
        else
            echo "✅ yamllint OK: $base" | tee -a "$LOG_FILE"
        fi
    fi

    # Validación estructural con PyYAML si está disponible
    if python3 -c "import yaml" >/dev/null 2>&1; then
        if ! python3 - <<PY_EOF >> "$LOG_FILE" 2>&1
import sys, yaml
f = sys.argv[1]
try:
    yaml.safe_load(open(f))
except Exception as e:
    print('PY_ERR: %s' % e)
    sys.exit(2)
PY_EOF
        then
            echo "❌ Error de sintaxis YAML en: $base" | tee -a "$LOG_FILE"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
            return 1
        else
            echo "✅ YAML válido: $base" | tee -a "$LOG_FILE"
        fi
    else
        echo "⚠️ PyYAML no disponible: se omitirá validación estructural (instalar 'pyyaml' para comprobación profunda)" | tee -a "$LOG_FILE"
        echo "ℹ️ Se usan heurísticas en su lugar" | tee -a "$LOG_FILE"
    fi

    # Heurísticas y checks básicos
    local jobs_count
    jobs_count=$(grep -E "^[[:space:]]{2}[a-zA-Z_][a-zA-Z0-9_-]*:" "$file" | wc -l || true)
    echo "⚙️  Jobs heurísticos contados: $jobs_count" | tee -a "$LOG_FILE"

    if ! grep -q "runs-on:" "$file"; then
        echo "❌ ERROR: No hay 'runs-on' definido en el workflow" | tee -a "$LOG_FILE"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi

    if grep -q "set-env" "$file" || grep -q "add-path" "$file"; then
        echo "❌ Uso de features deprecated (set-env/add-path)" | tee -a "$LOG_FILE"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi

    if grep -q "node-version:" "$file"; then
        local node_versions
        node_versions=$(grep "node-version:" "$file" | sed 's/.*node-version:[[:space:]]*//' | tr -d '"' | sort -u || true)
        echo "📦 Versiones de Node.js detectadas: $node_versions" | tee -a "$LOG_FILE"
    fi

    if grep -q "permissions:" "$file"; then
        echo "🔐 Permisos definidos" | tee -a "$LOG_FILE"
    else
        echo "⚠️  Sin 'permissions' definido (usar permisos mínimos)" | tee -a "$LOG_FILE"
    fi

    # Detectar secrets usados
    local secrets
    secrets=$(grep -o "\${{[[:space:]]*secrets\.[^}]*}}" "$file" | sed 's/\${{[[:space:]]*secrets\.//' | sed 's/}}//' | tr -d ' ' | sort -u || true)
    if [ -n "$secrets" ]; then
        echo "🔑 Secrets usados: $secrets" | tee -a "$LOG_FILE"
    fi

    echo "✅ Análisis completado: $base" | tee -a "$LOG_FILE"
}


# Ejecutar análisis sobre todos los workflows
if [ ! -d "$WORKFLOWS_DIR" ]; then
    echo "❌ Carpeta de workflows no encontrada: $WORKFLOWS_DIR" | tee -a "$LOG_FILE"
    exit 1
fi

echo "🔍 Analizando workflows en: $WORKFLOWS_DIR" | tee -a "$LOG_FILE"

shopt -s nullglob
for workflow in "$WORKFLOWS_DIR"/*.yml "$WORKFLOWS_DIR"/*.yaml; do
    if [ -f "$workflow" ]; then
        analyze_workflow "$workflow" || true
    fi
done
shopt -u nullglob

# Resumen
echo "" | tee -a "$LOG_FILE"
echo "📊 RESUMEN DEL ANÁLISIS" | tee -a "$LOG_FILE"
echo "=======================" | tee -a "$LOG_FILE"
echo "📄 Workflows analizados: $WORKFLOW_COUNT" | tee -a "$LOG_FILE"
echo "❌ Problemas encontrados: $ISSUES_FOUND" | tee -a "$LOG_FILE"

if [ "$ISSUES_FOUND" -eq 0 ]; then
    echo "🎉 ¡Todos los workflows están correctos!" | tee -a "$LOG_FILE"
else
    echo "⚠️  Se encontraron $ISSUES_FOUND problemas que requieren atención" | tee -a "$LOG_FILE"
fi

echo "" | tee -a "$LOG_FILE"
echo "💡 Recomendaciones generales:" | tee -a "$LOG_FILE"
echo "• Usar permisos mínimos necesarios" | tee -a "$LOG_FILE"
echo "• Definir timeouts apropiados" | tee -a "$LOG_FILE"
echo "• Usar versiones recientes de actions" | tee -a "$LOG_FILE"
echo "• Evitar features deprecated" | tee -a "$LOG_FILE"
echo "• Definir concurrency para optimizar recursos" | tee -a "$LOG_FILE"
    echo "• Evitar features deprecated" | tee -a "$LOG_FILE"

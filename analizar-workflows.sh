#!/usr/bin/env bash
# 🔍 ANÁLISIS EXHAUSTIVO DE WORKFLOWS DE GITHUB ACTIONS
# Fecha: $(date)
set -euo pipefail

echo "🔍 ANÁLISIS EXHAUSTIVO DE WORKFLOWS"
echo "===================================="

WORKFLOWS_DIR=".github/workflows"
ARTIFACTS_DIR="artifacts"
LOG_FILE="$ARTIFACTS_DIR/analisis-workflows.log"
JSON_OUT="$ARTIFACTS_DIR/analisis-workflows.json"
ISSUES_FOUND=0
WORKFLOW_COUNT=0
FAIL_ON=${FAIL_ON:-""}

mkdir -p "$ARTIFACTS_DIR"
echo "Fecha de análisis: $(date -Iseconds)" > "$LOG_FILE"
echo "[]" > "$JSON_OUT"

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

    # Prepare per-workflow JSON object
    local wf_json
    wf_json=$(mktemp)
    echo "{\"file\": \"$base\", \"issues\": [], \"meta\": {}}" > "$wf_json"

    # yamllint si está disponible (formato/estilo)
    if action_has_command yamllint; then
        if ! yamllint -d '{extends: default, rules: {line-length: {max: 120}}}' "$file" >> "$LOG_FILE" 2>&1; then
            echo "⚠️  Posibles problemas de formato YAML (yamllint)" | tee -a "$LOG_FILE"
            jq --arg f "yamllint issues" '.issues += [$f]' "$wf_json" > "$wf_json.tmp" && mv "$wf_json.tmp" "$wf_json" || true
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
            jq --arg f "yaml_syntax_error" '.issues += [$f]' "$wf_json" > "$wf_json.tmp" && mv "$wf_json.tmp" "$wf_json" || true
            # append to global JSON and return
            jq --slurpfile add "$wf_json" '.[0:-1] + [$add[0]]' "$JSON_OUT" > "$JSON_OUT.tmp" && mv "$JSON_OUT.tmp" "$JSON_OUT" || true
            rm -f "$wf_json"
            return 1
        else
            echo "✅ YAML válido: $base" | tee -a "$LOG_FILE"
        fi
    else
        echo "⚠️ PyYAML no disponible: se omitirá validación estructural (instalar 'pyyaml' para comprobación profunda)" | tee -a "$LOG_FILE"
        echo "ℹ️ Se usan heurísticas en su lugar" | tee -a "$LOG_FILE"
        jq --arg f "pyyaml_missing" '.meta.pyyaml = true' "$wf_json" > "$wf_json.tmp" && mv "$wf_json.tmp" "$wf_json" || true
    fi

    # Heurísticas y checks básicos
    local jobs_count
    jobs_count=$(grep -E "^[[:space:]]{2}[a-zA-Z_][a-zA-Z0-9_-]*:" "$file" | wc -l || true)
    echo "⚙️  Jobs heurísticos contados: $jobs_count" | tee -a "$LOG_FILE"
    jq --argjson jc "$jobs_count" '.meta.jobs_count = $jc' "$wf_json" > "$wf_json.tmp" && mv "$wf_json.tmp" "$wf_json" || true

    if ! grep -q "runs-on:" "$file"; then
        echo "❌ ERROR: No hay 'runs-on' definido en el workflow" | tee -a "$LOG_FILE"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
        jq --arg f "missing_runs_on" '.issues += [$f]' "$wf_json" > "$wf_json.tmp" && mv "$wf_json.tmp" "$wf_json" || true
    fi

    if grep -q "set-env" "$file" || grep -q "add-path" "$file"; then
        echo "❌ Uso de features deprecated (set-env/add-path)" | tee -a "$LOG_FILE"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
        jq --arg f "deprecated_features" '.issues += [$f]' "$wf_json" > "$wf_json.tmp" && mv "$wf_json.tmp" "$wf_json" || true
    fi

    if grep -q "node-version:" "$file"; then
        local node_versions
        node_versions=$(grep "node-version:" "$file" | sed 's/.*node-version:[[:space:]]*//' | tr -d '"' | sort -u || true)
        echo "📦 Versiones de Node.js detectadas: $node_versions" | tee -a "$LOG_FILE"
        jq --arg nv "$node_versions" '.meta.node_versions = $nv' "$wf_json" > "$wf_json.tmp" && mv "$wf_json.tmp" "$wf_json" || true
    fi

    if grep -q "permissions:" "$file"; then
        echo "🔐 Permisos definidos" | tee -a "$LOG_FILE"
    else
        echo "⚠️  Sin 'permissions' definido (usar permisos mínimos)" | tee -a "$LOG_FILE"
        jq --arg f "missing_permissions" '.issues += [$f]' "$wf_json" > "$wf_json.tmp" && mv "$wf_json.tmp" "$wf_json" || true
    fi

    # Detectar secrets usados
    local secrets
    secrets=$(grep -o "\${{[[:space:]]*secrets\.[^}]*}}" "$file" | sed 's/\${{[[:space:]]*secrets\.//' | sed 's/}}//' | tr -d ' ' | sort -u || true)
    if [ -n "$secrets" ]; then
        echo "🔑 Secrets usados: $secrets" | tee -a "$LOG_FILE"
        jq --arg s "$secrets" '.meta.secrets = $s' "$wf_json" > "$wf_json.tmp" && mv "$wf_json.tmp" "$wf_json" || true
    fi

    # Detectar pasos/acciones que parecen hacer deploy
    if grep -E "(deploy|kubernetes|kubectl|helm|cloudsmith|gcloud|aws s3|aws ecr|docker push|buildx)" -ni "$file" >/dev/null 2>&1; then
        echo "🚨 Posible paso de deploy encontrado en: $base" | tee -a "$LOG_FILE"
        jq --arg f "possible_deploy_step" '.issues += [$f]' "$wf_json" > "$wf_json.tmp" && mv "$wf_json.tmp" "$wf_json" || true
        # comprobar guardas NO_DEPLOY
        if grep -q "DEPLOY_ENABLED" "$file" || grep -q "SKIP_RELEASE" "$file" || grep -q "if:.*env.DEPLOY_ENABLED" "$file"; then
            echo "🛡️ Guardas NO_DEPLOY detectadas en workflow" | tee -a "$LOG_FILE"
            jq --arg f "no_deploy_guard_present" '.meta.no_deploy_guard = true' "$wf_json" > "$wf_json.tmp" && mv "$wf_json.tmp" "$wf_json" || true
        else
            echo "⚠️ No se detectaron guardas NO_DEPLOY -> riesgo de despliegue sin control" | tee -a "$LOG_FILE"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
            jq --arg f "no_deploy_guard_missing" '.issues += [$f]' "$wf_json" > "$wf_json.tmp" && mv "$wf_json.tmp" "$wf_json" || true
        fi
    fi

    echo "✅ Análisis completado: $base" | tee -a "$LOG_FILE"

    # append wf_json to global JSON_OUT
    jq --slurpfile add "$wf_json" '. + [$add[0]]' "$JSON_OUT" > "$JSON_OUT.tmp" && mv "$JSON_OUT.tmp" "$JSON_OUT" || true
    rm -f "$wf_json"
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
        if ! analyze_workflow "$workflow"; then
            echo "⚠️  analyze_workflow reported an issue for $workflow" | tee -a "$LOG_FILE"
        fi
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

# Salida JSON ya escrita en $JSON_OUT
echo "JSON output: $JSON_OUT" | tee -a "$LOG_FILE"

# manejar flag --fail-on
if [ -n "${1:-}" ]; then
    case "$1" in
        --fail-on=*)
            FAIL_ON_VAL=${1#*=}
            ;;
    esac
fi

if [ -n "$FAIL_ON_VAL" ]; then
    if [ "$FAIL_ON_VAL" = "any" ] && [ "$ISSUES_FOUND" -gt 0 ]; then
        echo "Failing due to --fail-on=any and $ISSUES_FOUND issues found" | tee -a "$LOG_FILE"
        exit 2
    fi
fi

echo "" | tee -a "$LOG_FILE"
echo "💡 Recomendaciones generales:" | tee -a "$LOG_FILE"
echo "• Usar permisos mínimos necesarios" | tee -a "$LOG_FILE"
echo "• Definir timeouts apropiados" | tee -a "$LOG_FILE"
echo "• Usar versiones recientes de actions" | tee -a "$LOG_FILE"
echo "• Evitar features deprecated" | tee -a "$LOG_FILE"
echo "• Definir concurrency para optimizar recursos" | tee -a "$LOG_FILE"
    echo "• Evitar features deprecated" | tee -a "$LOG_FILE"

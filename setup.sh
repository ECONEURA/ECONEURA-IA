#!/usr/bin/env bash
# ⚙️ ECONEURA - Configuración del Sistema
# Configura el entorno completo de ECONEURA

echo -e "\033[1;35m⚙️  CONFIGURANDO ECONEURA - IA OPERATIVA MODULAR\033[0m"
echo "=================================================="

# Verificar estructura de directorios
echo -e "\033[1;34m📁 Verificando estructura...\033[0m"
DIRS=("core" "agents" "logs" "scripts" "config" "audit" "data")
for dir in "${DIRS[@]}"; do
    if [[ -d "$dir" ]]; then
        echo -e "\033[1;32m✅ $dir\033[0m"
    else
        echo -e "\033[1;31m❌ $dir (faltante)\033[0m"
    fi
done

# Verificar scripts
echo -e "\n\033[1;34m📜 Verificando scripts...\033[0m"
SCRIPTS=("ai.sh" "audit.sh" "ai-run.sh" "favorites.sh" "learn.sh" "history.sh" "batch.sh")
for script in "${SCRIPTS[@]}"; do
    if [[ -x "$script" ]]; then
        echo -e "\033[1;32m✅ $script\033[0m"
    else
        echo -e "\033[1;31m❌ $script (no ejecutable)\033[0m"
    fi
done

# Verificar archivos de datos
echo -e "\n\033[1;34m💾 Verificando archivos de datos...\033[0m"
DATA_FILES=("data/history.log" "data/favorites.log" "data/learned.log")
for file in "${DATA_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo -e "\033[1;32m✅ $file\033[0m"
    else
        echo -e "\033[1;31m❌ $file (faltante)\033[0m"
    fi
done

# Crear archivos de configuración
echo -e "\n\033[1;34m🔧 Creando configuración...\033[0m"
cat > config/econeura.conf << EOF
# ECONEURA Configuration
AI_ENGINE=mistral
LOG_LEVEL=INFO
AUDIT_ENABLED=true
SAFE_EXECUTION=true
HISTORY_SIZE=1000
EOF
echo -e "\033[1;32m✅ config/econeura.conf\033[0m"

# Mostrar estado final
echo -e "\n\033[1;35m🎉 CONFIGURACIÓN COMPLETADA\033[0m"
echo "=================================="
echo -e "\033[1;32m🚀 ECONEURA listo para usar!\033[0m"
echo ""
echo -e "\033[1;36mComandos disponibles:\033[0m"
echo "  ./ai.sh 'tu pregunta'          # IA conversacional"
echo "  ./audit.sh 'operación'         # Auditoría automática"
echo "  ./ai-run.sh 'acción'           # Ejecución segura"
echo "  ./favorites.sh 'comando'       # Guardar favorito"
echo "  ./learn.sh 'cmd|desc'          # Enseñar comando"
echo "  ./history.sh                   # Ver historial"
echo "  ./batch.sh 'q1;q2;q3'          # Procesamiento por lotes"
#!/bin/bash

# Script de limpieza automática para ECONEURA-IA
# Mantiene el directorio raíz organizado y elimina archivos temporales

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/cleanup-$(date +%Y%m%d-%H%M%S).log"

# Función de logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "🧹 Iniciando limpieza automática de ECONEURA-IA"

# Contadores
files_removed=0
dirs_removed=0

# 1. Limpiar archivos temporales comunes
log "📄 Eliminando archivos temporales..."
TEMP_PATTERNS=(
    "*.log"
    "*.tmp"
    "*.temp"
    "*.bak"
    "*.backup"
    "*.old"
    "*.orig"
    "*.rej"
    "*~"
    "*.swp"
    "*.swo"
    ".DS_Store"
    "Thumbs.db"
    "Desktop.ini"
)

for pattern in "${TEMP_PATTERNS[@]}"; do
    if compgen -G "$pattern" > /dev/null; then
        count=$(ls -1 $pattern 2>/dev/null | wc -l)
        if [ "$count" -gt 0 ]; then
            rm -f $pattern
            files_removed=$((files_removed + count))
            log "   ✅ Eliminados $count archivos: $pattern"
        fi
    fi
done

# 2. Limpiar directorios temporales
log "📁 Eliminando directorios temporales..."
TEMP_DIRS=(
    "tmp/"
    "temp/"
    ".tmp/"
    ".temp/"
    "cache/"
    "node_modules/.cache/"
    ".next/cache/"
)

for dir in "${TEMP_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        rm -rf "$dir"
        dirs_removed=$((dirs_removed + 1))
        log "   ✅ Eliminado directorio: $dir"
    fi
done

# 3. Limpiar archivos específicos del proyecto
log "🎯 Limpiando archivos específicos del proyecto..."

# Archivos de activación/checklist
if ls checklist_*.log >/dev/null 2>&1; then
    rm -f checklist_*.log
    count=$(ls checklist_*.log 2>/dev/null | wc -l)
    files_removed=$((files_removed + count))
    log "   ✅ Eliminados archivos de checklist"
fi

# Archivos de resumen
if ls resumen_*.log >/dev/null 2>&1; then
    rm -f resumen_*.log
    count=$(ls resumen_*.log 2>/dev/null | wc -l)
    files_removed=$((files_removed + count))
    log "   ✅ Eliminados archivos de resumen"
fi

# Archivos de ejecución
if ls ejecucion_*.log >/dev/null 2>&1; then
    rm -f ejecucion_*.log
    count=$(ls ejecucion_*.log 2>/dev/null | wc -l)
    files_removed=$((files_removed + count))
    log "   ✅ Eliminados archivos de ejecución"
fi

# 4. Limpiar archivos de emergency (mantener solo los últimos 5)
log "🚨 Gestionando archivos de emergency..."
if ls emergency_*.sh >/dev/null 2>&1; then
    ls -t emergency_*.sh | tail -n +6 | xargs rm -f
    count=$(ls emergency_*.sh 2>/dev/null | wc -l)
    log "   ✅ Manteniendo $count archivos de emergency más recientes"
fi

# 5. Verificar y reportar
log "📊 RESULTADO DE LA LIMPIEZA:"
log "   🗂️  Archivos eliminados: $files_removed"
log "   📁 Directorios eliminados: $dirs_removed"
log "   📍 Log de limpieza: $LOG_FILE"

# 6. Verificación final
remaining_temp=$(find . -maxdepth 1 -name "*.log" -o -name "*.tmp" -o -name "*.bak" | wc -l)
if [ "$remaining_temp" -eq 0 ]; then
    log "✅ Directorio raíz completamente limpio"
else
    log "⚠️  Quedan $remaining_temp archivos temporales"
fi

log "🎉 Limpieza completada exitosamente"

# Auto-limpieza del log después de 7 días
echo "#!/bin/bash" > /tmp/cleanup-old-logs.sh
echo "find $SCRIPT_DIR -name 'cleanup-*.log' -mtime +7 -delete" >> /tmp/cleanup-old-logs.sh
chmod +x /tmp/cleanup-old-logs.sh
/tmp/cleanup-old-logs.sh
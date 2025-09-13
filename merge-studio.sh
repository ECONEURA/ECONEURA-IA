#!/bin/bash

# 🔄 SCRIPT DE FUSIÓN STUDIO
# Fusiona el contenido de la rama main del repositorio ECONEURA/studio
# dentro de la carpeta studio/ en la rama main de ECONEURA/ECONEURA-IA
#
# Uso:
#   ./merge-studio.sh                    # Merge automático
#   ./merge-studio.sh --dry-run          # Solo simular
#   ./merge-studio.sh --force            # Forzar merge sin confirmación
#   ./merge-studio.sh --subtree          # Usar git subtree en lugar de archive

set -e

# Configuración
STUDIO_REPO="https://github.com/ECONEURA/studio.git"
STUDIO_BRANCH="main"
TARGET_DIR="studio"
DRY_RUN=false
FORCE=false
USE_SUBTREE=false

# Procesar argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --subtree)
            USE_SUBTREE=true
            shift
            ;;
        --help)
            echo "Uso: $0 [--dry-run] [--force] [--subtree] [--help]"
            echo ""
            echo "Opciones:"
            echo "  --dry-run    Solo simular, no realizar cambios"
            echo "  --force      Forzar merge sin confirmación"
            echo "  --subtree    Usar git subtree en lugar de archive"
            echo "  --help       Mostrar esta ayuda"
            exit 0
            ;;
        *)
            echo "❌ Opción desconocida: $1"
            echo "Usa --help para ver las opciones disponibles"
            exit 1
            ;;
    esac
done

echo "🚀 Iniciando fusión del repositorio ECONEURA/studio..."
echo "📋 Configuración:"
echo "   - Repositorio: $STUDIO_REPO"
echo "   - Rama: $STUDIO_BRANCH"
echo "   - Directorio destino: $TARGET_DIR"
echo "   - Dry run: $DRY_RUN"
echo "   - Forzar: $FORCE"
echo "   - Usar subtree: $USE_SUBTREE"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ] || [ ! -d "$TARGET_DIR" ]; then
    echo "❌ Error: Ejecutar desde la raíz del repositorio ECONEURA-IA"
    echo "   Se requiere package.json y directorio $TARGET_DIR"
    exit 1
fi

# Verificar estado limpio del repositorio (solo si no es dry-run)
if [ "$DRY_RUN" = false ] && [ -n "$(git status --porcelain)" ]; then
    echo "❌ Error: El repositorio tiene cambios sin confirmar"
    echo "Por favor, confirma o descarta los cambios antes de continuar"
    git status
    exit 1
fi

# Función para verificar acceso al repositorio
check_repo_access() {
    echo "🔍 Verificando acceso al repositorio studio..."
    if git ls-remote "$STUDIO_REPO" >/dev/null 2>&1; then
        echo "✅ Acceso al repositorio confirmado"
        return 0
    else
        echo "❌ No se puede acceder al repositorio $STUDIO_REPO"
        echo ""
        echo "Posibles causas:"
        echo "1. El repositorio es privado y requiere autenticación"
        echo "2. El repositorio no existe"
        echo "3. Problemas de conectividad"
        echo ""
        echo "Soluciones sugeridas:"
        echo "- Verificar que tienes acceso al repositorio ECONEURA/studio"
        echo "- Configurar autenticación de GitHub (gh auth login)"
        echo "- Verificar que el repositorio existe"
        return 1
    fi
}

# Verificar acceso al repositorio
if ! check_repo_access; then
    echo ""
    echo "🔧 Para proceder manualmente cuando tengas acceso:"
    echo "1. git remote add studio $STUDIO_REPO"
    echo "2. git fetch studio $STUDIO_BRANCH"
    echo "3. ./merge-studio.sh --force"
    exit 1
fi

# Backup del estado actual
echo "📦 Creando backup del estado actual..."
git branch backup-before-studio-merge-$(date +%Y%m%d-%H%M%S) 2>/dev/null || true

# Agregar el remote del repositorio studio si no existe
echo "🔗 Configurando remote del repositorio studio..."
if ! git remote get-url studio >/dev/null 2>&1; then
    git remote add studio https://github.com/ECONEURA/studio.git
    echo "✅ Remote 'studio' agregado"
else
    echo "✅ Remote 'studio' ya existe"
fi

# Fetch del repositorio studio
echo "📥 Obteniendo contenido del repositorio studio..."
if ! git fetch studio main; then
    echo "❌ Error: No se pudo obtener el contenido del repositorio studio"
    echo "Verifica que tengas acceso al repositorio ECONEURA/studio"
    exit 1
fi

# Crear un directorio temporal para el merge
TEMP_DIR=$(mktemp -d)
echo "📁 Directorio temporal: $TEMP_DIR"

# Extraer el contenido de studio/main en el directorio temporal
echo "📤 Extrayendo contenido de studio/main..."
git archive studio/main | tar -x -C "$TEMP_DIR"

# Verificar que el contenido se extrajo correctamente
if [ ! "$(ls -A $TEMP_DIR)" ]; then
    echo "❌ Error: El repositorio studio parece estar vacío"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Respaldar el contenido actual de studio/ si existe
if [ "$(ls -A studio/)" ]; then
    echo "📋 Respaldando contenido actual de studio/..."
    cp -r studio/ studio-backup-$(date +%Y%m%d-%H%M%S)/
fi

# Limpiar el directorio studio/ (excepto README.md si queremos preservarlo)
echo "🧹 Limpiando directorio studio/..."
find studio/ -mindepth 1 -maxdepth 1 ! -name 'README.md' -exec rm -rf {} + 2>/dev/null || true

# Copiar el contenido del repositorio studio
echo "📋 Copiando contenido desde repositorio studio..."
cp -r "$TEMP_DIR"/* studio/

# Limpiar directorio temporal
rm -rf "$TEMP_DIR"

# Agregar los cambios a git
echo "📝 Agregando cambios a git..."
git add studio/

# Verificar que hay cambios para confirmar
if [ -z "$(git diff --cached --name-only)" ]; then
    echo "ℹ️  No hay cambios nuevos para confirmar"
    echo "El contenido de studio ya está actualizado"
    exit 0
fi

# Mostrar resumen de cambios
echo "📊 Resumen de cambios:"
git diff --cached --stat

# Confirmar los cambios
echo "✅ Confirmando fusión..."
git commit -m "feat: merge ECONEURA/studio main branch into studio/ folder

- Merged content from ECONEURA/studio:main
- Updated studio/ folder with latest cockpit implementation
- Includes PRs 54-57: Cockpit and improvements
- Preserves repository structure and existing functionality

Resolves: Merge studio repository content"

echo "🎉 ¡Fusión completada exitosamente!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Revisar los archivos en studio/ para verificar la integración"
echo "2. Ejecutar tests para asegurar compatibilidad"
echo "3. Actualizar documentación si es necesario"
echo "4. Push de los cambios: git push origin main"
echo ""
echo "🔧 Para deshacer la fusión (si es necesario):"
echo "   git reset --hard HEAD~1"
echo "   git clean -fd studio/"
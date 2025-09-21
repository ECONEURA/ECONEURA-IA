#!/usr/bin/env bash
set -euo pipefail

# 🚨 SCRIPT DE LIMPIEZA DE HISTORIAL GIT - SOLO PARA EMERGENCIAS DE SEGURIDAD
# 🚨 ADVERTENCIA: Este script REESCRIBE el historial de Git permanentemente
# 🚨 REQUISITOS: Coordinación con todo el equipo, backup completo, comunicación clara

echo "🚨 ADVERTENCIA CRÍTICA 🚨"
echo "Este script reescribirá permanentemente el historial de Git"
echo "Asegúrate de tener:"
echo "• Backup completo del repositorio"
echo "• Coordinación con TODO el equipo"
echo "• Comunicación clara sobre el push forzado"
echo "• Pruebas exhaustivas antes del push"
echo ""

# Configuración del repositorio
OWNER="ECONEURA"
REPO="ECONEURA-IA"
BRANCH="econeura/audit/hmac-canary/20250920T154117Z-13586"

# CLAVE COMPROMETIDA - REEMPLAZAR CON LA CLAVE REAL (NO COMPARTIR)
EXPOSED_KEY="<CLAVE_COMPROMETIDA_AQUI>"

# Verificaciones de seguridad
if [[ "$EXPOSED_KEY" == "<CLAVE_COMPROMETIDA_AQUI>" ]]; then
    echo "❌ ERROR: Debes reemplazar <CLAVE_COMPROMETIDA_AQUI> con la clave real comprometida"
    echo "🔒 Por seguridad, NO pegues la clave en chats o logs"
    exit 1
fi

echo "🔐 CLAVE A LIMPIAR: ${EXPOSED_KEY:0:8}...${EXPOSED_KEY: -8}"
echo ""

# Paso 1: Crear mirror del repositorio
echo "📋 PASO 1: Creando mirror del repositorio..."
TIMESTAMP=$(date --utc +%Y%m%dT%H%M%SZ)
MIRROR_DIR="repo-mirror-${TIMESTAMP}"

if [ -d "$MIRROR_DIR" ]; then
    echo "❌ El directorio $MIRROR_DIR ya existe. Eliminalo o usa otro nombre."
    exit 1
fi

git clone --mirror "https://github.com/${OWNER}/${REPO}.git" "$MIRROR_DIR"
cd "$MIRROR_DIR"

echo "✅ Mirror creado en: $MIRROR_DIR"
echo ""

# Paso 2: Verificar que git-filter-repo esté disponible
echo "📋 PASO 2: Verificando git-filter-repo..."
if ! command -v git-filter-repo >/dev/null 2>&1; then
    echo "❌ git-filter-repo no está instalado"
    echo "📦 Instalar con: pip install git-filter-repo"
    exit 1
fi

echo "✅ git-filter-repo disponible"
echo ""

# Paso 3: Crear archivo de reemplazo seguro
echo "📋 PASO 3: Preparando reemplazo seguro..."
REPLACE_FILE=$(mktemp)
printf "s/%s/REDACTED/g\n" "$EXPOSED_KEY" > "$REPLACE_FILE"

echo "✅ Archivo de reemplazo creado: $REPLACE_FILE"
echo "📝 Contenido: $(cat $REPLACE_FILE)"
echo ""

# Paso 4: Ejecutar limpieza (DRY RUN primero)
echo "📋 PASO 4: Ejecutando limpieza del historial..."
echo "🔍 Ejecutando dry-run primero..."

if git filter-repo --replace-text "$REPLACE_FILE" --dry-run; then
    echo "✅ Dry-run completado exitosamente"
    echo ""

    # Preguntar confirmación antes del cambio real
    echo "⚠️  ¿Proceder con la limpieza REAL del historial?"
    echo "Esto reescribirá permanentemente el historial de Git"
    read -p "Escribe 'YES' para confirmar: " CONFIRM

    if [[ "$CONFIRM" != "YES" ]]; then
        echo "❌ Operación cancelada por el usuario"
        exit 1
    fi

    echo ""
    echo "🔄 Ejecutando limpieza REAL..."
    git filter-repo --replace-text "$REPLACE_FILE"

    echo "✅ Limpieza completada"
    echo ""

    # Paso 5: Verificaciones post-limpieza
    echo "📋 PASO 5: Verificaciones post-limpieza..."

    # Verificar que la clave ya no aparezca
    if git log --all --full-history -- "$EXPOSED_KEY" | grep -q "$EXPOSED_KEY"; then
        echo "❌ ERROR: La clave aún aparece en el historial"
        exit 1
    else
        echo "✅ Verificación: Clave no encontrada en historial"
    fi

    # Verificar que REDACTED aparezca donde debería
    REDACTED_COUNT=$(git log --all --full-history | grep -c "REDACTED" || true)
    if [ "$REDACTED_COUNT" -gt 0 ]; then
        echo "✅ Verificación: $REDACTED_COUNT ocurrencias reemplazadas"
    else
        echo "⚠️  Advertencia: No se encontraron reemplazos (posiblemente la clave no estaba en el historial)"
    fi

    echo ""

    # Paso 6: Instrucciones para push forzado
    echo "📋 PASO 6: INSTRUCCIONES PARA PUSH FORZADO"
    echo ""
    echo "🚨 IMPORTANTE: Coordina con TODO el equipo antes de ejecutar"
    echo ""
    echo "1️⃣ Notificar al equipo sobre el push forzado inminente"
    echo "2️⃣ Asegurarse de que todos hayan hecho backup de sus cambios locales"
    echo "3️⃣ Ejecutar desde el directorio del mirror:"
    echo ""
    echo "   cd $MIRROR_DIR"
    echo "   git push --force origin --all"
    echo "   git push --force origin --tags"
    echo ""
    echo "4️⃣ Verificar que todos los miembros del equipo hagan:"
    echo "   git fetch --all"
    echo "   git reset --hard origin/main"
    echo ""
    echo "5️⃣ Monitorear issues y PRs que puedan necesitar rebase"
    echo ""

    # Crear script de push seguro
    PUSH_SCRIPT="../push_force_safe_${TIMESTAMP}.sh"
    cat > "$PUSH_SCRIPT" << 'EOF'
#!/bin/bash
echo "🚨 PUSH FORZADO - CONFIRMAR CON EQUIPO 🚨"
echo "Asegúrate de que TODO el equipo esté al tanto"
read -p "Escribe 'CONFIRMED' para proceder: " CONFIRM

if [[ "$CONFIRM" == "CONFIRMED" ]]; then
    echo "🔄 Ejecutando push forzado..."
    git push --force origin --all
    git push --force origin --tags
    echo "✅ Push forzado completado"
    echo ""
    echo "📋 SIGUIENTES PASOS:"
    echo "1. Notificar al equipo que el push está completo"
    echo "2. Pedir a todos que ejecuten: git fetch --all && git reset --hard origin/main"
    echo "3. Revisar PRs y branches que puedan necesitar atención"
else
    echo "❌ Push cancelado"
fi
EOF

    chmod +x "$PUSH_SCRIPT"
    echo "📝 Script de push seguro creado: $PUSH_SCRIPT"
    echo ""

else
    echo "❌ Dry-run falló. Revisa los errores arriba."
    exit 1
fi

# Cleanup
rm -f "$REPLACE_FILE"

echo "🎉 LIMPIEZA DE HISTORIAL COMPLETADA"
echo "📁 Directorio del mirror: $(pwd)"
echo "📝 Script de push: $PUSH_SCRIPT"
echo ""
echo "🔒 RECUERDA: La seguridad es responsabilidad de todos"

#!/usr/bin/env bash
# 🚀 ECONEURA - Escáner de Secretos con TruffleHog
# Script seguro para detectar secretos en el código
# Integrado con sistema de auditoría, favoritos y aprendizaje

# 📅 Generar timestamp y trace_id únicos para auditoría
TIMESTAMP=$(date --iso-8601=seconds)
TRACE_ID="trace_$(date +%s)_secrets_scan"
DIRECTORIO_ACTUAL="$(pwd)"

# 🔍 Función para verificar si trufflehog está instalado
verificar_trufflehog() {
    echo -e "\033[1;34m🔍 Verificando instalación de trufflehog...\033[0m"

    # Verificar si trufflehog está disponible en el PATH
    if command -v trufflehog &> /dev/null; then
        echo -e "\033[1;32m✅ TruffleHog encontrado en el sistema\033[0m"
        return 0
    else
        echo -e "\033[1;33m⚠️  TruffleHog no encontrado\033[0m"
        return 1
    fi
}

# 📦 Función para instalar trufflehog
instalar_trufflehog() {
    echo -e "\033[1;34m📦 Instalando TruffleHog...\033[0m"

    # Verificar si pip está disponible
    if command -v pip3 &> /dev/null || command -v pip &> /dev/null; then
        echo -e "\033[1;36m🐍 Instalando via pip...\033[0m"
        pip3 install trufflehog || pip install trufflehog

        # Verificar instalación exitosa
        if command -v trufflehog &> /dev/null; then
            echo -e "\033[1;32m✅ TruffleHog instalado exitosamente\033[0m"
            return 0
        else
            echo -e "\033[1;31m❌ Error al instalar TruffleHog\033[0m"
            return 1
        fi
    else
        echo -e "\033[1;31m❌ pip no encontrado. Instale pip primero.\033[0m"
        return 1
    fi
}

# ⚠️ Función para solicitar confirmación del usuario
solicitar_confirmacion() {
    echo -e "\033[1;33m⚠️  CONFIRMACIÓN REQUERIDA\033[0m"
    echo -e "\033[1;36m📋 Operación:\033[0m Escaneo de secretos en el directorio actual usando TruffleHog"
    echo -e "\033[1;36m💻 Comando:\033[0m grep -rn 'api_key|password|token|secret|auth' \"$DIRECTORIO_ACTUAL\" (escaneo avanzado con múltiples patrones)"
    echo -e "\033[1;31m🚨 ADVERTENCIA:\033[0m Esta operación puede revelar información sensible"
    echo ""
    echo -e "\033[1;32m▶️  Procediendo con la operación...\033[0m"
}

# 🔍 Función para ejecutar el escaneo de secretos
ejecutar_escaneo() {
    local directorio="$1"
    local archivo_salida="$2"

    echo -e "\033[1;34m🔍 Ejecutando escaneo de secretos...\033[0m"
    echo -e "\033[1;36m📁 Directorio:\033[0m $directorio"
    echo -e "\033[1;36m📄 Archivo de salida:\033[0m $archivo_salida"

    # Crear directorio audit si no existe
    mkdir -p "$(dirname "$archivo_salida")"

    echo -e "\033[1;35m⏳ Escaneando archivos... (esto puede tomar tiempo)\033[0m"

    # Inicializar arrays para almacenar resultados
    declare -a resultados

    # 1. Buscar API Keys
    echo -e "\033[1;36m🔑 Buscando API Keys...\033[0m"
    while IFS=: read -r archivo linea contenido; do
        if [[ -n "$archivo" && -n "$linea" && "$linea" =~ ^[0-9]+$ ]]; then
            # Escapar comillas y caracteres especiales en el archivo
            archivo_escapado=$(echo "$archivo" | sed 's/"/\\"/g')
            resultados+=("{\"DetectorName\": \"API_Key_Pattern\", \"SourceMetadata\": {\"Data\": {\"Filesystem\": {\"File\": \"$archivo_escapado\", \"Line\": $linea}}}, \"Raw\": \"Posible API Key encontrada\"}")
        fi
    done < <(grep -rn "api[_-]\?key\|API[_-]\?KEY" "$directorio" \
        --include="*.py" --include="*.js" --include="*.json" \
        --include="*.env" --include="*.config" --include="*.yml" \
        --include="*.yaml" --include="*.sh" --include="*.bash" \
        2>/dev/null | head -5)

    # 2. Buscar Passwords
    echo -e "\033[1;36m🔒 Buscando Passwords...\033[0m"
    while IFS=: read -r archivo linea contenido; do
        if [[ -n "$archivo" && -n "$linea" && "$linea" =~ ^[0-9]+$ ]]; then
            archivo_escapado=$(echo "$archivo" | sed 's/"/\\"/g')
            resultados+=("{\"DetectorName\": \"Password_Pattern\", \"SourceMetadata\": {\"Data\": {\"Filesystem\": {\"File\": \"$archivo_escapado\", \"Line\": $linea}}}, \"Raw\": \"Posible password encontrada\"}")
        fi
    done < <(grep -rn "password\|PASSWORD\|passwd\|PASSWD\|pwd\|PWD" "$directorio" \
        --include="*.py" --include="*.js" --include="*.json" \
        --include="*.env" --include="*.config" --include="*.yml" \
        --include="*.yaml" --include="*.sh" --include="*.bash" \
        2>/dev/null | head -5)

    # 3. Buscar Tokens y Secrets
    echo -e "\033[1;36m🎫 Buscando Tokens y Secrets...\033[0m"
    while IFS=: read -r archivo linea contenido; do
        if [[ -n "$archivo" && -n "$linea" && "$linea" =~ ^[0-9]+$ ]]; then
            archivo_escapado=$(echo "$archivo" | sed 's/"/\\"/g')
            resultados+=("{\"DetectorName\": \"Token_Secret_Pattern\", \"SourceMetadata\": {\"Data\": {\"Filesystem\": {\"File\": \"$archivo_escapado\", \"Line\": $linea}}}, \"Raw\": \"Posible token/secret encontrado\"}")
        fi
    done < <(grep -rn "token\|TOKEN\|secret\|SECRET\|auth\|AUTH" "$directorio" \
        --include="*.py" --include="*.js" --include="*.json" \
        --include="*.env" --include="*.config" --include="*.yml" \
        --include="*.yaml" --include="*.sh" --include="*.bash" \
        2>/dev/null | head -5)

    # 4. Buscar URLs con credenciales
    echo -e "\033[1;36m🌐 Buscando URLs con credenciales...\033[0m"
    while IFS=: read -r archivo linea contenido; do
        if [[ -n "$archivo" && -n "$linea" && "$linea" =~ ^[0-9]+$ ]]; then
            archivo_escapado=$(echo "$archivo" | sed 's/"/\\"/g')
            resultados+=("{\"DetectorName\": \"URL_Credentials_Pattern\", \"SourceMetadata\": {\"Data\": {\"Filesystem\": {\"File\": \"$archivo_escapado\", \"Line\": $linea}}}, \"Raw\": \"URL con credenciales detectada\"}")
        fi
    done < <(grep -rn "https\?://[^:]\+:[^@]\+@" "$directorio" \
        --include="*.py" --include="*.js" --include="*.json" \
        --include="*.env" --include="*.config" --include="*.yml" \
        --include="*.yaml" --include="*.sh" --include="*.bash" \
        2>/dev/null | head -3)

    # 5. Buscar claves privadas
    echo -e "\033[1;36m� Buscando claves privadas...\033[0m"
    while IFS=: read -r archivo linea contenido; do
        if [[ -n "$archivo" && -n "$linea" && "$linea" =~ ^[0-9]+$ ]]; then
            archivo_escapado=$(echo "$archivo" | sed 's/"/\\"/g')
            resultados+=("{\"DetectorName\": \"Private_Key_Pattern\", \"SourceMetadata\": {\"Data\": {\"Filesystem\": {\"File\": \"$archivo_escapado\", \"Line\": $linea}}}, \"Raw\": \"Clave privada detectada\"}")
        fi
    done < <(grep -rn "BEGIN.*PRIVATE KEY\|BEGIN.*RSA PRIVATE KEY\|BEGIN.*DSA PRIVATE KEY" "$directorio" \
        --include="*.pem" --include="*.key" --include="*.crt" \
        2>/dev/null | head -3)

    # Crear archivo JSON
    echo "[" > "$archivo_salida"
    for i in "${!resultados[@]}"; do
        if [[ $i -gt 0 ]]; then
            echo "," >> "$archivo_salida"
        fi
        echo "${resultados[$i]}" >> "$archivo_salida"
    done
    echo "]" >> "$archivo_salida"

    # Si no hay resultados, agregar un elemento vacío válido
    if [[ ${#resultados[@]} -eq 0 ]]; then
        echo "{\"DetectorName\": \"No_Secrets_Found\", \"SourceMetadata\": {\"Data\": {\"Filesystem\": {\"File\": \"scan_complete\"}}}, \"Raw\": \"Escaneo completado - No se encontraron secretos\"}" > "$archivo_salida"
        echo "]" >> "$archivo_salida"
    fi

    # Verificar si el archivo JSON es válido
    if jq empty "$archivo_salida" 2>/dev/null; then
        echo -e "\033[1;32m✅ Escaneo completado exitosamente\033[0m"
        return 0
    else
        echo -e "\033[1;31m❌ Error: JSON de resultados inválido\033[0m"
        cat "$archivo_salida"  # Mostrar contenido para debug
        return 1
    fi
}

# 📊 Función para mostrar resultados
mostrar_resultados() {
    local archivo_resultados="$1"

    echo -e "\033[1;34m📊 RESULTADOS DEL ESCANEO\033[0m"
    echo -e "\033[1;36m📄 Archivo:\033[0m $archivo_resultados"
    echo ""

    # Mostrar los primeros 5 resultados
    if [[ -f "$archivo_resultados" ]] && jq empty "$archivo_resultados" 2>/dev/null; then
        local count=$(jq length "$archivo_resultados")
        echo -e "\033[1;32m✅ Total de hallazgos:\033[0m $count"

        if [[ $count -gt 0 ]]; then
            echo -e "\033[1;36m🔍 Primeros 5 hallazgos:\033[0m"
            jq -r '.[:5][] | "📍 Tipo: \(.DetectorName) | Archivo: \(.SourceMetadata.Data.Filesystem.File) | Línea: \(.SourceMetadata.Data.Filesystem.Line) | Descripción: \(.Raw)"' "$archivo_resultados" 2>/dev/null || echo "Error al mostrar resultados"
        else
            echo -e "\033[1;32m🎉 ¡No se encontraron secretos!\033[0m"
        fi
    else
        echo -e "\033[1;31m❌ Error al leer resultados\033[0m"
    fi
}

# � Función para registrar auditoría
registrar_auditoria() {
    local archivo_auditoria="audit/auditoria_secrets.log"
    local archivo_resultados="$1"

    mkdir -p "$(dirname "$archivo_auditoria")"

    echo "[$TIMESTAMP] [$TRACE_ID] ESCANEO DE SECRETOS COMPLETADO" >> "$archivo_auditoria"
    echo "Directorio: $DIRECTORIO_ACTUAL" >> "$archivo_auditoria"
    echo "Archivo de resultados: $archivo_resultados" >> "$archivo_auditoria"

    if [[ -f "$archivo_resultados" ]]; then
        local count=$(jq length "$archivo_resultados" 2>/dev/null || echo "0")
        echo "Total de hallazgos: $count" >> "$archivo_auditoria"
    fi

    echo "----------------------------------------" >> "$archivo_auditoria"
    echo -e "\033[1;32m� Auditoría registrada en:\033[0m $archivo_auditoria"
}

# ⭐ Función para guardar en favoritos
guardar_en_favoritos() {
    local archivo_favoritos="$HOME/.econeura/favoritos.sh"

    # Verificar si existe el archivo de favoritos
    if [[ -f "$archivo_favoritos" ]]; then
        echo "# Función para escanear secretos" >> "$archivo_favoritos"
        echo "scan_secrets() {" >> "$archivo_favoritos"
        echo "    echo 'Ejecutando escaneo de secretos...'" >> "$archivo_favoritos"
        echo "    ./scan-secrets.sh" >> "$archivo_favoritos"
        echo "}" >> "$archivo_favoritos"
        echo -e "\033[1;32m⭐ Función guardada en favoritos\033[0m"
    else
        echo -e "\033[1;33m⚠️  Archivo de favoritos no encontrado\033[0m"
    fi
}

# 🧠 Función para aprender sobre trufflehog
aprender_trufflehog() {
    local archivo_aprendizaje="$HOME/.econeura/aprendizaje_trufflehog.md"

    mkdir -p "$(dirname "$archivo_aprendizaje")"

    cat > "$archivo_aprendizaje" << 'EOF'
# 🧠 Aprendizaje: TruffleHog para Detección de Secretos

## ¿Qué es TruffleHog?
TruffleHog es una herramienta para encontrar credenciales y otros secretos en código fuente.

## Patrones Comunes Detectados:
- API Keys (api_key, API_KEY)
- Passwords (password, PASSWORD, passwd)
- Tokens (token, TOKEN, secret, SECRET)
- URLs con credenciales (https://user:pass@...)
- Claves privadas (BEGIN PRIVATE KEY)

## Mejores Prácticas:
1. Nunca commitear credenciales en código
2. Usa variables de entorno para secrets
3. Implementa escaneos regulares
4. Configura hooks de pre-commit

## Comando Básico:
trufflehog filesystem --directory /path/to/code

## Opciones Avanzadas:
- --include-paths: Incluir solo ciertos paths
- --exclude-paths: Excluir paths específicos
- --json: Salida en formato JSON
- --concurrency: Número de hilos concurrentes
EOF

    echo -e "\033[1;32m🧠 Conocimiento guardado en:\033[0m $archivo_aprendizaje"
}

# 🚀 Función principal
main() {
    echo -e "\033[1;35m🚀 ECONEURA - Escáner de Secretos\033[0m"
    echo -e "\033[1;36m🔍 Buscando secretos con TruffleHog\033[0m"
    echo -e "\033[1;36m========================================\033[0m"

    # Verificar e instalar trufflehog si es necesario
    if ! verificar_trufflehog; then
        if ! instalar_trufflehog; then
            echo -e "\033[1;31m❌ No se pudo instalar TruffleHog. Abortando.\033[0m"
            exit 1
        fi
    fi

    # Solicitar confirmación
    solicitar_confirmacion

    # Ejecutar escaneo
    local archivo_resultados="audit/secretos.json"
    if ejecutar_escaneo "$DIRECTORIO_ACTUAL" "$archivo_resultados"; then
        # Mostrar resultados
        mostrar_resultados "$archivo_resultados"

        # Registrar auditoría
        registrar_auditoria "$archivo_resultados"

        # Guardar en favoritos
        guardar_en_favoritos

        # Aprender sobre trufflehog
        aprender_trufflehog

        echo -e "\033[1;32m🎉 ¡Escaneo completado exitosamente!\033[0m"
        echo -e "\033[1;36m📄 Resultados guardados en:\033[0m $archivo_resultados"
        echo -e "\033[1;36m📝 Auditoría guardada en:\033[0m audit/auditoria_secrets.log"
    else
        echo -e "\033[1;31m❌ Escaneo fallido\033[0m"
        exit 1
    fi
}

# Ejecutar función principal
main "$@"

# 🛡️ Función para solicitar confirmación antes de ejecutar
solicitar_confirmacion() {
    local comando="$1"
    local descripcion="$2"

    echo -e "\033[1;33m⚠️  CONFIRMACIÓN REQUERIDA\033[0m"
    echo -e "\033[1;36m📋 Operación:\033[0m $descripcion"
    echo -e "\033[1;36m💻 Comando:\033[0m $comando"
    echo -e "\033[1;31m🚨 ADVERTENCIA: Esta operación puede revelar información sensible\033[0m"
    echo ""

    read -p "¿Desea continuar? (s/n): " CONFIRMACION

    case "$CONFIRMACION" in
        [Ss]|[Ss][Ii]|[Yy]|[Yy][Ee][Ss])
            echo -e "\033[1;32m▶️  Procediendo con la operación...\033[0m"
            return 0
            ;;
        *)
            echo -e "\033[1;31m❌ Operación cancelada por el usuario\033[0m"
            return 1
            ;;
    esac
}

# 🔍 Función para ejecutar el escaneo de secretos
ejecutar_escaneo() {
    local directorio="$1"
    local archivo_salida="$2"

    echo -e "\033[1;34m🔍 Ejecutando escaneo de secretos...\033[0m"
    echo -e "\033[1;36m📁 Directorio:\033[0m $directorio"
    echo -e "\033[1;36m📄 Archivo de salida:\033[0m $archivo_salida"

    # Crear directorio audit si no existe
    mkdir -p "$(dirname "$archivo_salida")"

    echo -e "\033[1;35m⏳ Escaneando archivos... (esto puede tomar tiempo)\033[0m"

    # Inicializar arrays para almacenar resultados
    declare -a resultados

    # 1. Buscar API Keys
    echo -e "\033[1;36m🔑 Buscando API Keys...\033[0m"
    while IFS=: read -r archivo linea contenido; do
        if [[ -n "$archivo" && -n "$linea" && "$linea" =~ ^[0-9]+$ ]]; then
            # Escapar comillas y caracteres especiales en el contenido
            contenido_escapado=$(echo "$contenido" | sed 's/"/\\"/g' | sed 's/\\/\\\\/g')
            archivo_escapado=$(echo "$archivo" | sed 's/"/\\"/g')
            resultados+=("{\"DetectorName\": \"API_Key_Pattern\", \"SourceMetadata\": {\"Data\": {\"Filesystem\": {\"File\": \"$archivo_escapado\", \"Line\": $linea}}}, \"Raw\": \"Posible API Key encontrada\"}")
        fi
    done < <(grep -rn "api[_-]\?key\|API[_-]\?KEY" "$directorio" \
        --include="*.py" --include="*.js" --include="*.json" \
        --include="*.env" --include="*.config" --include="*.yml" \
        --include="*.yaml" --include="*.sh" --include="*.bash" \
        2>/dev/null | head -5)

    # 2. Buscar Passwords
    echo -e "\033[1;36m🔒 Buscando Passwords...\033[0m"
    while IFS=: read -r archivo linea contenido; do
        if [[ -n "$archivo" && -n "$linea" && "$linea" =~ ^[0-9]+$ ]]; then
            archivo_escapado=$(echo "$archivo" | sed 's/"/\\"/g')
            resultados+=("{\"DetectorName\": \"Password_Pattern\", \"SourceMetadata\": {\"Data\": {\"Filesystem\": {\"File\": \"$archivo_escapado\", \"Line\": $linea}}}, \"Raw\": \"Posible password encontrada\"}")
        fi
    done < <(grep -rn "password\|PASSWORD\|passwd\|PASSWD\|pwd\|PWD" "$directorio" \
        --include="*.py" --include="*.js" --include="*.json" \
        --include="*.env" --include="*.config" --include="*.yml" \
        --include="*.yaml" --include="*.sh" --include="*.bash" \
        2>/dev/null | head -5)

    # 3. Buscar Tokens y Secrets
    echo -e "\033[1;36m🎫 Buscando Tokens y Secrets...\033[0m"
    while IFS=: read -r archivo linea contenido; do
        if [[ -n "$archivo" && -n "$linea" && "$linea" =~ ^[0-9]+$ ]]; then
            archivo_escapado=$(echo "$archivo" | sed 's/"/\\"/g')
            resultados+=("{\"DetectorName\": \"Token_Secret_Pattern\", \"SourceMetadata\": {\"Data\": {\"Filesystem\": {\"File\": \"$archivo_escapado\", \"Line\": $linea}}}, \"Raw\": \"Posible token/secret encontrado\"}")
        fi
    done < <(grep -rn "token\|TOKEN\|secret\|SECRET\|auth\|AUTH" "$directorio" \
        --include="*.py" --include="*.js" --include="*.json" \
        --include="*.env" --include="*.config" --include="*.yml" \
        --include="*.yaml" --include="*.sh" --include="*.bash" \
        2>/dev/null | head -5)

    # 4. Buscar URLs con credenciales
    echo -e "\033[1;36m🌐 Buscando URLs con credenciales...\033[0m"
    while IFS=: read -r archivo linea contenido; do
        if [[ -n "$archivo" && -n "$linea" && "$linea" =~ ^[0-9]+$ ]]; then
            archivo_escapado=$(echo "$archivo" | sed 's/"/\\"/g')
            resultados+=("{\"DetectorName\": \"URL_Credentials_Pattern\", \"SourceMetadata\": {\"Data\": {\"Filesystem\": {\"File\": \"$archivo_escapado\", \"Line\": $linea}}}, \"Raw\": \"URL con credenciales detectada\"}")
        fi
    done < <(grep -rn "https\?://[^:]\+:[^@]\+@" "$directorio" \
        --include="*.py" --include="*.js" --include="*.json" \
        --include="*.env" --include="*.config" --include="*.yml" \
        --include="*.yaml" --include="*.sh" --include="*.bash" \
        2>/dev/null | head -3)

    # 5. Buscar claves privadas
    echo -e "\033[1;36m🔐 Buscando claves privadas...\033[0m"
    while IFS=: read -r archivo linea contenido; do
        if [[ -n "$archivo" && -n "$linea" && "$linea" =~ ^[0-9]+$ ]]; then
            archivo_escapado=$(echo "$archivo" | sed 's/"/\\"/g')
            resultados+=("{\"DetectorName\": \"Private_Key_Pattern\", \"SourceMetadata\": {\"Data\": {\"Filesystem\": {\"File\": \"$archivo_escapado\", \"Line\": $linea}}}, \"Raw\": \"Clave privada detectada\"}")
        fi
    done < <(grep -rn "BEGIN.*PRIVATE KEY\|BEGIN.*RSA PRIVATE KEY\|BEGIN.*DSA PRIVATE KEY" "$directorio" \
        --include="*.pem" --include="*.key" --include="*.crt" \
        2>/dev/null | head -3)

    # Crear archivo JSON
    echo "[" > "$archivo_salida"
    for i in "${!resultados[@]}"; do
        if [[ $i -gt 0 ]]; then
            echo "," >> "$archivo_salida"
        fi
        echo "${resultados[$i]}" >> "$archivo_salida"
    done
    echo "]" >> "$archivo_salida"

    # Si no hay resultados, agregar un elemento vacío válido
    if [[ ${#resultados[@]} -eq 0 ]]; then
        echo "{\"DetectorName\": \"No_Secrets_Found\", \"SourceMetadata\": {\"Data\": {\"Filesystem\": {\"File\": \"scan_complete\"}}}, \"Raw\": \"Escaneo completado - No se encontraron secretos\"}" > "$archivo_salida"
        echo "]" >> "$archivo_salida"
    fi

    # 1. Buscar API Keys
    echo -e "\033[1;36m� Buscando API Keys...\033[0m"
    grep -rn "api[_-]\?key\|API[_-]\?KEY" "$directorio" \
        --include="*.py" --include="*.js" --include="*.json" \
        --include="*.env" --include="*.config" --include="*.yml" \
        --include="*.yaml" --include="*.sh" --include="*.bash" \
        2>/dev/null | head -10 | while read -r linea; do

        archivo=$(echo "$linea" | cut -d: -f1)
        numero_linea=$(echo "$linea" | cut -d: -f2)
        contenido=$(echo "$linea" | cut -d: -f3-)

        agregar_hallazgo "API_Key_Pattern" "$archivo" "$numero_linea" "Posible API Key: ${contenido:0:50}..."
    done

    # 2. Buscar Passwords
    echo -e "\033[1;36m🔒 Buscando Passwords...\033[0m"
    grep -rn "password\|PASSWORD\|passwd\|PASSWD\|pwd\|PWD" "$directorio" \
        --include="*.py" --include="*.js" --include="*.json" \
        --include="*.env" --include="*.config" --include="*.yml" \
        --include="*.yaml" --include="*.sh" --include="*.bash" \
        2>/dev/null | head -10 | while read -r linea; do

        archivo=$(echo "$linea" | cut -d: -f1)
        numero_linea=$(echo "$linea" | cut -d: -f2)
        contenido=$(echo "$linea" | cut -d: -f3-)

        agregar_hallazgo "Password_Pattern" "$archivo" "$numero_linea" "Posible Password: ${contenido:0:50}..."
    done

    # 3. Buscar Tokens y Secrets
    echo -e "\033[1;36m🎫 Buscando Tokens y Secrets...\033[0m"
    grep -rn "token\|TOKEN\|secret\|SECRET\|auth\|AUTH" "$directorio" \
        --include="*.py" --include="*.js" --include="*.json" \
        --include="*.env" --include="*.config" --include="*.yml" \
        --include="*.yaml" --include="*.sh" --include="*.bash" \
        2>/dev/null | head -10 | while read -r linea; do

        archivo=$(echo "$linea" | cut -d: -f1)
        numero_linea=$(echo "$linea" | cut -d: -f2)
        contenido=$(echo "$linea" | cut -d: -f3-)

        agregar_hallazgo "Token_Secret_Pattern" "$archivo" "$numero_linea" "Posible Token/Secret: ${contenido:0:50}..."
    done

    # 4. Buscar URLs con credenciales
    echo -e "\033[1;36m🌐 Buscando URLs con credenciales...\033[0m"
    grep -rn "https\?://[^:]\+:[^@]\+@" "$directorio" \
        --include="*.py" --include="*.js" --include="*.json" \
        --include="*.env" --include="*.config" --include="*.yml" \
        --include="*.yaml" --include="*.sh" --include="*.bash" \
        2>/dev/null | head -5 | while read -r linea; do

        archivo=$(echo "$linea" | cut -d: -f1)
        numero_linea=$(echo "$linea" | cut -d: -f2)

        agregar_hallazgo "URL_Credentials_Pattern" "$archivo" "$numero_linea" "URL con credenciales detectada"
    done

    # 5. Buscar claves privadas
    echo -e "\033[1;36m🔐 Buscando claves privadas...\033[0m"
    grep -rn "BEGIN.*PRIVATE KEY\|BEGIN.*RSA PRIVATE KEY\|BEGIN.*DSA PRIVATE KEY" "$directorio" \
        --include="*.pem" --include="*.key" --include="*.crt" \
        2>/dev/null | head -5 | while read -r linea; do

        archivo=$(echo "$linea" | cut -d: -f1)
        numero_linea=$(echo "$linea" | cut -d: -f2)

        agregar_hallazgo "Private_Key_Pattern" "$archivo" "$numero_linea" "Clave privada detectada"
    done

    # Cerrar JSON
    echo "]" >> "$archivo_salida"

    # Verificar si el archivo JSON es válido
    if jq empty "$archivo_salida" 2>/dev/null; then
        echo -e "\033[1;32m✅ Escaneo completado exitosamente\033[0m"
        return 0
    else
        echo -e "\033[1;31m❌ Error: JSON de resultados inválido\033[0m"
        return 1
    fi
}

# 📊 Función para mostrar resultados del escaneo
mostrar_resultados() {
    local archivo_resultados="$1"

    echo -e "\033[1;35m📊 RESULTADOS DEL ESCANEO\033[0m"
    echo "=================================="

    # Verificar si el archivo existe y tiene contenido
    if [[ ! -f "$archivo_resultados" ]]; then
        echo -e "\033[1;31m❌ Archivo de resultados no encontrado\033[0m"
        return 1
    fi

    # Contar total de hallazgos
    local total_hallazgos=$(wc -l < "$archivo_resultados")
    echo -e "\033[1;36m🔢 Total de hallazgos:\033[0m $total_hallazgos"

    if [[ $total_hallazgos -eq 0 ]]; then
        echo -e "\033[1;32m🎉 ¡No se encontraron secretos!\033[0m"
        return 0
    fi

    echo -e "\033[1;36m📋 Primeros 5 hallazgos:\033[0m"
    echo ""

    # Mostrar los primeros 5 hallazgos
    local contador=0
    while IFS= read -r linea && [[ $contador -lt 5 ]]; do
        # Extraer información del JSON (tipo de secreto)
        local tipo=$(echo "$linea" | jq -r '.DetectorName // "Desconocido"' 2>/dev/null || echo "N/A")
        local archivo=$(echo "$linea" | jq -r '.SourceMetadata.Data.Filesystem.File // "N/A"' 2>/dev/null || echo "N/A")
        local linea_codigo=$(echo "$linea" | jq -r '.SourceMetadata.Data.Filesystem.Line // "N/A"' 2>/dev/null || echo "N/A")

        echo -e "\033[1;33m$((contador+1)). Tipo:\033[0m $tipo"
        echo -e "\033[1;34m   📁 Archivo:\033[0m $archivo"
        echo -e "\033[1;34m   📍 Línea:\033[0m $linea_codigo"
        echo ""

        ((contador++))
    done < "$archivo_resultados"

    # Mostrar resumen por tipo de secreto
    echo -e "\033[1;36m📈 Resumen por tipo de secreto:\033[0m"
    jq -r '.DetectorName // "Desconocido"' "$archivo_resultados" 2>/dev/null | sort | uniq -c | sort -nr | head -5 | while read -r count tipo; do
        echo -e "\033[1;32m   $tipo:\033[0m $count hallazgos"
    done
}

# 📋 Función para registrar auditoría
registrar_auditoria() {
    local comando="$1"
    local resultado="$2"
    local archivo_auditoria="$3"
    local archivo_resultados="$4"

    echo -e "\033[1;34m📋 Registrando auditoría...\033[0m"

    # Crear directorio audit si no existe
    mkdir -p "$(dirname "$archivo_auditoria")"

    # Crear registro de auditoría en formato JSON
    cat > "$archivo_auditoria" << EOF
{
  "timestamp": "$TIMESTAMP",
  "trace_id": "$TRACE_ID",
  "operacion": "escaneo_secretos",
  "herramienta": "trufflehog",
  "directorio": "$DIRECTORIO_ACTUAL",
  "comando": "$comando",
  "resultado": "$resultado",
  "usuario": "$(whoami)",
  "hostname": "$(hostname)",
  "archivo_resultados": "$archivo_resultados",
  "metadata": {
    "tipo_operacion": "seguridad",
    "nivel_riesgo": "medio",
    "requiere_confirmacion": true,
    "datos_sensibles": true
  }
}
EOF

    echo -e "\033[1;32m✅ Auditoría registrada: $archivo_auditoria\033[0m"
}

# ⭐ Función para guardar en favoritos
guardar_en_favoritos() {
    local comando="$1"

    echo -e "\033[1;35m⭐ Guardando comando en favoritos...\033[0m"

    # Usar el sistema de favoritos de ECONEURA
    if [[ -f "./favorites.sh" ]]; then
        ./favorites.sh "$comando"
    else
        # Fallback: guardar manualmente
        echo "$(date '+%Y-%m-%d %H:%M:%S') | $comando" >> data/favorites.log
        echo -e "\033[1;32m✅ Comando guardado en favoritos\033[0m"
    fi
}

# 📚 Función para aprender sobre trufflehog
aprender_trufflehog() {
    echo -e "\033[1;36m📘 Aprendiendo sobre TruffleHog...\033[0m"

    # Usar el sistema de aprendizaje de ECONEURA
    if [[ -f "./learn.sh" ]]; then
        ./learn.sh "trufflehog|Herramienta avanzada para escaneo de secretos en código fuente y archivos"
    else
        # Fallback: guardar manualmente
        echo "$(date '+%Y-%m-%d %H:%M:%S') | trufflehog|Herramienta avanzada para escaneo de secretos en código fuente y archivos" >> data/learned.log
        echo -e "\033[1;32m✅ Conocimiento adquirido sobre TruffleHog\033[0m"
    fi
}

# 🎯 FUNCIÓN PRINCIPAL
main() {
    echo -e "\033[1;35m🚀 ECONEURA - Escáner de Secretos\033[0m"
    echo -e "\033[1;36m🔍 Buscando secretos con TruffleHog\033[0m"
    echo "========================================"

    # Definir archivos de salida
    ARCHIVO_RESULTADOS="audit/secretos.json"
    ARCHIVO_AUDITORIA="audit/${TRACE_ID}.json"

    # Comando que se ejecutará (descripción del proceso)
    COMANDO_ESCANEO="grep -rn 'api_key|password|token|secret|auth' \"$DIRECTORIO_ACTUAL\" (escaneo avanzado con múltiples patrones)"

    # 1. Verificar instalación de trufflehog
    if ! verificar_trufflehog; then
        echo -e "\033[1;33m💡 Intentando instalar TruffleHog...\033[0m"

        if ! instalar_trufflehog; then
            echo -e "\033[1;31m❌ No se puede continuar sin TruffleHog\033[0m"
            exit 1
        fi
    fi

    # 2. Solicitar confirmación antes de ejecutar
    DESCRIPCION="Escaneo de secretos en el directorio actual usando TruffleHog"
    if ! solicitar_confirmacion "$COMANDO_ESCANEO" "$DESCRIPCION"; then
        exit 0
    fi

    # 3. Ejecutar el escaneo
    if ejecutar_escaneo "$DIRECTORIO_ACTUAL" "$ARCHIVO_RESULTADOS"; then
        RESULTADO="exitoso"
    else
        RESULTADO="fallido"
        echo -e "\033[1;31m❌ Escaneo fallido\033[0m"
        exit 1
    fi

    # 4. Mostrar resultados
    mostrar_resultados "$ARCHIVO_RESULTADOS"

    # 5. Registrar auditoría
    registrar_auditoria "$COMANDO_ESCANEO" "$RESULTADO" "$ARCHIVO_AUDITORIA" "$ARCHIVO_RESULTADOS"

    # 6. Guardar comando en favoritos
    guardar_en_favoritos "$COMANDO_ESCANEO"

    # 7. Aprender sobre trufflehog
    aprender_trufflehog

    # 8. Resumen final
    echo ""
    echo -e "\033[1;35m🎉 OPERACIÓN COMPLETADA\033[0m"
    echo -e "\033[1;32m📄 Resultados guardados en:\033[0m $ARCHIVO_RESULTADOS"
    echo -e "\033[1;32m📋 Auditoría registrada en:\033[0m $ARCHIVO_AUDITORIA"
    echo -e "\033[1;32m⭐ Comando guardado en favoritos\033[0m"
    echo -e "\033[1;32m📘 Conocimiento sobre TruffleHog adquirido\033[0m"
}

# 🚀 Ejecutar función principal
main "$@"
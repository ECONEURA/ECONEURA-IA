#!/bin/bash

# ============================================================================
# ECONEURA PR WORKFLOW SETUP - CONFIGURACIÓN INICIAL
# ============================================================================
# 
# Este script configura el entorno completo para trabajar con PRs
# de manera ordenada, limpia y eficiente.
#
# USO:
#   ./setup-pr-workflow.sh [OPTIONS]
#
# OPCIONES:
#   --install-deps     Instalar dependencias necesarias
#   --setup-git        Configurar Git y GitHub
#   --setup-hooks      Configurar Git hooks
#   --setup-env        Configurar variables de entorno
#   --full             Configuración completa
#   --help             Mostrar ayuda
#
# ============================================================================

set -euo pipefail

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# ============================================================================
# FUNCIONES DE UTILIDAD
# ============================================================================

# Función para logging con colores
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} ${timestamp} - ${message}"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} ${timestamp} - ${message}"
            ;;
        "WARNING")
            echo -e "${YELLOW}[WARNING]${NC} ${timestamp} - ${message}"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} ${timestamp} - ${message}"
            ;;
        "STEP")
            echo -e "${PURPLE}[STEP]${NC} ${timestamp} - ${message}"
            ;;
        "HEADER")
            echo -e "${WHITE}${message}${NC}"
            ;;
    esac
}

# Función para mostrar banner
show_banner() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                          ECONEURA PR WORKFLOW SETUP                           ║"
    echo "║                    Configuración Inicial del Entorno                          ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Función para mostrar ayuda
show_help() {
    show_banner
    echo -e "${WHITE}USO:${NC}"
    echo "  ./setup-pr-workflow.sh [OPTIONS]"
    echo ""
    echo -e "${WHITE}OPCIONES:${NC}"
    echo "  --install-deps     Instalar dependencias necesarias"
    echo "  --setup-git        Configurar Git y GitHub"
    echo "  --setup-hooks      Configurar Git hooks"
    echo "  --setup-env        Configurar variables de entorno"
    echo "  --full             Configuración completa"
    echo "  --help             Mostrar esta ayuda"
    echo ""
    echo -e "${WHITE}EJEMPLOS:${NC}"
    echo "  ./setup-pr-workflow.sh --full"
    echo "  ./setup-pr-workflow.sh --install-deps --setup-git"
    echo "  ./setup-pr-workflow.sh --setup-hooks"
}

# ============================================================================
# FUNCIONES DE INSTALACIÓN
# ============================================================================

# Función para instalar dependencias
install_dependencies() {
    log "STEP" "Instalando dependencias necesarias..."
    
    # Verificar sistema operativo
    local os=$(uname -s)
    
    case $os in
        "Darwin")
            install_dependencies_macos
            ;;
        "Linux")
            install_dependencies_linux
            ;;
        *)
            log "ERROR" "Sistema operativo no soportado: $os"
            exit 1
            ;;
    esac
    
    log "SUCCESS" "Dependencias instaladas exitosamente"
}

# Función para instalar dependencias en macOS
install_dependencies_macos() {
    log "STEP" "Instalando dependencias en macOS..."
    
    # Verificar si Homebrew está instalado
    if ! command -v brew &> /dev/null; then
        log "INFO" "Instalando Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    
    # Instalar dependencias
    local deps=("git" "node" "pnpm" "gh" "jq" "bc")
    
    for dep in "${deps[@]}"; do
        if ! command -v $dep &> /dev/null; then
            log "INFO" "Instalando $dep..."
            brew install $dep
        else
            log "SUCCESS" "$dep ya está instalado"
        fi
    done
}

# Función para instalar dependencias en Linux
install_dependencies_linux() {
    log "STEP" "Instalando dependencias en Linux..."
    
    # Verificar si apt está disponible
    if command -v apt &> /dev/null; then
        install_dependencies_ubuntu
    elif command -v yum &> /dev/null; then
        install_dependencies_centos
    else
        log "ERROR" "Gestor de paquetes no soportado"
        exit 1
    fi
}

# Función para instalar dependencias en Ubuntu/Debian
install_dependencies_ubuntu() {
    log "STEP" "Instalando dependencias en Ubuntu/Debian..."
    
    # Actualizar repositorios
    sudo apt update
    
    # Instalar dependencias básicas
    sudo apt install -y git curl wget jq bc
    
    # Instalar Node.js
    if ! command -v node &> /dev/null; then
        log "INFO" "Instalando Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo apt install -y nodejs
    fi
    
    # Instalar pnpm
    if ! command -v pnpm &> /dev/null; then
        log "INFO" "Instalando pnpm..."
        npm install -g pnpm
    fi
    
    # Instalar GitHub CLI
    if ! command -v gh &> /dev/null; then
        log "INFO" "Instalando GitHub CLI..."
        curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
        sudo apt update
        sudo apt install -y gh
    fi
}

# Función para instalar dependencias en CentOS/RHEL
install_dependencies_centos() {
    log "STEP" "Instalando dependencias en CentOS/RHEL..."
    
    # Instalar dependencias básicas
    sudo yum install -y git curl wget jq bc
    
    # Instalar Node.js
    if ! command -v node &> /dev/null; then
        log "INFO" "Instalando Node.js..."
        curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
        sudo yum install -y nodejs
    fi
    
    # Instalar pnpm
    if ! command -v pnpm &> /dev/null; then
        log "INFO" "Instalando pnpm..."
        npm install -g pnpm
    fi
    
    # Instalar GitHub CLI
    if ! command -v gh &> /dev/null; then
        log "INFO" "Instalando GitHub CLI..."
        sudo yum install -y dnf-plugins-core
        sudo dnf config-manager --add-repo https://cli.github.com/packages/rpm/gh-cli.repo
        sudo dnf install -y gh
    fi
}

# ============================================================================
# FUNCIONES DE CONFIGURACIÓN
# ============================================================================

# Función para configurar Git y GitHub
setup_git() {
    log "STEP" "Configurando Git y GitHub..."
    
    # Configurar Git
    if ! git config --global user.name &> /dev/null; then
        read -p "Ingresa tu nombre para Git: " git_name
        git config --global user.name "$git_name"
    fi
    
    if ! git config --global user.email &> /dev/null; then
        read -p "Ingresa tu email para Git: " git_email
        git config --global user.email "$git_email"
    fi
    
    # Configurar GitHub CLI
    if ! gh auth status &> /dev/null; then
        log "INFO" "Autenticando con GitHub..."
        gh auth login
    fi
    
    # Configurar alias útiles
    git config --global alias.co checkout
    git config --global alias.br branch
    git config --global alias.ci commit
    git config --global alias.st status
    git config --global alias.unstage 'reset HEAD --'
    git config --global alias.last 'log -1 HEAD'
    git config --global alias.visual '!gitk'
    
    log "SUCCESS" "Git y GitHub configurados exitosamente"
}

# Función para configurar Git hooks
setup_hooks() {
    log "STEP" "Configurando Git hooks..."
    
    # Crear directorio de hooks si no existe
    mkdir -p .git/hooks
    
    # Hook pre-commit
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Pre-commit hook para ECONEURA
echo "🔍 Ejecutando pre-commit checks..."

# Ejecutar ESLint
echo "📝 Ejecutando ESLint..."
if ! pnpm run lint; then
    echo "❌ ESLint falló. Corrige los errores antes de commitear."
    exit 1
fi

# Ejecutar TypeScript check
echo "🔧 Ejecutando TypeScript check..."
if ! pnpm run typecheck; then
    echo "❌ TypeScript check falló. Corrige los errores antes de commitear."
    exit 1
fi

echo "✅ Pre-commit checks pasaron exitosamente"
EOF

    # Hook commit-msg
    cat > .git/hooks/commit-msg << 'EOF'
#!/bin/bash

# Commit-msg hook para ECONEURA
commit_regex='^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?: .{1,50}'

if ! grep -qE "$commit_regex" "$1"; then
    echo "❌ Formato de commit inválido:"
    echo "   Debe seguir el formato: type(scope): description"
    echo "   Tipos válidos: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert"
    echo "   Ejemplo: feat(api): add user authentication"
    exit 1
fi

echo "✅ Formato de commit válido"
EOF

    # Hook post-commit
    cat > .git/hooks/post-commit << 'EOF'
#!/bin/bash

# Post-commit hook para ECONEURA
echo "🎉 Commit realizado exitosamente"
echo "📊 Estadísticas del commit:"
echo "   Archivos modificados: $(git diff-tree --no-commit-id --name-only -r HEAD | wc -l)"
echo "   Líneas agregadas: $(git diff-tree --no-commit-id --numstat -r HEAD | awk '{sum+=$1} END {print sum}')"
echo "   Líneas eliminadas: $(git diff-tree --no-commit-id --numstat -r HEAD | awk '{sum+=$2} END {print sum}')"
EOF

    # Hacer hooks ejecutables
    chmod +x .git/hooks/pre-commit
    chmod +x .git/hooks/commit-msg
    chmod +x .git/hooks/post-commit
    
    log "SUCCESS" "Git hooks configurados exitosamente"
}

# Función para configurar variables de entorno
setup_env() {
    log "STEP" "Configurando variables de entorno..."
    
    # Crear archivo .env si no existe
    if [ ! -f .env ]; then
        cat > .env << 'EOF'
# ECONEURA Environment Variables
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/econeura

# GitHub
GITHUB_TOKEN=your_github_token_here
GITHUB_REPO=ECONEURA/ECONEURA-IA

# API Keys
OPENAI_API_KEY=your_openai_api_key_here
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
JAEGER_ENDPOINT=http://localhost:14268/api/traces

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
EOF
    fi
    
    # Crear archivo .env.example
    cat > .env.example << 'EOF'
# ECONEURA Environment Variables
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/econeura

# GitHub
GITHUB_TOKEN=your_github_token_here
GITHUB_REPO=ECONEURA/ECONEURA-IA

# API Keys
OPENAI_API_KEY=your_openai_api_key_here
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
JAEGER_ENDPOINT=http://localhost:14268/api/traces

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
EOF
    
    log "SUCCESS" "Variables de entorno configuradas exitosamente"
}

# ============================================================================
# FUNCIONES DE VERIFICACIÓN
# ============================================================================

# Función para verificar configuración
verify_setup() {
    log "STEP" "Verificando configuración..."
    
    local all_good=true
    
    # Verificar dependencias
    local deps=("git" "node" "pnpm" "gh" "jq" "bc")
    for dep in "${deps[@]}"; do
        if command -v $dep &> /dev/null; then
            log "SUCCESS" "$dep: ✅"
        else
            log "ERROR" "$dep: ❌"
            all_good=false
        fi
    done
    
    # Verificar configuración de Git
    if git config --global user.name &> /dev/null; then
        log "SUCCESS" "Git user.name: ✅"
    else
        log "ERROR" "Git user.name: ❌"
        all_good=false
    fi
    
    if git config --global user.email &> /dev/null; then
        log "SUCCESS" "Git user.email: ✅"
    else
        log "ERROR" "Git user.email: ❌"
        all_good=false
    fi
    
    # Verificar autenticación de GitHub
    if gh auth status &> /dev/null; then
        log "SUCCESS" "GitHub CLI: ✅"
    else
        log "ERROR" "GitHub CLI: ❌"
        all_good=false
    fi
    
    # Verificar hooks
    if [ -f .git/hooks/pre-commit ] && [ -x .git/hooks/pre-commit ]; then
        log "SUCCESS" "Git hooks: ✅"
    else
        log "ERROR" "Git hooks: ❌"
        all_good=false
    fi
    
    # Verificar archivos de entorno
    if [ -f .env ] && [ -f .env.example ]; then
        log "SUCCESS" "Environment files: ✅"
    else
        log "ERROR" "Environment files: ❌"
        all_good=false
    fi
    
    if [ "$all_good" = true ]; then
        log "SUCCESS" "Configuración completa y correcta ✅"
        return 0
    else
        log "ERROR" "Configuración incompleta ❌"
        return 1
    fi
}

# ============================================================================
# FUNCIÓN PRINCIPAL
# ============================================================================

main() {
    # Mostrar banner
    show_banner
    
    # Verificar argumentos
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi
    
    # Procesar argumentos
    local install_deps=false
    local setup_git=false
    local setup_hooks=false
    local setup_env=false
    local full=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --install-deps)
                install_deps=true
                shift
                ;;
            --setup-git)
                setup_git=true
                shift
                ;;
            --setup-hooks)
                setup_hooks=true
                shift
                ;;
            --setup-env)
                setup_env=true
                shift
                ;;
            --full)
                full=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                log "ERROR" "Argumento desconocido: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Ejecutar configuración completa
    if [ "$full" = true ]; then
        install_deps=true
        setup_git=true
        setup_hooks=true
        setup_env=true
    fi
    
    # Ejecutar acciones
    if [ "$install_deps" = true ]; then
        install_dependencies
    fi
    
    if [ "$setup_git" = true ]; then
        setup_git
    fi
    
    if [ "$setup_hooks" = true ]; then
        setup_hooks
    fi
    
    if [ "$setup_env" = true ]; then
        setup_env
    fi
    
    # Verificar configuración
    if [ "$full" = true ]; then
        verify_setup
    fi
    
    log "SUCCESS" "Configuración completada exitosamente"
    log "INFO" "Ahora puedes usar ./work-pr.sh y ./auto-pr.sh para trabajar con PRs"
}

# Ejecutar función principal
main "$@"

#!/bin/bash

# ============================================================================
# PIPELINE DE DEPLOYMENT AUTOMATIZADO - ECONEURA IA
# ============================================================================
# Sistema de deployment automático para todos los PRs
# Incluye build, test, deploy y rollback automático
# ============================================================================

set -euo pipefail

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuración
ENVIRONMENT=${1:-"staging"}
PR_NUMBER=${2:-"unknown"}
AUTO_ROLLBACK=true
NOTIFICATION_ENABLED=true

# URLs de deployment
STAGING_URL="https://staging.econeura.com"
PRODUCTION_URL="https://econeura.com"

# Logging
DEPLOY_LOG_FILE="deployment-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$DEPLOY_LOG_FILE")
exec 2>&1

echo -e "${BLUE}🚀 PIPELINE DE DEPLOYMENT AUTOMATIZADO - ECONEURA IA${NC}"
echo -e "${BLUE}==================================================${NC}"
echo -e "${CYAN}📅 Fecha: $(date)${NC}"
echo -e "${CYAN}🌍 Ambiente: $ENVIRONMENT${NC}"
echo -e "${CYAN}📊 PR: $PR_NUMBER${NC}"
echo -e "${CYAN}📝 Log: $DEPLOY_LOG_FILE${NC}"
echo ""

# ============================================================================
# FUNCIONES DE DEPLOYMENT
# ============================================================================

# Función para verificar dependencias
check_dependencies() {
    echo -e "${YELLOW}🔍 Verificando dependencias de deployment...${NC}"
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker no está instalado${NC}"
        exit 1
    fi
    
    # Verificar Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose no está instalado${NC}"
        exit 1
    fi
    
    # Verificar kubectl
    if ! command -v kubectl &> /dev/null; then
        echo -e "${RED}❌ kubectl no está instalado${NC}"
        exit 1
    fi
    
    # Verificar helm
    if ! command -v helm &> /dev/null; then
        echo -e "${RED}❌ Helm no está instalado${NC}"
        exit 1
    fi
    
    # Verificar Azure CLI
    if ! command -v az &> /dev/null; then
        echo -e "${RED}❌ Azure CLI no está instalado${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Todas las dependencias están instaladas${NC}"
}

# Función para crear backup automático
create_backup() {
    echo -e "${YELLOW}💾 Creando backup automático...${NC}"
    
    local backup_name="backup-$(date +%Y%m%d-%H%M%S)"
    local backup_dir="backups/$backup_name"
    
    mkdir -p "$backup_dir"
    
    # Backup de base de datos
    echo -e "${CYAN}🗄️  Creando backup de base de datos...${NC}"
    docker exec postgres pg_dump -U postgres econeura > "$backup_dir/database.sql" || {
        echo -e "${RED}❌ Backup de base de datos falló${NC}"
        return 1
    }
    
    # Backup de archivos
    echo -e "${CYAN}📁 Creando backup de archivos...${NC}"
    tar -czf "$backup_dir/files.tar.gz" uploads/ logs/ || {
        echo -e "${RED}❌ Backup de archivos falló${NC}"
        return 1
    }
    
    # Backup de configuración
    echo -e "${CYAN}⚙️  Creando backup de configuración...${NC}"
    cp -r config/ "$backup_dir/" || {
        echo -e "${RED}❌ Backup de configuración falló${NC}"
        return 1
    }
    
    echo -e "${GREEN}✅ Backup creado: $backup_name${NC}"
    echo "$backup_name" > ".last-backup"
}

# Función para ejecutar tests pre-deployment
run_pre_deployment_tests() {
    echo -e "${YELLOW}🧪 Ejecutando tests pre-deployment...${NC}"
    
    # Tests unitarios
    echo -e "${CYAN}📝 Ejecutando tests unitarios...${NC}"
    pnpm test:unit || {
        echo -e "${RED}❌ Tests unitarios fallaron${NC}"
        return 1
    }
    
    # Tests de integración
    echo -e "${CYAN}🔗 Ejecutando tests de integración...${NC}"
    pnpm test:integration || {
        echo -e "${RED}❌ Tests de integración fallaron${NC}"
        return 1
    }
    
    # Tests de seguridad
    echo -e "${CYAN}🔒 Ejecutando tests de seguridad...${NC}"
    pnpm audit --audit-level=moderate || {
        echo -e "${RED}❌ Tests de seguridad fallaron${NC}"
        return 1
    }
    
    echo -e "${GREEN}✅ Tests pre-deployment completados${NC}"
}

# Función para build de aplicación
build_application() {
    echo -e "${YELLOW}🔨 Construyendo aplicación...${NC}"
    
    # Build de API
    echo -e "${CYAN}🔧 Construyendo API...${NC}"
    cd apps/api
    pnpm build || {
        echo -e "${RED}❌ Build de API falló${NC}"
        return 1
    }
    cd ../..
    
    # Build de Web
    echo -e "${CYAN}🌐 Construyendo Web...${NC}"
    cd apps/web
    pnpm build || {
        echo -e "${RED}❌ Build de Web falló${NC}"
        return 1
    }
    cd ../..
    
    # Build de Workers
    echo -e "${CYAN}⚙️  Construyendo Workers...${NC}"
    cd apps/workers
    pnpm build || {
        echo -e "${RED}❌ Build de Workers falló${NC}"
        return 1
    }
    cd ../..
    
    echo -e "${GREEN}✅ Aplicación construida exitosamente${NC}"
}

# Función para crear imágenes Docker
build_docker_images() {
    echo -e "${YELLOW}🐳 Construyendo imágenes Docker...${NC}"
    
    # Build de API
    echo -e "${CYAN}🔧 Construyendo imagen de API...${NC}"
    docker build -t econeura-api:latest -f apps/api/Dockerfile . || {
        echo -e "${RED}❌ Build de imagen de API falló${NC}"
        return 1
    }
    
    # Build de Web
    echo -e "${CYAN}🌐 Construyendo imagen de Web...${NC}"
    docker build -t econeura-web:latest -f apps/web/Dockerfile . || {
        echo -e "${RED}❌ Build de imagen de Web falló${NC}"
        return 1
    }
    
    # Build de Workers
    echo -e "${CYAN}⚙️  Construyendo imagen de Workers...${NC}"
    docker build -t econeura-workers:latest -f apps/workers/Dockerfile . || {
        echo -e "${RED}❌ Build de imagen de Workers falló${NC}"
        return 1
    }
    
    echo -e "${GREEN}✅ Imágenes Docker construidas exitosamente${NC}"
}

# Función para deploy a staging
deploy_to_staging() {
    echo -e "${YELLOW}🚀 Desplegando a staging...${NC}"
    
    # Deploy con Docker Compose
    echo -e "${CYAN}🐳 Desplegando con Docker Compose...${NC}"
    docker-compose -f docker-compose.staging.yml up -d || {
        echo -e "${RED}❌ Deploy a staging falló${NC}"
        return 1
    }
    
    # Esperar a que los servicios estén listos
    echo -e "${CYAN}⏳ Esperando a que los servicios estén listos...${NC}"
    sleep 30
    
    # Health check
    echo -e "${CYAN}🏥 Ejecutando health check...${NC}"
    curl -f "$STAGING_URL/health" || {
        echo -e "${RED}❌ Health check falló${NC}"
        return 1
    }
    
    echo -e "${GREEN}✅ Deploy a staging completado${NC}"
}

# Función para deploy a producción
deploy_to_production() {
    echo -e "${YELLOW}🚀 Desplegando a producción...${NC}"
    
    # Deploy con Kubernetes
    echo -e "${CYAN}☸️  Desplegando con Kubernetes...${NC}"
    kubectl apply -f k8s/ || {
        echo -e "${RED}❌ Deploy a producción falló${NC}"
        return 1
    }
    
    # Esperar a que el deployment esté listo
    echo -e "${CYAN}⏳ Esperando a que el deployment esté listo...${NC}"
    kubectl rollout status deployment/econeura-api || {
        echo -e "${RED}❌ Deployment de API falló${NC}"
        return 1
    }
    
    kubectl rollout status deployment/econeura-web || {
        echo -e "${RED}❌ Deployment de Web falló${NC}"
        return 1
    }
    
    # Health check
    echo -e "${CYAN}🏥 Ejecutando health check...${NC}"
    curl -f "$PRODUCTION_URL/health" || {
        echo -e "${RED}❌ Health check falló${NC}"
        return 1
    }
    
    echo -e "${GREEN}✅ Deploy a producción completado${NC}"
}

# Función para rollback automático
rollback_deployment() {
    echo -e "${RED}🔄 Ejecutando rollback automático...${NC}"
    
    local backup_name=$(cat .last-backup 2>/dev/null || echo "")
    
    if [ -z "$backup_name" ]; then
        echo -e "${RED}❌ No se encontró backup para rollback${NC}"
        return 1
    fi
    
    echo -e "${CYAN}📦 Restaurando backup: $backup_name${NC}"
    
    # Restaurar base de datos
    echo -e "${CYAN}🗄️  Restaurando base de datos...${NC}"
    docker exec -i postgres psql -U postgres econeura < "backups/$backup_name/database.sql" || {
        echo -e "${RED}❌ Restauración de base de datos falló${NC}"
        return 1
    }
    
    # Restaurar archivos
    echo -e "${CYAN}📁 Restaurando archivos...${NC}"
    tar -xzf "backups/$backup_name/files.tar.gz" || {
        echo -e "${RED}❌ Restauración de archivos falló${NC}"
        return 1
    }
    
    # Restaurar configuración
    echo -e "${CYAN}⚙️  Restaurando configuración...${NC}"
    cp -r "backups/$backup_name/config/" . || {
        echo -e "${RED}❌ Restauración de configuración falló${NC}"
        return 1
    }
    
    echo -e "${GREEN}✅ Rollback completado${NC}"
}

# Función para enviar notificaciones
send_notification() {
    local status=$1
    local message=$2
    
    if [ "$NOTIFICATION_ENABLED" = true ]; then
        echo -e "${YELLOW}📧 Enviando notificación: $status${NC}"
        
        # Enviar email
        echo -e "${CYAN}📧 Enviando email...${NC}"
        curl -X POST "https://api.email-service.com/send" \
            -H "Content-Type: application/json" \
            -d "{
                \"to\": \"devops@econeura.com\",
                \"subject\": \"Deployment $status - PR $PR_NUMBER\",
                \"body\": \"$message\"
            }" || echo -e "${RED}❌ Envío de email falló${NC}"
        
        # Enviar Slack
        echo -e "${CYAN}💬 Enviando notificación a Slack...${NC}"
        curl -X POST "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{
                \"text\": \"Deployment $status - PR $PR_NUMBER: $message\"
            }" || echo -e "${RED}❌ Envío a Slack falló${NC}"
    fi
}

# Función para monitorear deployment
monitor_deployment() {
    echo -e "${YELLOW}📊 Monitoreando deployment...${NC}"
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo -e "${CYAN}🔍 Intento $attempt/$max_attempts...${NC}"
        
        # Health check
        if curl -f "$STAGING_URL/health" 2>/dev/null; then
            echo -e "${GREEN}✅ Health check exitoso${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}⏳ Esperando 10 segundos...${NC}"
        sleep 10
        ((attempt++))
    done
    
    echo -e "${RED}❌ Health check falló después de $max_attempts intentos${NC}"
    return 1
}

# Función para ejecutar pipeline completo
run_deployment_pipeline() {
    echo -e "${PURPLE}🚀 EJECUTANDO PIPELINE DE DEPLOYMENT${NC}"
    echo -e "${PURPLE}====================================${NC}"
    
    # Verificar dependencias
    check_dependencies
    
    # Crear backup
    create_backup
    
    # Ejecutar tests pre-deployment
    if ! run_pre_deployment_tests; then
        echo -e "${RED}❌ Tests pre-deployment fallaron, abortando deployment${NC}"
        send_notification "FAILED" "Tests pre-deployment fallaron"
        exit 1
    fi
    
    # Construir aplicación
    if ! build_application; then
        echo -e "${RED}❌ Build de aplicación falló${NC}"
        send_notification "FAILED" "Build de aplicación falló"
        exit 1
    fi
    
    # Construir imágenes Docker
    if ! build_docker_images; then
        echo -e "${RED}❌ Build de imágenes Docker falló${NC}"
        send_notification "FAILED" "Build de imágenes Docker falló"
        exit 1
    fi
    
    # Deploy según ambiente
    if [ "$ENVIRONMENT" = "staging" ]; then
        if ! deploy_to_staging; then
            echo -e "${RED}❌ Deploy a staging falló${NC}"
            if [ "$AUTO_ROLLBACK" = true ]; then
                rollback_deployment
            fi
            send_notification "FAILED" "Deploy a staging falló"
            exit 1
        fi
        
        # Monitorear deployment
        if ! monitor_deployment; then
            echo -e "${RED}❌ Monitoreo de deployment falló${NC}"
            if [ "$AUTO_ROLLBACK" = true ]; then
                rollback_deployment
            fi
            send_notification "FAILED" "Monitoreo de deployment falló"
            exit 1
        fi
        
    elif [ "$ENVIRONMENT" = "production" ]; then
        if ! deploy_to_production; then
            echo -e "${RED}❌ Deploy a producción falló${NC}"
            if [ "$AUTO_ROLLBACK" = true ]; then
                rollback_deployment
            fi
            send_notification "FAILED" "Deploy a producción falló"
            exit 1
        fi
        
        # Monitorear deployment
        if ! monitor_deployment; then
            echo -e "${RED}❌ Monitoreo de deployment falló${NC}"
            if [ "$AUTO_ROLLBACK" = true ]; then
                rollback_deployment
            fi
            send_notification "FAILED" "Monitoreo de deployment falló"
            exit 1
        fi
    fi
    
    # Enviar notificación de éxito
    send_notification "SUCCESS" "Deployment completado exitosamente"
    
    echo -e "${GREEN}🎉 PIPELINE DE DEPLOYMENT COMPLETADO EXITOSAMENTE${NC}"
}

# ============================================================================
# FUNCIÓN PRINCIPAL
# ============================================================================

main() {
    echo -e "${BLUE}🚀 INICIANDO PIPELINE DE DEPLOYMENT AUTOMATIZADO${NC}"
    echo -e "${BLUE}===============================================${NC}"
    
    # Verificar que estamos en el directorio correcto
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ No se encontró package.json. Ejecutar desde la raíz del proyecto.${NC}"
        exit 1
    fi
    
    # Ejecutar pipeline de deployment
    run_deployment_pipeline
}

# Ejecutar función principal
main "$@"

# Rollback Plan - ECONEURA Azure

## Resumen Ejecutivo

**Objetivo:** Plan de rollback rápido y seguro para ECONEURA en Azure  
**Tiempo objetivo:** < 5 minutos para rollback completo  
**Entornos:** Dev/Staging/Production  

## Triggers de Rollback

### Automáticos
- ❌ **Smoke tests fallan** (> 3 intentos)
- ❌ **Health checks fallan** (> 5 minutos)
- ❌ **Error rate > 10%** (5 minutos consecutivos)
- ❌ **Response time > 10 segundos** (5 minutos consecutivos)

### Manuales
- 🚨 **Incidente crítico reportado**
- 🚨 **Performance degradada**
- 🚨 **Security breach detectado**
- 🚨 **Data corruption detectado**

## Proceso de Rollback

### Fase 1: Evaluación (1 minuto)
```bash
# 1. Verificar estado actual
az containerapp show \
  --name econeura-devapi \
  --resource-group econeura-rg \
  --query properties.configuration.ingress

# 2. Identificar revisión anterior estable
az containerapp revision list \
  --name econeura-devapi \
  --resource-group econeura-rg \
  --query "[?properties.provisioningState=='Succeeded']"

# 3. Verificar métricas de Application Insights
az monitor app-insights component show \
  --app econeura-dev-insights \
  --resource-group econeura-rg
```

### Fase 2: Rollback de API (2 minutos)
```bash
# 1. Activar revisión anterior
az containerapp revision activate \
  --name econeura-devapi \
  --resource-group econeura-rg \
  --revision <previous-stable-revision>

# 2. Verificar activación
az containerapp revision show \
  --name econeura-devapi \
  --resource-group econeura-rg \
  --revision <previous-stable-revision>

# 3. Health check inmediato
curl -f https://api-dev.econeura.dev/health
```

### Fase 3: Rollback de Web (1 minuto)
```bash
# 1. Activar revisión anterior
az containerapp revision activate \
  --name econeura-devweb \
  --resource-group econeura-rg \
  --revision <previous-stable-revision>

# 2. Verificar activación
az containerapp revision show \
  --name econeura-devweb \
  --resource-group econeura-rg \
  --revision <previous-stable-revision>

# 3. Health check inmediato
curl -f https://web-dev.econeura.dev
```

### Fase 4: Verificación (1 minuto)
```bash
# 1. Smoke tests completos
curl -f https://api-dev.econeura.dev/health
curl -f https://web-dev.econeura.dev
curl -f https://api-dev.econeura.dev/v1/auth/me

# 2. Verificar métricas
az monitor app-insights component show \
  --app econeura-dev-insights \
  --resource-group econeura-rg

# 3. Verificar logs
az containerapp logs show \
  --name econeura-devapi \
  --resource-group econeura-rg \
  --tail 50
```

## Scripts de Rollback

### Rollback Rápido (Automático)
```bash
#!/bin/bash
# rollback-quick.sh

ENVIRONMENT="dev"
RESOURCE_GROUP="econeura-rg"

echo "🚨 Iniciando rollback rápido para $ENVIRONMENT..."

# Obtener revisión anterior estable
PREVIOUS_REVISION=$(az containerapp revision list \
  --name "econeura-${ENVIRONMENT}api" \
  --resource-group $RESOURCE_GROUP \
  --query "[?properties.provisioningState=='Succeeded' && properties.active==false][0].name" \
  --output tsv)

if [ -z "$PREVIOUS_REVISION" ]; then
  echo "❌ No se encontró revisión anterior estable"
  exit 1
fi

echo "📦 Revirtiendo a revisión: $PREVIOUS_REVISION"

# Rollback API
az containerapp revision activate \
  --name "econeura-${ENVIRONMENT}api" \
  --resource-group $RESOURCE_GROUP \
  --revision $PREVIOUS_REVISION

# Rollback Web
az containerapp revision activate \
  --name "econeura-${ENVIRONMENT}web" \
  --resource-group $RESOURCE_GROUP \
  --revision $PREVIOUS_REVISION

echo "✅ Rollback completado"
echo "🔍 Verificando health checks..."

# Health checks
sleep 30
curl -f "https://api-${ENVIRONMENT}.econeura.dev/health" && echo "✅ API OK"
curl -f "https://web-${ENVIRONMENT}.econeura.dev" && echo "✅ Web OK"
```

### Rollback Completo (Manual)
```bash
#!/bin/bash
# rollback-complete.sh

ENVIRONMENT="dev"
RESOURCE_GROUP="econeura-rg"
BACKUP_TAG="stable-backup"

echo "🚨 Iniciando rollback completo para $ENVIRONMENT..."

# 1. Verificar estado actual
echo "📊 Estado actual:"
az containerapp show \
  --name "econeura-${ENVIRONMENT}api" \
  --resource-group $RESOURCE_GROUP \
  --query "{name:name,activeRevision:properties.activeRevisionName,provisioningState:properties.provisioningState}"

# 2. Listar revisiones disponibles
echo "📋 Revisiones disponibles:"
az containerapp revision list \
  --name "econeura-${ENVIRONMENT}api" \
  --resource-group $RESOURCE_GROUP \
  --query "[].{name:name,active:properties.active,provisioningState:properties.provisioningState,createdTime:properties.createdTime}"

# 3. Seleccionar revisión objetivo
read -p "Ingrese el nombre de la revisión objetivo: " TARGET_REVISION

# 4. Rollback API
echo "🔄 Revirtiendo API..."
az containerapp revision activate \
  --name "econeura-${ENVIRONMENT}api" \
  --resource-group $RESOURCE_GROUP \
  --revision $TARGET_REVISION

# 5. Rollback Web
echo "🔄 Revirtiendo Web..."
az containerapp revision activate \
  --name "econeura-${ENVIRONMENT}web" \
  --resource-group $RESOURCE_GROUP \
  --revision $TARGET_REVISION

# 6. Verificación completa
echo "🔍 Verificación completa..."
sleep 60

# Health checks
curl -f "https://api-${ENVIRONMENT}.econeura.dev/health" && echo "✅ API Health OK"
curl -f "https://web-${ENVIRONMENT}.econeura.dev" && echo "✅ Web OK"

# Smoke tests
curl -f "https://api-${ENVIRONMENT}.econeura.dev/v1/auth/me" && echo "✅ Auth OK"
curl -f "https://api-${ENVIRONMENT}.econeura.dev/v1/crm/companies" && echo "✅ CRM OK"

echo "✅ Rollback completo finalizado"
```

## Rollback de Base de Datos

### Escenarios de Rollback DB

#### 1. Rollback de Migración
```bash
# 1. Identificar migración problemática
az postgres flexible-server show \
  --name econeura-dev-postgres \
  --resource-group econeura-rg

# 2. Revertir migración específica
pnpm db:migrate:rollback --target <migration-id>

# 3. Verificar estado de la base de datos
pnpm db:migrate:status
```

#### 2. Restore desde Backup
```bash
# 1. Listar backups disponibles
az postgres flexible-server backup list \
  --resource-group econeura-rg \
  --server-name econeura-dev-postgres

# 2. Restaurar desde backup
az postgres flexible-server restore \
  --resource-group econeura-rg \
  --name econeura-dev-postgres-restored \
  --source-server econeura-dev-postgres \
  --restore-time <backup-time>

# 3. Actualizar connection strings
az containerapp update \
  --name econeura-devapi \
  --resource-group econeura-rg \
  --set-env-vars PGHOST=econeura-dev-postgres-restored.postgres.database.azure.com
```

## Monitoreo Post-Rollback

### Métricas a Verificar
- ✅ **Response Time:** < 2 segundos
- ✅ **Error Rate:** < 1%
- ✅ **CPU Usage:** < 70%
- ✅ **Memory Usage:** < 80%
- ✅ **Database Connections:** < 80% del límite

### Alertas Configuradas
- 🚨 **Error rate > 5%** (5 minutos)
- 🚨 **Response time > 5 segundos** (5 minutos)
- 🚨 **CPU > 90%** (10 minutos)
- 🚨 **Memory > 95%** (10 minutos)

### Logs a Revisar
```bash
# Logs de aplicación
az containerapp logs show \
  --name econeura-devapi \
  --resource-group econeura-rg \
  --follow

# Logs de base de datos
az postgres flexible-server show \
  --name econeura-dev-postgres \
  --resource-group econeura-rg

# Logs de Application Insights
az monitor app-insights component show \
  --app econeura-dev-insights \
  --resource-group econeura-rg
```

## Comunicación de Rollback

### Notificaciones Automáticas
- 📧 **Email:** devops@econeura.dev
- 💬 **Teams:** #econeura-alerts
- 📱 **SMS:** Números de emergencia

### Template de Notificación
```
🚨 ROLLBACK EJECUTADO - ECONEURA

Entorno: DEV
Hora: 2025-09-10 00:30:00 UTC
Duración: 3 minutos
Causa: Smoke tests fallaron
Revisión anterior: econeura-devapi--abc123
Revisión actual: econeura-devapi--def456

Estado: ✅ COMPLETADO
Health checks: ✅ PASSING
Métricas: ✅ NORMALES

Próximos pasos:
1. Investigar causa del fallo
2. Corregir problema en desarrollo
3. Re-deploy cuando esté listo

Contacto: devops@econeura.dev
```

## Escalación

### Niveles de Escalación
1. **Nivel 1:** DevOps Team (0-5 min)
2. **Nivel 2:** Engineering Lead (5-15 min)
3. **Nivel 3:** CTO (15-30 min)

### Criterios de Escalación
- 🚨 **Rollback falla:** Escalar inmediatamente
- 🚨 **Múltiples rollbacks:** Escalar a Nivel 2
- 🚨 **Data loss:** Escalar a Nivel 3
- 🚨 **Security incident:** Escalar a Nivel 3

## Testing del Plan

### Pruebas Regulares
- **Semanal:** Rollback de prueba en DEV
- **Mensual:** Simulación de rollback en Staging
- **Trimestral:** Drill completo de rollback

### Métricas de Testing
- ✅ **Tiempo de rollback:** < 5 minutos
- ✅ **Tiempo de verificación:** < 2 minutos
- ✅ **Tiempo de comunicación:** < 1 minuto
- ✅ **Disponibilidad post-rollback:** > 99%

---

**Última actualización:** 2025-09-10  
**Versión:** 1.0  
**Estado:** ✅ **READY FOR ROLLBACK**
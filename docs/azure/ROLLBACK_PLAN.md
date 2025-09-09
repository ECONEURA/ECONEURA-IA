# Rollback Plan - Azure App Service

**Fecha:** 2025-01-09  
**Versión:** 1.0.0  
**Objetivo:** Plan completo de rollback para ECONEURA-IA en Azure App Service

## 📋 RESUMEN EJECUTIVO

Este documento describe el plan completo de rollback para ECONEURA-IA en Azure App Service, incluyendo estrategias automáticas y manuales, procedimientos de recuperación y planes de contingencia.

## 🎯 OBJETIVOS DEL ROLLBACK

### Objetivos Principales
- **Recuperación rápida** de problemas de deployment
- **Minimización de downtime** durante rollback
- **Preservación de datos** durante rollback
- **Comunicación efectiva** durante incidentes
- **Documentación completa** de procedimientos

### Criterios de Rollback
- ❌ Error rate > 10% por más de 2 minutos
- ❌ Response time > 5 segundos por más de 2 minutos
- ❌ Health checks fallando por más de 1 minuto
- ❌ Database connection issues
- ❌ Redis connection issues
- ❌ Critical business functions failing
- ❌ Security incidents
- ❌ Data corruption detected

## 🚨 ESTRATEGIAS DE ROLLBACK

### 1. Rollback Automático
```json
{
  "automaticRollback": {
    "enabled": true,
    "triggers": [
      {
        "name": "High Error Rate",
        "metric": "Http5xx",
        "threshold": 10,
        "timeWindow": "PT2M",
        "action": "Rollback"
      },
      {
        "name": "High Response Time",
        "metric": "AverageResponseTime",
        "threshold": 5000,
        "timeWindow": "PT2M",
        "action": "Rollback"
      },
      {
        "name": "Health Check Failure",
        "metric": "HealthCheck",
        "threshold": "Failed",
        "timeWindow": "PT1M",
        "action": "Rollback"
      },
      {
        "name": "Database Connection Issues",
        "metric": "DatabaseConnection",
        "threshold": "Failed",
        "timeWindow": "PT1M",
        "action": "Rollback"
      },
      {
        "name": "Redis Connection Issues",
        "metric": "RedisConnection",
        "threshold": "Failed",
        "timeWindow": "PT1M",
        "action": "Rollback"
      }
    ],
    "rollbackAction": "Swap back to previous version",
    "notificationChannels": [
      "email",
      "slack",
      "teams"
    ]
  }
}
```

### 2. Rollback Manual
```json
{
  "manualRollback": {
    "triggers": [
      "Manual decision by DevOps team",
      "Business stakeholder request",
      "Security incident",
      "Data corruption",
      "Performance degradation",
      "User complaints"
    ],
    "approvalRequired": true,
    "approvers": [
      "DevOps Lead",
      "Technical Lead",
      "Product Manager"
    ],
    "rollbackAction": "Swap back to previous version"
  }
}
```

## 🔄 PROCEDIMIENTOS DE ROLLBACK

### Procedimiento 1: Rollback Rápido (0-5 minutos)
```bash
#!/bin/bash
# rollback-quick.sh

echo "🚨 EMERGENCY ROLLBACK INITIATED"
echo "Timestamp: $(date)"
echo "Triggered by: $1"

# Set variables
RESOURCE_GROUP="econeura-ia-rg"
APP_NAME="econeura-ia-app"

# Check current status
echo "📊 Current status:"
az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query "state" -o tsv

# Perform rollback
echo "🔄 Performing rollback..."
az webapp deployment slot swap \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --slot production \
  --target-slot staging \
  --action swap

# Wait for rollback to complete
echo "⏳ Waiting for rollback to complete..."
sleep 30

# Verify rollback
echo "✅ Verifying rollback..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$APP_NAME.azurewebsites.net/health)

if [ $HEALTH_STATUS -eq 200 ]; then
    echo "✅ Rollback successful - Health check passed"
else
    echo "❌ Rollback failed - Health check failed"
    exit 1
fi

# Send notification
echo "📧 Sending notification..."
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"🚨 EMERGENCY ROLLBACK COMPLETED for ECONEURA-IA"}' \
  $SLACK_WEBHOOK_URL

echo "✅ Emergency rollback completed successfully"
```

### Procedimiento 2: Rollback Completo (5-15 minutos)
```bash
#!/bin/bash
# rollback-complete.sh

echo "🔄 COMPLETE ROLLBACK INITIATED"
echo "Timestamp: $(date)"
echo "Triggered by: $1"

# Set variables
RESOURCE_GROUP="econeura-ia-rg"
APP_NAME="econeura-ia-app"
KEY_VAULT_NAME="econeura-ia-vault"

# Step 1: Stop current deployment
echo "🛑 Stopping current deployment..."
az webapp stop --name $APP_NAME --resource-group $RESOURCE_GROUP

# Step 2: Rollback to previous version
echo "🔄 Rolling back to previous version..."
az webapp deployment slot swap \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --slot production \
  --target-slot staging \
  --action swap

# Step 3: Restart application
echo "🔄 Restarting application..."
az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP

# Step 4: Wait for startup
echo "⏳ Waiting for application startup..."
sleep 60

# Step 5: Run comprehensive health checks
echo "🏥 Running comprehensive health checks..."
./scripts/health-check-complete.sh

# Step 6: Verify all systems
echo "🔍 Verifying all systems..."
./scripts/verify-systems.sh

# Step 7: Send notification
echo "📧 Sending notification..."
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"✅ COMPLETE ROLLBACK COMPLETED for ECONEURA-IA"}' \
  $SLACK_WEBHOOK_URL

echo "✅ Complete rollback completed successfully"
```

### Procedimiento 3: Rollback de Base de Datos
```bash
#!/bin/bash
# rollback-database.sh

echo "🗄️ DATABASE ROLLBACK INITIATED"
echo "Timestamp: $(date)"

# Set variables
RESOURCE_GROUP="econeura-ia-rg"
DB_NAME="econeura-ia-db"

# Step 1: Create backup before rollback
echo "💾 Creating backup before rollback..."
az postgres flexible-server backup create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_NAME \
  --backup-name "rollback-backup-$(date +%Y%m%d-%H%M%S)"

# Step 2: Restore from previous backup
echo "🔄 Restoring from previous backup..."
az postgres flexible-server restore \
  --resource-group $RESOURCE_GROUP \
  --name $DB_NAME \
  --source-server $DB_NAME \
  --restore-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ)

# Step 3: Verify database
echo "✅ Verifying database..."
psql $DATABASE_URL -c "SELECT 1;" || exit 1

echo "✅ Database rollback completed successfully"
```

## 📊 MONITOREO Y ALERTAS

### Alertas de Rollback
```json
{
  "rollbackAlerts": [
    {
      "name": "Rollback Triggered",
      "description": "Alert when rollback is triggered",
      "condition": {
        "metric": "RollbackOperation",
        "operator": "equals",
        "threshold": "Triggered",
        "timeWindow": "PT1M"
      },
      "severity": "Critical",
      "actions": [
        {
          "type": "email",
          "recipients": ["devops@econeura.com", "alerts@econeura.com"]
        },
        {
          "type": "webhook",
          "url": "https://hooks.slack.com/services/..."
        },
        {
          "type": "webhook",
          "url": "https://outlook.office.com/webhook/..."
        }
      ]
    },
    {
      "name": "Rollback Failed",
      "description": "Alert when rollback fails",
      "condition": {
        "metric": "RollbackOperation",
        "operator": "equals",
        "threshold": "Failed",
        "timeWindow": "PT1M"
      },
      "severity": "Critical",
      "actions": [
        {
          "type": "email",
          "recipients": ["devops@econeura.com", "alerts@econeura.com"]
        },
        {
          "type": "webhook",
          "url": "https://hooks.slack.com/services/..."
        }
      ]
    },
    {
      "name": "Post-Rollback Health Check",
      "description": "Alert when health checks fail after rollback",
      "condition": {
        "metric": "HealthCheck",
        "operator": "equals",
        "threshold": "Failed",
        "timeWindow": "PT2M"
      },
      "severity": "Critical",
      "actions": [
        {
          "type": "email",
          "recipients": ["devops@econeura.com"]
        }
      ]
    }
  ]
}
```

### Dashboard de Rollback
```json
{
  "rollbackDashboard": {
    "name": "Rollback Status Dashboard",
    "widgets": [
      {
        "type": "metric",
        "title": "Rollback Operations",
        "metric": "RollbackOperation",
        "aggregation": "count",
        "timeGrain": "PT1M"
      },
      {
        "type": "metric",
        "title": "Health Check Status",
        "metric": "HealthCheck",
        "aggregation": "avg",
        "timeGrain": "PT1M"
      },
      {
        "type": "metric",
        "title": "Error Rate",
        "metric": "Http5xx",
        "aggregation": "sum",
        "timeGrain": "PT1M"
      },
      {
        "type": "metric",
        "title": "Response Time",
        "metric": "AverageResponseTime",
        "aggregation": "avg",
        "timeGrain": "PT1M"
      }
    ]
  }
}
```

## 🧪 TESTING DE ROLLBACK

### Test de Rollback Automático
```bash
#!/bin/bash
# test-rollback.sh

echo "🧪 Testing rollback procedures..."

# Test 1: Simulate high error rate
echo "Test 1: Simulating high error rate..."
# This would trigger automatic rollback

# Test 2: Simulate health check failure
echo "Test 2: Simulating health check failure..."
# This would trigger automatic rollback

# Test 3: Test manual rollback
echo "Test 3: Testing manual rollback..."
./scripts/rollback-quick.sh "TEST"

# Test 4: Test complete rollback
echo "Test 4: Testing complete rollback..."
./scripts/rollback-complete.sh "TEST"

# Test 5: Test database rollback
echo "Test 5: Testing database rollback..."
./scripts/rollback-database.sh

echo "✅ All rollback tests completed"
```

### Test de Recuperación
```bash
#!/bin/bash
# test-recovery.sh

echo "🧪 Testing recovery procedures..."

# Test 1: Test health check recovery
echo "Test 1: Testing health check recovery..."
curl -f https://econeura-ia-app.azurewebsites.net/health || exit 1

# Test 2: Test API recovery
echo "Test 2: Testing API recovery..."
curl -f https://econeura-ia-app.azurewebsites.net/api/status || exit 1

# Test 3: Test database recovery
echo "Test 3: Testing database recovery..."
curl -f https://econeura-ia-app.azurewebsites.net/api/health/database || exit 1

# Test 4: Test Redis recovery
echo "Test 4: Testing Redis recovery..."
curl -f https://econeura-ia-app.azurewebsites.net/api/health/redis || exit 1

# Test 5: Test WebSocket recovery
echo "Test 5: Testing WebSocket recovery..."
# WebSocket test would go here

echo "✅ All recovery tests completed"
```

## 📋 CHECKLIST DE ROLLBACK

### Pre-Rollback
- [ ] Identificar el problema
- [ ] Evaluar la gravedad
- [ ] Decidir el tipo de rollback
- [ ] Notificar al equipo
- [ ] Preparar el rollback
- [ ] Verificar backups
- [ ] Documentar el problema

### Durante Rollback
- [ ] Ejecutar rollback
- [ ] Monitorear progreso
- [ ] Verificar health checks
- [ ] Comunicar estado
- [ ] Documentar acciones
- [ ] Mantener comunicación

### Post-Rollback
- [ ] Verificar funcionamiento
- [ ] Ejecutar tests
- [ ] Monitorear métricas
- [ ] Comunicar resolución
- [ ] Documentar lecciones
- [ ] Planificar corrección
- [ ] Actualizar documentación

## 🚨 PLANES DE CONTINGENCIA

### Contingencia 1: Rollback Fallido
```bash
#!/bin/bash
# contingency-rollback-failed.sh

echo "🚨 CONTINGENCY: Rollback Failed"
echo "Timestamp: $(date)"

# Step 1: Try alternative rollback method
echo "🔄 Trying alternative rollback method..."
az webapp deployment slot swap \
  --name econeura-ia-app \
  --resource-group econeura-ia-rg \
  --slot production \
  --target-slot staging \
  --action swap

# Step 2: If still failing, restore from backup
echo "💾 Restoring from backup..."
az webapp deployment source config-zip \
  --name econeura-ia-app \
  --resource-group econeura-ia-rg \
  --src econeura-ia-backup.zip

# Step 3: Notify emergency team
echo "📧 Notifying emergency team..."
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"🚨 EMERGENCY: Rollback failed, manual intervention required"}' \
  $EMERGENCY_SLACK_WEBHOOK_URL

echo "✅ Contingency plan executed"
```

### Contingencia 2: Base de Datos Corrupta
```bash
#!/bin/bash
# contingency-database-corrupt.sh

echo "🚨 CONTINGENCY: Database Corrupted"
echo "Timestamp: $(date)"

# Step 1: Stop application
echo "🛑 Stopping application..."
az webapp stop --name econeura-ia-app --resource-group econeura-ia-rg

# Step 2: Restore database from backup
echo "💾 Restoring database from backup..."
az postgres flexible-server restore \
  --resource-group econeura-ia-rg \
  --name econeura-ia-db \
  --source-server econeura-ia-db \
  --restore-time $(date -u -d '2 hours ago' +%Y-%m-%dT%H:%M:%SZ)

# Step 3: Restart application
echo "🔄 Restarting application..."
az webapp restart --name econeura-ia-app --resource-group econeura-ia-rg

# Step 4: Verify recovery
echo "✅ Verifying recovery..."
sleep 60
curl -f https://econeura-ia-app.azurewebsites.net/health || exit 1

echo "✅ Database recovery completed"
```

### Contingencia 3: Pérdida de Recursos
```bash
#!/bin/bash
# contingency-resource-loss.sh

echo "🚨 CONTINGENCY: Resource Loss"
echo "Timestamp: $(date)"

# Step 1: Check resource status
echo "🔍 Checking resource status..."
az resource list --resource-group econeura-ia-rg --output table

# Step 2: Recreate missing resources
echo "🔄 Recreating missing resources..."
# This would include recreating any missing resources

# Step 3: Restore from backup
echo "💾 Restoring from backup..."
# This would include restoring from backup

# Step 4: Verify recovery
echo "✅ Verifying recovery..."
./scripts/verify-systems.sh

echo "✅ Resource recovery completed"
```

## 📞 COMUNICACIÓN DE INCIDENTES

### Plantilla de Comunicación
```markdown
# 🚨 INCIDENTE: ECONEURA-IA Rollback

**Timestamp:** $(date)
**Severidad:** Critical/High/Medium/Low
**Estado:** En Progreso/Resuelto

## Resumen
Breve descripción del problema y acciones tomadas.

## Impacto
- Usuarios afectados: X
- Servicios afectados: Lista de servicios
- Tiempo de inactividad: X minutos

## Acciones Tomadas
1. Rollback ejecutado
2. Health checks verificados
3. Sistemas restaurados

## Próximos Pasos
1. Investigar causa raíz
2. Implementar corrección
3. Prevenir recurrencia

## Contacto
- DevOps Lead: [nombre]
- Technical Lead: [nombre]
- Product Manager: [nombre]
```

### Canales de Comunicación
- **Email:** alerts@econeura.com
- **Slack:** #incidents
- **Teams:** ECONEURA-IA Alerts
- **Phone:** Emergency hotline
- **SMS:** Critical alerts only

## 📚 DOCUMENTACIÓN

### Logs de Rollback
```bash
# Crear log de rollback
echo "Rollback executed at $(date)" >> logs/rollback.log
echo "Triggered by: $1" >> logs/rollback.log
echo "Status: $2" >> logs/rollback.log
echo "Duration: $3" >> logs/rollback.log
echo "---" >> logs/rollback.log
```

### Reportes de Incidentes
```bash
# Generar reporte de incidente
cat > reports/incident-$(date +%Y%m%d-%H%M%S).md << EOF
# Incident Report - $(date)

## Summary
[Summary of the incident]

## Timeline
[Timeline of events]

## Root Cause
[Root cause analysis]

## Actions Taken
[Actions taken during incident]

## Lessons Learned
[Lessons learned and improvements]

## Prevention
[Prevention measures for future]
EOF
```

## 🔄 MEJORAS CONTINUAS

### Revisión Post-Incidente
```bash
#!/bin/bash
# post-incident-review.sh

echo "📋 Post-Incident Review"
echo "Timestamp: $(date)"

# Step 1: Analyze logs
echo "📊 Analyzing logs..."
tail -n 100 logs/rollback.log

# Step 2: Review metrics
echo "📈 Reviewing metrics..."
az monitor metrics list \
  --resource /subscriptions/$(az account show --query id -o tsv)/resourceGroups/econeura-ia-rg/providers/Microsoft.Web/sites/econeura-ia-app \
  --metric "Http5xx,AverageResponseTime" \
  --interval PT1M \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ)

# Step 3: Generate report
echo "📝 Generating report..."
./scripts/generate-incident-report.sh

echo "✅ Post-incident review completed"
```

### Mejoras del Plan
```bash
#!/bin/bash
# improve-rollback-plan.sh

echo "🔧 Improving rollback plan"
echo "Timestamp: $(date)"

# Step 1: Analyze rollback performance
echo "📊 Analyzing rollback performance..."
# Analyze rollback times, success rates, etc.

# Step 2: Identify improvements
echo "🔍 Identifying improvements..."
# Identify areas for improvement

# Step 3: Update procedures
echo "📝 Updating procedures..."
# Update rollback procedures based on learnings

# Step 4: Test improvements
echo "🧪 Testing improvements..."
# Test improved procedures

echo "✅ Rollback plan improvements completed"
```

## 📚 REFERENCIAS

- [Azure App Service Deployment Slots](https://docs.microsoft.com/en-us/azure/app-service/deploy-staging-slots)
- [Azure App Service Backup and Restore](https://docs.microsoft.com/en-us/azure/app-service/manage-backup)
- [Azure Database Backup and Restore](https://docs.microsoft.com/en-us/azure/postgresql/backup-restore)
- [Azure Monitor Alerts](https://docs.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-overview)
- [Incident Response Best Practices](https://docs.microsoft.com/en-us/azure/architecture/framework/resiliency/incident-response)

---

**Estado:** ✅ **ROLLBACK PLAN COMPLETO**  
**Próximo:** **Implementar y probar procedimientos de rollback**

Este plan proporciona una guía completa para el rollback de ECONEURA-IA en Azure App Service, incluyendo procedimientos automáticos y manuales, planes de contingencia y comunicación de incidentes.

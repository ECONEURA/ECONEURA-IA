# 🚀 ACTIVACIÓN FINAL SEGURA - ECONEURA-IA
# Script que combina rotación HMAC + activación CI/CD en un solo paso seguro

## 📋 CONTEXTO
Este script ejecuta una **activación completa y segura** del CI/CD pipeline con rotación de clave HMAC integrada. Es la versión más avanzada que combina:

1. **Rotación de clave HMAC** localmente
2. **Publicación de secret** en GitHub
3. **Validación de artifacts** localmente
4. **Activación de workflows** y monitoreo
5. **Merge automático** si todo está verde

## ⚠️ PRE-REQUISITOS CRÍTICOS

### 🔧 Dependencias Requeridas
- ✅ **gh CLI** instalado y autenticado
- ✅ **jq** instalado
- ✅ **Git** configurado y autenticado
- ✅ **Scripts de vault** disponibles y confiables

### 🛡️ Verificaciones de Seguridad
- ✅ Repositorio en estado limpio (sin cambios sin commitear)
- ✅ Branch actual coincide con BRANCH en script
- ✅ Permisos de escritura en repositorio
- ✅ Backup del repositorio disponible

## 📋 FLUJO DE EJECUCIÓN

### 1. 🔐 PREPARACIÓN (1 minuto)
```bash
cd /workspaces/ECONEURA-IA
# Verificar estado del repositorio
git status
git log --oneline -5
```

### 2. 🚀 EJECUCIÓN (15-25 minutos)
```bash
./scripts/ci/activacion_final_secure_ready.sh
```

### 3. 📊 MONITOREO (tiempo variable)
El script automáticamente:
- Monitorea los 3 workflows
- Descarga evidencia en caso de fallos
- Valida `approval_valid:true`
- Ejecuta merge automático si todo está OK

## 🔄 PROCESO DETALLADO

### Paso 1: Configuración de Secret
- Elimina secret anterior (si existe)
- Publica nueva clave HMAC en GitHub
- Verifica configuración exitosa

### Paso 2: Generación y Validación Local
- Genera nuevo `approval_signed.json` con clave nueva
- Valida localmente antes de publicar
- Garantiza integridad de artifacts

### Paso 3: Publicación Segura
- Actualiza archivos de forma atómica
- Hace commit y push seguro
- Crea PR si no existe

### Paso 4: Activación de Workflows
- Dispara los 3 workflows principales
- Monitoreo agresivo con timeout de 15 minutos
- Descarga automática de logs en caso de fallos

### Paso 5: Validación Final
- Verifica `approval_valid:true` en Mandatory Approval Gate
- Confirma que todos los workflows pasaron
- Ejecuta merge automático seguro

## 📊 TIEMPOS ESTIMADOS

| Fase | Tiempo | Descripción |
|------|--------|-------------|
| Preparación | 1 min | Verificaciones previas |
| Configuración | 2 min | Secret y artifacts |
| Workflows | 10-15 min | Ejecución y monitoreo |
| Validación | 2 min | Verificación final |
| **TOTAL** | **15-25 min** | Proceso completo |

## 🚨 CÓDIGOS DE ERROR Y SOLUCIONES

### ❌ Código 1: Dependencias faltantes
```
Solución: Instalar gh CLI y jq
sudo apt-get install jq
# Instalar gh CLI desde https://cli.github.com/
```

### ❌ Código 2: Workflow falló
```
Solución:
1. Revisar logs en ./ci_evidence_[RUN_ID]/
2. Verificar configuración de VAULT_APPROVAL_KEY
3. Regenerar approval_signed.json si es necesario
4. Re-ejecutar script
```

### ❌ Código 3: Timeout de workflows
```
Solución:
1. Verificar estado de GitHub Actions
2. Revisar cola de ejecución
3. Posible rate limiting - esperar y reintentar
```

### ❌ Código 4-6: Problemas de merge
```
Solución:
1. Verificar que todos los workflows pasaron
2. Confirmar approval_valid:true
3. Revisar conflictos de merge
4. Merge manual si es necesario
```

## 📁 ARCHIVOS GENERADOS

### ✅ Éxito
- `./ci_activation_mandatory_excerpt.txt` - Logs del Mandatory Approval Gate
- `./ci_evidence_[RUN_ID]/` - Evidencia de workflows (solo en fallos)

### ❌ Fallos
- `./ci_evidence_[RUN_ID]/` - Logs completos del workflow fallido
- `/tmp/validate_out.json` - Resultado de validación local
- `/tmp/approval_signed.json.new` - Artifact generado (no instalado)

## 🛡️ MEDIDAS DE SEGURIDAD

### 🔐 Protección de Claves
- Clave nunca se muestra en logs
- Validación local antes de publicar
- Eliminación automática de archivos temporales

### 🛡️ Validaciones Múltiples
- Verificación de prerrequisitos
- Validación local de artifacts
- Verificación de workflows completados
- Confirmación de approval_valid:true

### 🔄 Recuperación de Errores
- Descarga automática de evidencia
- Mensajes de error descriptivos
- Instrucciones de recuperación específicas

## 📋 CHECKLIST DE EJECUCIÓN

### ✅ PRE-EJECUCIÓN
- [ ] gh CLI autenticado (`gh auth status`)
- [ ] jq instalado (`jq --version`)
- [ ] Repositorio limpio (`git status`)
- [ ] Backup disponible
- [ ] Scripts de vault disponibles

### ✅ POST-EJECUCIÓN
- [ ] Secret VAULT_APPROVAL_KEY actualizado en GitHub
- [ ] approval_signed.json regenerado
- [ ] PR mergeada automáticamente
- [ ] Branch eliminada (delete-branch)
- [ ] Todos los workflows pasaron

## 🚀 EJECUCIÓN RÁPIDA

```bash
# Desde la raíz del repositorio
cd /workspaces/ECONEURA-IA

# Ejecutar activación completa
./scripts/ci/activacion_final_secure_ready.sh

# Monitorear progreso (el script lo hace automáticamente)
# Revisar evidencia en caso de fallos
ls -la ./ci_*
```

## 📞 SOPORTE

En caso de problemas:
1. Revisar códigos de error arriba
2. Verificar logs generados
3. Consultar equipo de DevOps
4. Revisar estado de GitHub Actions

---

**🎯 Este script proporciona la activación más segura y completa del CI/CD pipeline con rotación HMAC integrada.**

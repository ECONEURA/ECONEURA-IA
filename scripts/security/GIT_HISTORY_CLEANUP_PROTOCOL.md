# 🚨 PROTOCOLO DE LIMPIEZA DE HISTORIAL GIT - ECONEURA-IA
# 🚨 SOLO PARA EMERGENCIAS DE SEGURIDAD GRAVE

## 📋 CONTEXTO
Este protocolo se activa cuando se detecta que una clave sensible (como VAULT_APPROVAL_KEY)
ha sido comprometida y aparece en el historial de Git.

## ⚠️ ADVERTENCIAS CRÍTICAS

### 🚨 RIESGOS
- **Reescritura permanente** del historial de Git
- **Pérdida de referencias** a commits antiguos
- **Conflictos** en branches y PRs existentes
- **Disrupción** del flujo de trabajo del equipo

### 🛡️ PRECAUCIONES
- **Backup obligatorio** antes de cualquier acción
- **Coordinación total** con el equipo
- **Comunicación clara** sobre el push forzado
- **Pruebas exhaustivas** en entorno seguro

## 📋 PASOS DEL PROTOCOLO

### 1. 📢 ACTIVACIÓN (Inmediata)
- Notificar al equipo de seguridad
- Identificar la clave comprometida
- Detener todos los pushes al repositorio
- Crear backup completo del repositorio

### 2. 🔍 INVESTIGACIÓN
- Confirmar que la clave está en el historial
- Identificar todos los commits afectados
- Documentar el alcance del compromiso
- Evaluar impacto en sistemas relacionados

### 3. 🛠️ PREPARACIÓN
```bash
# Crear directorio de trabajo seguro
mkdir -p /tmp/git-cleanup-$(date +%Y%m%d)
cd /tmp/git-cleanup-$(date +%Y%m%d)

# Clonar mirror del repositorio
git clone --mirror https://github.com/ECONEURA/ECONEURA-IA.git repo-mirror.git
cd repo-mirror.git
```

### 4. 🧪 PRUEBA EN SECO (DRY RUN)
```bash
# Ejecutar script de limpieza segura
/path/to/ECONEURA-IA/scripts/security/git_history_cleanup_safe.sh
```

### 5. ✅ VERIFICACIÓN
- Confirmar que la clave fue reemplazada por "REDACTED"
- Verificar integridad del repositorio
- Probar operaciones básicas de Git
- Validar que no se pierdan datos importantes

### 6. 📢 COORDINACIÓN CON EQUIPO
- **Slack/Teams**: Notificar sobre push forzado inminente
- **Email**: Documento oficial con timeline
- **Standup**: Revisar estado de branches locales
- **Backup**: Confirmar que todos tienen backup

### 7. 🚀 EJECUCIÓN
```bash
# Desde el directorio del mirror
cd repo-mirror.git

# Ejecutar push forzado (con coordinación)
git push --force origin --all
git push --force origin --tags
```

### 8. 🔄 RECUPERACIÓN POST-EJECUCIÓN
```bash
# Todos los miembros del equipo deben ejecutar:
git fetch --all
git reset --hard origin/main

# Para branches locales:
git checkout feature-branch
git rebase origin/main
```

## 📋 CHECKLIST DE VERIFICACIÓN

### ✅ PRE-EJECUCIÓN
- [ ] Backup completo del repositorio
- [ ] Coordinación con todo el equipo
- [ ] Comunicación clara sobre downtime
- [ ] Dry-run exitoso
- [ ] Verificación de reemplazo correcto

### ✅ POST-EJECUCIÓN
- [ ] Push forzado completado exitosamente
- [ ] Todos los miembros hicieron fetch/reset
- [ ] Branches principales funcionando
- [ ] PRs reabiertas si es necesario
- [ ] CI/CD funcionando correctamente

### ✅ VERIFICACIÓN DE SEGURIDAD
- [ ] Clave comprometida no aparece en nuevo historial
- [ ] Nuevas claves generadas y distribuidas
- [ ] Secrets de GitHub actualizados
- [ ] Accesos revocados si es necesario

## 🔧 SCRIPTS DISPONIBLES

### Script Seguro (Recomendado)
```bash
./scripts/security/git_history_cleanup_safe.sh
```
- Verificaciones automáticas
- Dry-run obligatorio
- Instrucciones detalladas
- Script de push seguro generado

### Script Manual (Avanzado)
```bash
./scripts/security/git_history_cleanup.sh
```
- Requiere configuración manual
- Sin verificaciones automáticas
- Para usuarios expertos

## 📞 CONTACTOS DE EMERGENCIA

- **Security Team**: security@econeura.com
- **DevOps Lead**: devops@econeura.com
- **Repository Admin**: admin@econeura.com

## 📝 REGISTRO DE INCIDENTES

Después de completar la limpieza, documentar:
- Fecha y hora del incidente
- Clave comprometida (hash para referencia)
- Commits afectados
- Miembros del equipo notificados
- Timeline completo de resolución
- Lecciones aprendidas

---

**🔒 RECUERDA**: La seguridad del código es responsabilidad colectiva.
Siempre prioriza la seguridad sobre la conveniencia.
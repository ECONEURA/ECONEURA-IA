# Runbook de Backup - ECONEURA

**Fecha:** $(date)  
**Fase:** PRE-MIGRACIÓN - FASE 0.3  
**Objetivo:** Guía para backups fuera de Git

## 🚫 Archivos NO incluidos en Git

### Base de Datos
- **Backups SQL:** `**/backups/**/*.sql`
- **Dumps:** `*.sql` (excepto migraciones)
- **Bases locales:** `*.db`, `*.sqlite`, `*.sqlite3`

### Binarios y Archivos Grandes
- **Comprimidos:** `*.zip`, `*.tar.gz`, `*.rar`, `*.7z`
- **Imágenes:** `*.png`, `*.jpg`, `*.jpeg`, `*.gif`, `*.ico`
- **Videos:** `*.mov`, `*.mp4`, `*.flv`
- **Audio:** `*.mp3`, `*.fla`, `*.swf`

### Archivos Temporales
- **Logs:** `*.log`, `logs/`
- **Cache:** `.cache/`, `.parcel-cache/`
- **Temporales:** `tmp/`, `temp/`

## 📦 Estrategia de Backup

### 1. Base de Datos
```bash
# Backup automático (fuera de Git)
mkdir -p ~/backups/econeura/db/$(date +%Y%m%d)
pg_dump $DATABASE_URL > ~/backups/econeura/db/$(date +%Y%m%d)/backup_$(date +%H%M%S).sql

# Backup manual
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Archivos de Configuración
```bash
# Backup de configuraciones sensibles
cp .env.example ~/backups/econeura/config/env.example.backup
cp docker-compose.yml ~/backups/econeura/config/docker-compose.yml.backup
```

### 3. Documentación Externa
```bash
# Backup de documentación crítica
tar -czf ~/backups/econeura/docs/docs_$(date +%Y%m%d).tar.gz docs/
```

## 🔄 Restauración

### Base de Datos
```bash
# Restaurar desde backup
psql $DATABASE_URL < ~/backups/econeura/db/20241209/backup_143022.sql
```

### Configuraciones
```bash
# Restaurar configuraciones
cp ~/backups/econeura/config/env.example.backup .env.example
cp ~/backups/econeura/config/docker-compose.yml.backup docker-compose.yml
```

## 📍 Ubicaciones de Backup

### Local (Desarrollo)
- **Base de datos:** `~/backups/econeura/db/`
- **Configuraciones:** `~/backups/econeura/config/`
- **Documentación:** `~/backups/econeura/docs/`

### Producción (Azure)
- **Base de datos:** Azure SQL Database (automático)
- **Blob Storage:** `econeura-backups` container
- **Key Vault:** Configuraciones sensibles

## ⚠️ Consideraciones

### Seguridad
- **Nunca** incluir backups en Git
- **Encriptar** backups sensibles
- **Rotar** backups antiguos (30 días)

### Tamaño
- **Comprimir** backups grandes
- **Limpiar** backups antiguos
- **Monitorear** espacio en disco

### Frecuencia
- **Base de datos:** Diario (automático)
- **Configuraciones:** Semanal
- **Documentación:** Mensual

## 🛠️ Scripts de Backup

### Backup Automático
```bash
#!/bin/bash
# scripts/backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$HOME/backups/econeura/$DATE"

mkdir -p "$BACKUP_DIR"

# Backup DB
pg_dump $DATABASE_URL > "$BACKUP_DIR/db_backup.sql"

# Backup configs
cp .env.example "$BACKUP_DIR/"
cp docker-compose.yml "$BACKUP_DIR/"

# Compress
tar -czf "$HOME/backups/econeura/backup_$DATE.tar.gz" -C "$BACKUP_DIR" .

# Cleanup
rm -rf "$BACKUP_DIR"

echo "Backup completed: backup_$DATE.tar.gz"
```

### Limpieza de Backups Antiguos
```bash
#!/bin/bash
# scripts/cleanup-backups.sh
find ~/backups/econeura -name "backup_*.tar.gz" -mtime +30 -delete
echo "Cleaned up backups older than 30 days"
```

## 📋 Checklist de Backup

- [ ] **Base de datos** respaldada
- [ ] **Configuraciones** respaldadas
- [ ] **Documentación** respaldada
- [ ] **Backups comprimidos**
- [ ] **Backups antiguos limpiados**
- [ ] **Verificación de integridad**

---

**Importante:** Este runbook debe actualizarse cuando cambien las configuraciones o se agreguen nuevos tipos de archivos a respaldar.

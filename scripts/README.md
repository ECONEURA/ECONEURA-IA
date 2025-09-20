# Scripts Organizados

Los scripts del proyecto han sido reorganizados en una estructura clara y mantenible. Se mantienen wrappers en el directorio raíz para compatibilidad.

## 📁 Estructura

```
scripts/
├── ci/           # Scripts de CI/CD y deployment
├── dev/          # Scripts de desarrollo y setup
├── analysis/     # Scripts de análisis y reporting
├── maintenance/  # Scripts de mantenimiento y limpieza
└── ai/          # Scripts relacionados con IA
```

## 🚀 Uso Rápido

### Scripts de CI/CD
```bash
# Ver scripts disponibles
./ci.sh

# Ejecutar un script específico
./ci.sh activacion_ci_manual
```

### Scripts de Desarrollo
```bash
# Ver scripts disponibles
./dev.sh

# Ejecutar un script específico
./dev.sh setup-ai
```

### Scripts de Análisis
```bash
# Ver scripts disponibles
./analyze.sh

# Ejecutar un script específico
./analyze.sh analysis-report
```

### Scripts de Mantenimiento
```bash
# Ver scripts disponibles
./maintain.sh

# Ejecutar un script específico
./maintain.sh audit
```

## 📋 Categorías Detalladas

### 🔄 CI/CD (`scripts/ci/`)
Scripts para integración continua, deployment y automatización:
- `activacion_ci_manual.sh` - Activación manual de CI
- `implement_ci_workflows.sh` - Implementar workflows
- `setup-ci.sh` - Configurar entorno CI

### 🛠️ Desarrollo (`scripts/dev/`)
Scripts para setup y desarrollo local:
- `setup-ai.sh` - Configurar entorno de IA
- `ai-terminal-pro.sh` - Terminal inteligente
- `start-dev.sh` - Iniciar entorno de desarrollo

### 📊 Análisis (`scripts/analysis/`)
Scripts para análisis y reporting:
- `analysis-report.sh` - Generar reportes de análisis

### 🛡️ Mantenimiento (`scripts/maintenance/`)
Scripts para mantenimiento y seguridad:
- `audit.sh` - Auditorías de seguridad
- `scan-secrets.sh` - Escaneo de secrets

## 🔧 Migración

### Para Usuarios
Los wrappers en el directorio raíz mantienen compatibilidad:
```bash
# Antes
./activacion_ci_manual.sh

# Ahora (ambas formas funcionan)
./ci.sh activacion_ci_manual
./scripts/ci/activacion_ci_manual.sh
```

### Para Contribuidores
Al agregar nuevos scripts:

1. **Elegir categoría apropiada** en `/scripts/`
2. **Agregar documentación** en el script
3. **Actualizar wrappers** si es necesario
4. **Documentar en este README**

## 📚 Mejores Prácticas

### Nombres de Scripts
- Usar kebab-case: `setup-database.sh`
- Ser descriptivos: `deploy-production.sh`
- Incluir acción: `cleanup-cache.sh`

### Documentación
Cada script debe incluir:
```bash
#!/bin/bash
# Descripción: Breve descripción del script
# Uso: script.sh [opciones]
# Autor: Nombre
# Fecha: YYYY-MM-DD
```

### Manejo de Errores
```bash
set -e  # Salir en error
trap 'echo "Error en línea $LINENO"' ERR
```

### Logging
```bash
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" >&2
}
```

## 🔍 Troubleshooting

### Script no encontrado
```bash
# Ver scripts disponibles en categoría
./ci.sh

# Buscar script específico
find scripts/ -name "*script-name*"
```

### Permisos denegados
```bash
# Dar permisos de ejecución
chmod +x scripts/ci/script.sh
```

### Dependencias faltantes
Verificar que las herramientas requeridas estén instaladas:
- Node.js para scripts JS
- Docker para contenedores
- Azure CLI para deployment

## 📊 Estadísticas

- **Total scripts**: 117 organizados
- **Categorías**: 5 principales
- **Wrappers**: 4 para compatibilidad
- **Documentación**: README por categoría

## 🚀 Próximos Pasos

- [ ] Crear documentación individual por script
- [ ] Implementar testing para scripts críticos
- [ ] Agregar validación de parámetros
- [ ] Crear dashboard de estado de scripts
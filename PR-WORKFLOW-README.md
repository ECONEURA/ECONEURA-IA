# 🚀 ECONEURA PR WORKFLOW - Sistema Completo para Trabajar PRs

## 📋 Descripción

Sistema completo para trabajar con Pull Requests de manera **ordenada**, **limpia** y **eficiente**, con integración perfecta con GitHub. Diseñado específicamente para el proyecto ECONEURA-IA.

## 🎯 Características

- ✅ **Automatización completa** del flujo de trabajo de PRs
- ✅ **Integración con GitHub** (creación, merge, sincronización)
- ✅ **Verificaciones de calidad** automáticas (ESLint, TypeScript, Tests)
- ✅ **Commits estructurados** con mensajes consistentes
- ✅ **Procesamiento en lote** de múltiples PRs
- ✅ **Reportes automáticos** y notificaciones
- ✅ **Configuración inicial** automatizada
- ✅ **Git hooks** para mantener calidad del código

## 📁 Archivos del Sistema

```
├── work-pr.sh              # Comando principal para trabajar PRs
├── auto-pr.sh              # Automatización completa de PRs
├── setup-pr-workflow.sh    # Configuración inicial del entorno
└── PR-WORKFLOW-README.md   # Esta documentación
```

## 🚀 Instalación y Configuración

### 1. Configuración Inicial

```bash
# Configuración completa del entorno
./setup-pr-workflow.sh --full

# O configuración paso a paso
./setup-pr-workflow.sh --install-deps --setup-git --setup-hooks --setup-env
```

### 2. Verificar Configuración

```bash
# Verificar que todo está configurado correctamente
./setup-pr-workflow.sh --full
```

## 📖 Uso del Sistema

### Comando Principal: `work-pr.sh`

#### Sintaxis
```bash
./work-pr.sh [PR_NUMBER] [OPTIONS]
```

#### Opciones Disponibles
- `--create-branch` - Crear nueva rama para el PR
- `--checkout` - Cambiar a rama del PR
- `--implement` - Implementar funcionalidad del PR
- `--test` - Ejecutar tests
- `--commit` - Hacer commit con mensaje estructurado
- `--push` - Push a GitHub
- `--pr` - Crear Pull Request en GitHub
- `--merge` - Mergear PR (solo para maintainers)
- `--cleanup` - Limpiar ramas locales
- `--status` - Mostrar estado actual
- `--help` - Mostrar ayuda

#### Ejemplos de Uso

```bash
# Flujo completo para PR-8
./work-pr.sh 8 --create-branch --implement --test --commit --push --pr

# Solo implementar PR-9
./work-pr.sh 9 --checkout --implement

# Ver estado actual
./work-pr.sh --status

# Limpiar ramas locales
./work-pr.sh --cleanup
```

### Comando de Automatización: `auto-pr.sh`

#### Sintaxis
```bash
./auto-pr.sh [PR_NUMBER] [OPTIONS]
```

#### Opciones Disponibles
- `--full` - Ejecutar flujo completo
- `--implement-only` - Solo implementar
- `--test-only` - Solo ejecutar tests
- `--commit-only` - Solo hacer commit y push
- `--pr-only` - Solo crear Pull Request
- `--merge-only` - Solo mergear PR
- `--batch` - Procesar múltiples PRs en lote
- `--from-pr` - PR inicial para procesamiento en lote
- `--to-pr` - PR final para procesamiento en lote

#### Ejemplos de Uso

```bash
# Flujo completo automatizado
./auto-pr.sh 8 --full

# Solo implementar
./auto-pr.sh 9 --implement-only

# Procesar múltiples PRs
./auto-pr.sh --batch --from-pr 8 --to-pr 12

# Solo ejecutar tests
./auto-pr.sh 10 --test-only
```

## 🔧 PRs Disponibles

### PRs Implementados (PR-0 a PR-7)
- ✅ **PR-0**: Project Setup
- ✅ **PR-1**: Database Foundation
- ✅ **PR-2**: API Gateway & Auth
- ✅ **PR-3**: Business Layer Base
- ✅ **PR-4**: Presentation Layer Base
- ✅ **PR-5**: Observability + Monitoring
- ✅ **PR-6**: Companies Management
- ✅ **PR-7**: Contacts Management

### PRs Pendientes (PR-8 en adelante)
- 🔄 **PR-8**: CRM Interactions
- 🔄 **PR-9**: Deals Management
- 🔄 **PR-10**: Products Management
- 🔄 **PR-11**: Advanced CRM Analytics
- 🔄 **PR-12**: Sales Pipeline Optimization
- 🔄 **PR-13**: Advanced Features
- 🔄 **PR-14**: Enterprise AI Platform
- 🔄 **PR-15**: Azure OpenAI Migration
- ... y más hasta **PR-85**

## 📊 Flujo de Trabajo Recomendado

### 1. Trabajo Individual de PRs

```bash
# Para trabajar en un PR específico
./work-pr.sh 8 --create-branch --implement --test --commit --push --pr
```

### 2. Automatización Completa

```bash
# Para automatizar completamente un PR
./auto-pr.sh 8 --full
```

### 3. Procesamiento en Lote

```bash
# Para procesar múltiples PRs automáticamente
./auto-pr.sh --batch --from-pr 8 --to-pr 15
```

### 4. Verificación de Calidad

```bash
# Para verificar calidad del código
./auto-pr.sh 8 --test-only
```

## 🎨 Características Avanzadas

### 1. Commits Estructurados

Los commits generados automáticamente incluyen:
- **Título descriptivo** con tipo y PR number
- **Descripción detallada** de la implementación
- **Lista de cambios** implementados
- **Estadísticas** del commit
- **Objetivos** del PR
- **Próximos pasos** en el plan

### 2. Verificaciones de Calidad

- **ESLint** - Linting de código
- **TypeScript** - Verificación de tipos
- **Tests unitarios** - Pruebas de funcionalidad
- **Tests de integración** - Pruebas de integración
- **Cobertura de tests** - Verificación de cobertura

### 3. Integración con GitHub

- **Creación automática** de Pull Requests
- **Sincronización** con repositorio remoto
- **Merge automático** (con permisos)
- **Etiquetado** automático de PRs
- **Asignación** automática de revisores

### 4. Reportes y Notificaciones

- **Reportes automáticos** en formato Markdown
- **Notificaciones** de estado
- **Estadísticas** de implementación
- **Métricas** de calidad

## 🔍 Verificaciones de Calidad

### ESLint
```bash
# Verificar linting
pnpm run lint
```

### TypeScript
```bash
# Verificar tipos
pnpm run typecheck
```

### Tests
```bash
# Tests unitarios
pnpm run test

# Tests de integración
pnpm run test:integration

# Tests con cobertura
pnpm run test:coverage
```

## 📈 Métricas y Reportes

### Estadísticas de PR
- Archivos modificados
- Líneas agregadas/eliminadas
- Tiempo de implementación
- Cobertura de tests
- Puntuación de calidad

### Reportes Automáticos
- Reporte de implementación
- Reporte de calidad
- Reporte de tests
- Reporte de GitHub

## 🛠️ Configuración Avanzada

### Variables de Entorno

```bash
# Archivo .env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/econeura
GITHUB_TOKEN=your_github_token_here
GITHUB_REPO=ECONEURA/ECONEURA-IA
```

### Git Hooks

- **pre-commit**: Verificaciones antes del commit
- **commit-msg**: Validación del mensaje de commit
- **post-commit**: Notificaciones después del commit

### Configuración de GitHub

```bash
# Autenticación
gh auth login

# Configuración del repositorio
gh repo set-default ECONEURA/ECONEURA-IA
```

## 🚨 Solución de Problemas

### Problemas Comunes

1. **GitHub CLI no autenticado**
   ```bash
   gh auth login
   ```

2. **Dependencias faltantes**
   ```bash
   ./setup-pr-workflow.sh --install-deps
   ```

3. **Tests fallando**
   ```bash
   ./auto-pr.sh 8 --test-only
   ```

4. **Rama ya existe**
   ```bash
   ./work-pr.sh 8 --checkout
   ```

### Logs y Debugging

```bash
# Ver logs detallados
./work-pr.sh 8 --implement 2>&1 | tee pr-8.log

# Verificar estado
./work-pr.sh --status
```

## 📚 Ejemplos Prácticos

### Ejemplo 1: Implementar PR-8 (CRM Interactions)

```bash
# Flujo completo
./auto-pr.sh 8 --full

# O paso a paso
./work-pr.sh 8 --create-branch
./work-pr.sh 8 --implement
./work-pr.sh 8 --test
./work-pr.sh 8 --commit
./work-pr.sh 8 --push
./work-pr.sh 8 --pr
```

### Ejemplo 2: Procesar Múltiples PRs

```bash
# Procesar PRs 8-12 automáticamente
./auto-pr.sh --batch --from-pr 8 --to-pr 12
```

### Ejemplo 3: Solo Verificar Calidad

```bash
# Solo ejecutar tests
./auto-pr.sh 8 --test-only
```

## 🔄 Integración con CI/CD

### GitHub Actions

```yaml
name: PR Workflow
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  pr-workflow:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup PR Workflow
        run: ./setup-pr-workflow.sh --full
      - name: Run Tests
        run: ./auto-pr.sh ${{ github.event.number }} --test-only
```

## 📞 Soporte

### Comandos de Ayuda

```bash
# Ayuda del comando principal
./work-pr.sh --help

# Ayuda de automatización
./auto-pr.sh --help

# Ayuda de configuración
./setup-pr-workflow.sh --help
```

### Verificación del Sistema

```bash
# Verificar configuración completa
./setup-pr-workflow.sh --full

# Ver estado actual
./work-pr.sh --status
```

## 🎯 Próximos Pasos

1. **Configurar el entorno** con `./setup-pr-workflow.sh --full`
2. **Implementar PR-8** con `./auto-pr.sh 8 --full`
3. **Continuar con PR-9** y siguientes
4. **Procesar en lote** múltiples PRs
5. **Mantener calidad** con verificaciones automáticas

## 📝 Notas Importantes

- **Siempre** ejecutar tests antes de commitear
- **Verificar** que GitHub CLI está autenticado
- **Mantener** la rama main actualizada
- **Revisar** los reportes generados
- **Seguir** las convenciones de commit

---

**¡Sistema listo para trabajar con PRs de manera ordenada, limpia y eficiente!** 🚀

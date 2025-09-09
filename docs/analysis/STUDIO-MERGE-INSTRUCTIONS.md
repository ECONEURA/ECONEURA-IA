# 🔄 Instrucciones para Completar el Merge de Studio

## 📋 Estado Actual

- ✅ Directorio `studio/` preparado con estructura esperada
- ✅ Script de merge `merge-studio.sh` creado y configurado
- ✅ Documentación de proceso implementada
- ❌ Repositorio `ECONEURA/studio` no accesible (privado o inexistente)

## 🎯 Próximos Pasos

### 1. Verificar Acceso al Repositorio Studio

```bash
# Verificar si el repositorio existe y es accesible
git ls-remote https://github.com/ECONEURA/studio.git

# Si es privado, autenticarse con GitHub CLI
gh auth login
```

### 2. Ejecutar el Merge

Una vez que tengas acceso al repositorio:

```bash
# Merge automático (recomendado)
./merge-studio.sh

# O merge con dry-run para probar primero
./merge-studio.sh --dry-run

# O merge forzado sin confirmaciones
./merge-studio.sh --force

# O usar git subtree en lugar de archive
./merge-studio.sh --subtree
```

### 3. Verificar la Integración

Después del merge, verificar que:

- [ ] Los archivos se copiaron correctamente a `studio/`
- [ ] La estructura de directorios es la esperada
- [ ] No hay conflictos con el código existente
- [ ] Los tests pasan: `npm test`
- [ ] El build funciona: `npm run build`

### 4. Integración con el Sistema Principal

Una vez completado el merge:

1. **Actualizar imports/exports** si es necesario
2. **Configurar rutas** del cockpit en el sistema principal
3. **Ejecutar tests de integración**
4. **Actualizar documentación**

## 🔧 Resolución de Problemas

### Si el repositorio no existe:
- Verificar el nombre exacto del repositorio
- Comprobar si está en otra organización
- Contactar al equipo para confirmar la ubicación

### Si es privado:
- Configurar acceso con `gh auth login`
- Verificar permisos de lectura en el repositorio
- Usar token de acceso personal si es necesario

### Si hay conflictos:
- Revisar archivos en conflicto manualmente
- Usar `git mergetool` para resolverlos
- Commit manual después de resolver

## 📁 Estructura Esperada Después del Merge

```
studio/
├── src/
│   ├── components/         # Componentes React del cockpit
│   ├── services/          # Servicios del cockpit
│   ├── routes/            # Rutas API del cockpit
│   └── types/             # Tipos TypeScript
├── tests/                 # Tests del cockpit
├── docs/                  # Documentación específica
├── package.json           # Dependencias del cockpit
└── README.md              # Documentación principal
```

## 🎛️ Funcionalidad del Cockpit (PRs 54-57)

El contenido mergeado debería incluir:

- **Dashboard operacional** (`/v1/cockpit/overview`)
- **Monitor de agentes** (`/v1/cockpit/agents`)
- **Análisis de costes** (`/v1/cockpit/costs`)
- **Métricas del sistema** (`/v1/cockpit/system`)

---

**Preparado por**: GitHub Copilot Agent
**Fecha**: $(date)
**Estado**: Listo para merge cuando el repositorio esté disponible
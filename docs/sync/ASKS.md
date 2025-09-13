# ASKS.md - Permisos API Requeridos

## 🔐 **Permisos API Faltantes**

**Fecha**: 2025-09-08 14:27  
**Sync ID**: 20250908-1427  
**Estado**: PERMISOS INSUFICIENTES

## 📋 **Permisos Requeridos**

### **GitHub API Permissions**
- **repo**: Acceso completo al repositorio
- **contents:read**: Lectura de contenido
- **pull:read**: Lectura de pull requests
- **pull_request:write**: Escritura de pull requests

### **Endpoints Necesarios**
1. **GET /repos/{owner}/{repo}** - Información del repositorio
2. **GET /repos/{owner}/{repo}/git/trees/{tree_sha}** - Árbol de archivos
3. **GET /repos/{owner}/{repo}/pulls** - Lista de PRs
4. **GET /repos/{owner}/{repo}/pulls/{pull_number}** - Detalles de PR
5. **GET /repos/{owner}/{repo}/git/trees/{tree_sha}** - Árbol de PR

## 🚫 **Limitaciones Actuales**

### **Rate Limits**
- **No autenticado**: 60 requests/hour
- **Autenticado**: 5,000 requests/hour
- **Retry-After**: Variable según endpoint

### **Scope Required**
- **repo**: Acceso completo al repositorio
- **public_repo**: Solo repositorios públicos

## 🔧 **Solución Recomendada**

### **1. GitHub Personal Access Token**
```bash
# Crear token con permisos:
# - repo (acceso completo)
# - read:org (si es organización)
```

### **2. GitHub App**
```bash
# Crear GitHub App con permisos:
# - Contents: Read
# - Pull requests: Read
# - Metadata: Read
```

### **3. OAuth App**
```bash
# Crear OAuth App con scope:
# - repo
# - read:org
```

## 📊 **Impacto en Sync**

### **Sin Permisos**
- ❌ No se puede acceder a árbol de archivos
- ❌ No se puede listar PRs
- ❌ No se puede descargar contenido
- ❌ No se puede crear mirror

### **Con Permisos**
- ✅ Acceso completo al repositorio
- ✅ Descarga de todos los archivos
- ✅ Snapshot de todos los PRs
- ✅ Mirror completo funcional

## 🎯 **Próximos Pasos**

1. **Configurar autenticación** con permisos adecuados
2. **Reintentar sync** con permisos completos
3. **Verificar rate limits** y ajustar timing
4. **Completar mirror** y snapshot de PRs

---

**Nota**: Este archivo se genera automáticamente cuando faltan permisos para completar el sync.
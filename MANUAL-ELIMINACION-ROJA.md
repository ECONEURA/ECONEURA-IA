# 🎯 MANUAL DE ELIMINACIÓN RADICAL - GITHUB ACTIONS
# Guía paso a paso para eliminar TODO lo rojo y mantener solo lo verde

## 🚨 OBJETIVO: ELIMINAR TODO LO ROJO, MANTENER SOLO LO VERDE

### 📋 PASOS MANUALES DESDE LA WEB

1. **Acceder a GitHub Actions:**
   - URL: https://github.com/ECONEURA/ECONEURA-IA/actions

2. **Eliminar Runs Fallidos (ROJOS):**
   - Buscar todos los runs con ❌ (fallidos)
   - Seleccionar múltiples runs fallidos
   - Hacer clic en "Delete workflow run"
   - Repetir hasta eliminar TODOS los rojos

3. **Eliminar Runs Cancelados (AMARILLOS):**
   - Buscar runs con 🚫 (cancelados)
   - Eliminar todos los runs cancelados

4. **Deshabilitar Workflows Problemáticos:**
   - Ir a cada workflow que falla constantemente
   - Hacer clic en "..." → "Disable workflow"

5. **Limpiar Historial Antiguo:**
   - Mantener solo los últimos 3-5 runs exitosos por workflow
   - Eliminar todo el historial antiguo

### 🛠️ SCRIPTS AUTOMATIZADOS

**Windows PowerShell:**
```powershell
.\scripts\eliminate-red-actions.ps1
```

**Linux/Mac Bash:**
```bash
chmod +x scripts/eliminate-red-actions.sh
./scripts/eliminate-red-actions.sh
```

### 🔧 COMANDOS DIRECTOS (GitHub CLI)

```bash
# Autenticarse primero
gh auth login

# Eliminar todos los runs fallidos
gh run list --repo ECONEURA/ECONEURA-IA --status failure --limit 500 --json databaseId --jq '.[].databaseId' | xargs -I {} gh run delete {} --repo ECONEURA/ECONEURA-IA --confirm

# Eliminar runs cancelados
gh run list --repo ECONEURA/ECONEURA-IA --status cancelled --limit 500 --json databaseId --jq '.[].databaseId' | xargs -I {} gh run delete {} --repo ECONEURA/ECONEURA-IA --confirm

# Listar workflows para deshabilitar manualmente los problemáticos
gh workflow list --repo ECONEURA/ECONEURA-IA

# Deshabilitar workflow específico
gh workflow disable [WORKFLOW_ID] --repo ECONEURA/ECONEURA-IA
```

### ⚡ ELIMINACIÓN EXPRESS

**Para máxima rapidez, ejecutar en orden:**

1. **Eliminar masivamente por estado:**
   ```bash
   # Fallidos
   gh api repos/ECONEURA/ECONEURA-IA/actions/runs --paginate | jq '.workflow_runs[] | select(.conclusion=="failure") | .id' | xargs -I {} gh api repos/ECONEURA/ECONEURA-IA/actions/runs/{} -X DELETE
   
   # Cancelados
   gh api repos/ECONEURA/ECONEURA-IA/actions/runs --paginate | jq '.workflow_runs[] | select(.conclusion=="cancelled") | .id' | xargs -I {} gh api repos/ECONEURA/ECONEURA-IA/actions/runs/{} -X DELETE
   ```

2. **Deshabilitar todos los workflows activos (luego reactivar solo los necesarios):**
   ```bash
   gh workflow list --repo ECONEURA/ECONEURA-IA --json id | jq '.[].id' | xargs -I {} gh workflow disable {} --repo ECONEURA/ECONEURA-IA
   ```

### 🎯 RESULTADO ESPERADO

Después de la limpieza:
- ✅ Solo runs VERDES (exitosos) visibles
- ❌ Cero runs ROJOS (fallidos)
- 🚫 Workflows problemáticos deshabilitados
- 🧹 Historial limpio y organizado

### 🔗 VERIFICACIÓN FINAL

Visitar: https://github.com/ECONEURA/ECONEURA-IA/actions
- Debe mostrar solo checks verdes ✅
- Sin runs rojos ❌
- Sin runs cancelados 🚫
- Historial limpio y profesional
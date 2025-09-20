# 🛡️ CONFIGURACIÓN DE BRANCH PROTECTION RULES

## 📋 INSTRUCCIONES PARA CONFIGURAR PROTECCIÓN DE RAMAS

### Paso 1: Acceder a Settings
Ve a: https://github.com/ECONEURA/ECONEURA-IA/settings/branches

### Paso 2: Configurar Branch Protection Rule

#### Rama a Proteger: `main`

#### ✅ Configuraciones Requeridas:

**Branch protection rules:**
- ☑️ Require a pull request before merging
- ☑️ Require approvals (1)
- ☑️ Dismiss stale pull request approvals when new commits are pushed
- ☑️ Require review from Code Owners (opcional)
- ☑️ Restrict who can dismiss pull request reviews (opcional)

**Required status checks:**
- ☑️ Require status checks to pass before merging
- ☑️ Require branches to be up to date before merging
- ☑️ Status checks found in the last week for this repository:
  - `mandatory-approval-gate`
  - `basic-validation`
  - `openapi-check`
  - `integration-tests-with-compose`

**Branch restrictions:**
- ☑️ Restrict who can push to matching branches
- ☑️ Allow specified actors to bypass required pull requests (solo admins si es necesario)

**Additional settings:**
- ☑️ Include administrators
- ☑️ Restrict deletions
- ☑️ Restrict force pushes

### Paso 3: Verificar Configuración

Después de guardar, deberías ver:
- ✅ Branch protection rule aplicada a `main`
- ✅ Status checks requeridos configurados
- ✅ Pull request reviews obligatorios

### 🔍 Verificación Automática

Ejecuta este comando para verificar que las reglas están aplicadas:

```bash
gh api repos/ECONEURA/ECONEURA-IA/branches/main/protection | jq .
```

Deberías ver una respuesta JSON con todas las reglas configuradas.

## 🎯 Beneficios de Esta Configuración

1. **Seguridad Mejorada**: Todas las PRs requieren aprobación HMAC
2. **Calidad Garantizada**: Status checks obligatorios antes del merge
3. **Auditoría Completa**: Trazabilidad de todos los cambios
4. **Prevención de Errores**: Validaciones automáticas antes del merge

## 🚨 Importante

- Solo administradores pueden hacer merge directo a `main`
- Todas las PRs requieren al menos 1 aprobación
- Los status checks deben pasar antes del merge
- No se permiten force pushes ni eliminación de rama
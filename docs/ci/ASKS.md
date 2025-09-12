# CI ASKS - Comandos Requeridos

## GitHub CLI Authentication

Para completar el inventario de GitHub, ejecutar:

```bash
gh auth login
```

**Scopes requeridos:**
- `repo` (acceso completo al repositorio)
- `workflow` (lectura de workflows y runs)

## Comandos de Inventario

Una vez autenticado, ejecutar:

```bash
# Lista de PRs
gh pr list --state all --limit 300 --json number,title,state,mergedAt,headRefName,baseRefName,updatedAt > docs/status/PR_STATUS_REAL.json

# Lista de runs
gh run list --limit 100 --json name,status,conclusion,headSha,headBranch,createdAt,event > docs/ci/RUNS_SUMMARY.md
```

## Contexto del Repositorio

```bash
git remote -v > .artifacts/context.json
```

## Notas

- Sin autenticación de GitHub CLI, el inventario se documenta pero no se ejecuta
- Los comandos están listos para ejecutar cuando se disponga de permisos
- El proceso continúa sin fallar por falta de permisos
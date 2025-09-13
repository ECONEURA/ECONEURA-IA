# CI / GH Auth: instrucciones

El comando `gh auth status` indicó que no hay sesión activa. Para que el agente pueda abrir PRs y operar con `gh` en CI local, sigue estos pasos manuales (no bloqueante):

1. Ejecuta `gh auth login --scopes repo,workflow` y sigue el asistente para autenticarte contra GitHub.
2. Verifica con `gh auth status`.
3. Si no puedes autenticar, el flujo de CI usará artefactos y enlaces manuales; la rama `pr/docs/master-guide` ya fue creada y pusheada.

Notas: no incluir tokens en los archivos del repo. Usa el helper `gh` para operaciones con PR.
# CI ASKS - Comandos Requeridos para Auditoría

## GitHub CLI Authentication

Para completar la auditoría completa del repositorio, ejecutar:

```bash
gh auth login
```

**Scopes requeridos:**
- `repo` (acceso completo al repositorio)
- `workflow` (lectura de workflows y runs)
- `actions` (lectura de acciones y artefactos)

## Comandos de Auditoría

Una vez autenticado, ejecutar:

```bash
# Lista de PRs (últimos 300)
gh pr list --state all --limit 300 --json number,title,state,mergedAt,headRefName,baseRefName,updatedAt > docs/status/PR_STATUS_REAL.json

# Lista de runs (últimos 100)
gh run list --limit 100 --json name,status,conclusion,headSha,headBranch,createdAt,event > docs/ci/CI_MATRIX.md

# Detalles de workflows
gh workflow list --json name,state,createdAt,updatedAt > docs/ci/WORKFLOWS.json
```

## Contexto del Repositorio

```bash
# Información del repositorio
git remote -v > .artifacts/context.json
echo "{\"owner\":\"ECONEURA\",\"repo\":\"ECONEURA-IA\",\"branch\":\"$(git branch --show-current)\",\"sha\":\"$(git rev-parse HEAD)\",\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > .artifacts/context.json
```

## Notas

- Sin autenticación de GitHub CLI, la auditoría se ejecuta en modo local
- Los scripts de auditoría están preparados para funcionar con o sin permisos
- El proceso continúa sin fallar por falta de permisos
- Los comandos están listos para ejecutar cuando se disponga de permisos
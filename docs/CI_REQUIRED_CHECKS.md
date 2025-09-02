# Checks requeridos (Branch Protection)

Marca como **Required** en PR:

- `contract-api / contract`
- `e2e-playwright / e2e`
- `k6-smoke / perf`
- `openapi-check / checksum`

## Paso automático
Usa el script (requiere `gh` autenticado con permisos repo:admin):

```bash
./scripts/ci/set-required-checks.sh <owner> <repo> <branch>
# Ejemplo:
# ./scripts/ci/set-required-checks.sh ACME ECONEURA-IA main
```

Idempotente: si ya están activos, no falla.

> Mantén estos nombres exactamente para que coincidan con los workflows.
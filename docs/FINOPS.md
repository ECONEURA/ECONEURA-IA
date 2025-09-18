# FinOps — guard 80/90/100 y Kill-switch

## API de administración
- `GET /v1/admin/finops/killswitch` → estado actual `{ agents, departments }`.
- `PATCH /v1/admin/finops/killswitch` → activar/desactivar para un `agent_key` o `department_key`.
  ```json
  { "agent_key": "cfo_dunning", "enabled": true }
  ```

## Comportamiento en /v1
- Si kill-switch está `true`, el middleware de guard responde 403 (o 429 si presupuesto agotado), y añade `X-Budget-Pct`.
- Cabeceras FinOps en toda respuesta `/v1`: `X-Est-Cost-EUR`, `X-Budget-Pct`, `X-Route`, `X-Correlation-Id`.

## Operación
- Integrar este endpoint con Cockpit (toggle por agente/departamento).
- Alertas al 80/90/100% y `kill=true` visibles en paneles.

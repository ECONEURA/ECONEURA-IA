# GAP F7

- Smoke /healthz falló (proxy no levantó o puerto 3001 ocupado).
- POST /api/invoke/a-ceo-01 falló (rellena NEURA_GATEWAY_BASE y NEURA_TOKEN en .env.f7.local).
- El front no usa /api (configura VITE_NEURA_GW_URL=/api).

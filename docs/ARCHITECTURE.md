# ARCHITECTURE

Mermaid diagrama (alto nivel) y descripción de límites.

```mermaid
graph LR
  subgraph Apps
    API["apps/api (OpenAPI /v1)"]
    WEB["apps/web (Cockpit UI)"]
    WORKERS["apps/workers"]
  end
  subgraph Packages
    SHARED["packages/shared"]
    DB["packages/db"]
    SDK["packages/sdk"]
  end
  API -->|uses| DB
  API -->|imports| SHARED
  WEB -->|BFF/SSE| API
  WORKERS -->|uses| DB
  SHARED -->|types| SDK
```

Límites clave:

- apps/* sólo deben importar packages/*
- packages/shared no debe importar apps/*

Ver `scripts/deps/check.mjs` (PR-3) para enforcement.

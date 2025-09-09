# Repository Review

## A) Resumen ejecutivo
- Cobertura: No disponible
- ESLint: 61 errores / 117 warnings
- Duplicados: No disponible
- Workflows sin DEPLOY_ENABLED: 4
- Alertas npm audit: No disponible

## B) Salud del repo
| Métrica | Estado |
|--------|-------|
| Cobertura de pruebas | No disponible |
| Errores ESLint | 61 |
| Warnings ESLint | 117 |
| Clusters duplicados | No disponible |
| LOC duplicadas | No disponible |
| Workflows sin gating | 4 |
| Alertas audit | No disponible |

## C) Top-10 riesgos
1. Sin cobertura de pruebas (QA)
2. 61 errores ESLint (Frontend)
3. Sin escaneo de secretos (Security)
4. Falta de semgrep (Security)
5. Auditoría npm fallida (DevOps)
6. Sin reporte jscpd (DevOps)
7. Código muerto no evaluado (Backend)
8. Sin gráficas de dependencias (Architect)
9. Workflows sin DEPLOY_ENABLED (DevOps)
10. Revisión manual de migraciones/RLS (DBA)

## D) Hallazgos clave
- .github/workflows/deploy.yml:204 `az containerapp update`
- .github/workflows/deploy.yml:230 `az containerapp update`
- .github/workflows/deploy.yml:244 `az functionapp deployment source config-zip`
- docs/deployment-guide.md:106 `az webapp config backup create`
- docs/DEPLOYMENT.md:346 `az webapp log tail`
- ops/azure-pack/hardening.sh:7 `az webapp config set`
- scripts/deploy.sh:354 `az webapp deployment source config-zip`
- infrastructure/azure/README.md:242 `az webapp config hostname add`
- packages/db/migrations/001_initial_schema.sql:165-184 índices múltiples
- packages/db/migrations/001_initial_schema.sql:212-248 políticas RLS

## E) Arquitectura
- Ciclos y capas: No disponible (madge/depcruise faltan)
- Módulos hotspot: No disponible

## F) Seguridad
- Secretos referenciados: No disponible (gitleaks no ejecutado)
- Hallazgos críticos: No disponible

## G) Planes
### Plan 24h (PRs)
1. PR: enable vitest coverage (DoD: pruebas ejecutan, cobertura generada)
2. PR: fix ESLint errors (DoD: lint sin errores)
3. PR: add gitleaks scan (DoD: reporte sin secretos)
4. PR: add semgrep scan (DoD: reporte sin errores críticos)
5. PR: configure npm audit access (DoD: AUDIT.json con resultados)
6. PR: add DEPLOY_ENABLED gating (DoD: workflows con condicion)
7. PR: add jscpd, knip, ts-prune reports (DoD: archivos generados)
### Plan 7 días
- Automatizar gráficos de dependencias
- Limpiar código muerto y duplicado
- Revisar políticas RLS e índices
- Completar análisis de PRs e issues


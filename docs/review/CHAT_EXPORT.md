## Tabla de salud
| Métrica | Estado |
|--------|-------|
| Cobertura de pruebas | No disponible |
| Errores ESLint | 61 |
| Warnings ESLint | 117 |
| Workflows sin gating | 4 |
| Alertas audit | No disponible |

## Top-10 riesgos
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

## Próximos 5 PR
1. enable vitest coverage
2. fix ESLint errors
3. add gitleaks scan
4. add semgrep scan
5. configure npm audit access

## RUTAS CLAVE
- docs/audit/REPO_META.json
- docs/audit/BRANCHES.json
- docs/audit/PRS_REAL.json
- docs/audit/ISSUES.json
- docs/audit/NO_DEPLOY_EVIDENCE.md
- docs/audit/ESLINT.json
- docs/audit/VITEST.json
- docs/audit/AUDIT.json
- docs/audit/GITLEAKS.json
- docs/audit/SEMGREP.json
- docs/audit/jscpd-report.json
- docs/audit/jscpd-report.html
- docs/audit/KNIP.json
- docs/audit/TS_PRUNE.txt
- docs/audit/CLOC.txt
- docs/audit/deps_graph.json
- docs/audit/depcruise.json
- docs/audit/DB_INVENTORY.json
- docs/review/REVIEW.md
- docs/review/RISK_REGISTER.csv
- docs/review/FINDINGS.json
- docs/review/PR_STATE.csv
- docs/review/PR_STATUS.json
- docs/review/CHAT_EXPORT.md

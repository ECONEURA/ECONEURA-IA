# BRANCH PROTECTION

## Configuración de Protección de Rama Main

Este documento describe la configuración de protección de la rama `main` para garantizar la calidad del código.

### Checks Requeridos

#### CI Min (Obligatorio)
- **Workflow**: `ci-min.yml`
- **Descripción**: Build y tests unitarios
- **Requisitos**:
  - ✅ Build exitoso
  - ✅ Tests unitarios pasando
  - ✅ Coverage ≥ 60% (temporal)
  - ✅ Sin errores de TypeScript

#### CI Extended (Opcional)
- **Workflow**: `ci-extended.yml`
- **Descripción**: Tests E2E, calidad, seguridad
- **Requisitos**:
  - ✅ Tests E2E pasando
  - ✅ OpenAPI diff = 0
  - ✅ JSCPD ≤ 10%
  - ✅ Gitleaks = 0
  - ✅ Lychee = 0

### Configuración de Protección

```yaml
# Configuración recomendada para GitHub
branch_protection:
  main:
    required_status_checks:
      strict: true
      contexts:
        - "CI Min"
    enforce_admins: true
    required_pull_request_reviews:
      required_approving_review_count: 1
      dismiss_stale_reviews: true
      require_code_owner_reviews: false
    restrictions: null
```

### Flujo de Trabajo

1. **Desarrollo**: Trabajar en ramas feature
2. **Pull Request**: Crear PR hacia main
3. **CI Min**: Debe pasar obligatoriamente
4. **Review**: Al menos 1 aprobación
5. **Merge**: Solo cuando CI Min esté verde

### Excepciones

- **Hotfixes**: Requieren aprobación adicional
- **Dependencias**: Requieren revisión de seguridad
- **Configuración**: Requieren revisión de DevOps

### Monitoreo

- **Dashboard**: GitHub Actions
- **Alertas**: Slack/Email en fallos
- **Métricas**: Coverage, tiempo de build, flaky tests

---

**IMPORTANTE**: Esta configuración debe implementarse en GitHub Settings > Branches > main

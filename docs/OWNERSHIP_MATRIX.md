# ECONEURA Ownership Matrix

**Generated**: 2024-01-15  
**Purpose**: Define clear ownership and responsibility for different areas of the ECONEURA platform

## Team Structure

### Core Teams

| Team | Responsibility | Members | Contact |
|------|----------------|---------|---------|
| **@econeura/core-team** | Overall architecture, shared packages, global decisions | Tech Lead, Principal Engineers | #core-team |
| **@econeura/api-team** | Backend APIs, services, data layer | Backend Engineers | #api-team |
| **@econeura/frontend-team** | Web UI, user experience, client-side | Frontend Engineers | #frontend-team |
| **@econeura/infrastructure-team** | Database, cloud infrastructure, deployment | DevOps Engineers | #infrastructure-team |
| **@econeura/devops-team** | CI/CD, automation, tooling | DevOps Engineers | #devops-team |
| **@econeura/security-team** | Security, compliance, vulnerability management | Security Engineers | #security-team |
| **@econeura/qa-team** | Testing, quality assurance, test automation | QA Engineers | #qa-team |
| **@econeura/ops-team** | Operations, monitoring, incident response | SRE Engineers | #ops-team |
| **@econeura/docs-team** | Documentation, knowledge management | Technical Writers | #docs-team |

## Ownership Matrix

### Applications

| Component | Primary Owner | Secondary Owner | Review Required |
|-----------|---------------|-----------------|-----------------|
| `/apps/api/` | @econeura/api-team | @econeura/core-team | ✅ Required |
| `/apps/api-agents-make/` | @econeura/api-team | @econeura/core-team | ✅ Required |
| `/apps/api-neura-comet/` | @econeura/api-team | @econeura/core-team | ✅ Required |
| `/apps/workers/` | @econeura/api-team | @econeura/infrastructure-team | ✅ Required |
| `/apps/web/` | @econeura/frontend-team | @econeura/core-team | ✅ Required |

### Packages

| Component | Primary Owner | Secondary Owner | Review Required |
|-----------|---------------|-----------------|-----------------|
| `/packages/shared/` | @econeura/core-team | @econeura/api-team | ✅ Required |
| `/packages/sdk/` | @econeura/core-team | @econeura/api-team | ✅ Required |
| `/packages/ui/` | @econeura/frontend-team | @econeura/core-team | ✅ Required |
| `/packages/db/` | @econeura/infrastructure-team | @econeura/api-team | ✅ Required |

### Infrastructure

| Component | Primary Owner | Secondary Owner | Review Required |
|-----------|---------------|-----------------|-----------------|
| `/infra/` | @econeura/infrastructure-team | @econeura/devops-team | ✅ Required |
| `/terraform/` | @econeura/infrastructure-team | @econeura/devops-team | ✅ Required |
| `/.github/workflows/` | @econeura/devops-team | @econeura/core-team | ✅ Required |
| `/scripts/` | @econeura/devops-team | @econeura/core-team | ✅ Required |

### Security & Compliance

| Component | Primary Owner | Secondary Owner | Review Required |
|-----------|---------------|-----------------|-----------------|
| `/scripts/security/` | @econeura/security-team | @econeura/core-team | ✅ Required |
| `/scripts/ops/` | @econeura/security-team | @econeura/devops-team | ✅ Required |
| `/.gitleaks.toml` | @econeura/security-team | @econeura/core-team | ✅ Required |
| `/LICENSES_DENYLIST.md` | @econeura/security-team | @econeura/core-team | ✅ Required |

### Documentation

| Component | Primary Owner | Secondary Owner | Review Required |
|-----------|---------------|-----------------|-----------------|
| `/docs/` | @econeura/docs-team | @econeura/core-team | ✅ Required |
| `/docs/runbooks/` | @econeura/ops-team | @econeura/docs-team | ✅ Required |
| `/docs/azure/` | @econeura/ops-team | @econeura/infrastructure-team | ✅ Required |
| `*.md` | @econeura/docs-team | @econeura/core-team | ✅ Required |

### Testing

| Component | Primary Owner | Secondary Owner | Review Required |
|-----------|---------------|-----------------|-----------------|
| `/tests/` | @econeura/qa-team | @econeura/core-team | ✅ Required |
| `/scripts/test/` | @econeura/qa-team | @econeura/devops-team | ✅ Required |
| `/scripts/contracts/` | @econeura/qa-team | @econeura/api-team | ✅ Required |

## Review Requirements

### Critical Changes (Require 2+ Approvals)
- Security-related changes
- Infrastructure changes
- Database schema changes
- API breaking changes
- Configuration changes affecting production

### Standard Changes (Require 1+ Approval)
- Feature implementations
- Bug fixes
- Documentation updates
- Test additions
- Refactoring

### Emergency Changes (Require 1+ Approval + Post-Review)
- Hotfixes for production issues
- Security patches
- Critical bug fixes

## Auto-Labels

The following labels are automatically applied based on file changes:

| File Pattern | Auto-Label | Description |
|--------------|------------|-------------|
| `/apps/api/**` | `area:api` | Backend API changes |
| `/apps/web/**` | `area:frontend` | Frontend changes |
| `/packages/db/**` | `area:database` | Database changes |
| `/.github/workflows/**` | `area:ci-cd` | CI/CD changes |
| `/scripts/security/**` | `area:security` | Security changes |
| `/docs/**` | `area:documentation` | Documentation changes |
| `/tests/**` | `area:testing` | Testing changes |
| `/infra/**` | `area:infrastructure` | Infrastructure changes |

## Escalation Path

### Level 1: Team Lead
- Standard reviews and approvals
- Team-specific decisions
- Code quality standards

### Level 2: Core Team
- Cross-team coordination
- Architecture decisions
- Security reviews

### Level 3: Tech Lead
- Strategic decisions
- Major architectural changes
- Production deployment approvals

## Contact Information

### Slack Channels
- `#core-team` - Core team discussions
- `#api-team` - Backend development
- `#frontend-team` - Frontend development
- `#infrastructure-team` - Infrastructure and DevOps
- `#security-team` - Security and compliance
- `#qa-team` - Quality assurance
- `#ops-team` - Operations and monitoring
- `#docs-team` - Documentation

### Emergency Contacts
- **P0 Issues**: @econeura/oncall
- **Security Issues**: @econeura/security-team
- **Infrastructure Issues**: @econeura/infrastructure-team

## Review Guidelines

### What to Look For
1. **Code Quality**: Readability, maintainability, performance
2. **Security**: Input validation, authentication, authorization
3. **Testing**: Unit tests, integration tests, edge cases
4. **Documentation**: Code comments, API documentation, README updates
5. **Compliance**: GDPR, security standards, licensing

### Review Checklist
- [ ] Code follows project standards
- [ ] Tests are included and passing
- [ ] Security considerations addressed
- [ ] Documentation updated
- [ ] No breaking changes (or properly documented)
- [ ] Performance impact considered
- [ ] Dependencies updated appropriately

## Updates

This ownership matrix is reviewed and updated quarterly or when team structure changes.

**Last Updated**: 2024-01-15  
**Next Review**: 2024-04-15

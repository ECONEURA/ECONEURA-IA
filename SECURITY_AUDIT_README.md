# ECONEURA-IA Security & Audit System

## Overview

ECONEURA-IA implements a comprehensive security and audit system with HMAC-SHA256 approval validation, automated evidence collection, and production-ready deployment safeguards.

## Architecture

### Core Components

1. **HMAC Security System**
   - SHA256-based approval signatures
   - Python fallback (no openssl dependency)
   - Vault integration support
   - Automated key management

2. **Audit Evidence Chain**
   - Complete artifact collection
   - Data masking for sensitive information
   - Timestamped evidence packages
   - Immutable audit trails

3. **Canary Deployment System**
   - Gradual rollout protection
   - Automated rollback capabilities
   - Health monitoring integration
   - Traffic splitting controls

4. **FinOps Cost Control**
   - Real-time cost monitoring
   - Budget enforcement middleware
   - Usage analytics and alerts
   - Multi-tenant cost isolation

## Quick Start

### Automated Audit Pipeline

Run the complete security audit and approval process:

```bash
# Run full automated pipeline
./scripts/automated_audit_pipeline.sh

# Or specify custom approval file
./scripts/automated_audit_pipeline.sh audit/my_approval.json
```

### Manual Approval Process

1. **Generate Approval Request**
```bash
# Create approval request
cat > audit/approval_request.json << EOF
{
  "trace_id": "manual-$(date +%Y%m%dT%H%M%SZ)",
  "action": "promote_models_and_apply_infra",
  "created_at": "$(date --iso-8601=seconds)",
  "note": "Manual security review",
  "reviewer": "security_team"
}
EOF
```

2. **Sign Approval**
```bash
# Set approval key
export VAULT_APPROVAL_KEY="your-hex-key-here"

# Sign the approval
./scripts/vault/generate_hmac_approval_fast.sh audit/approval_request.json > audit/approval_signed.json
```

3. **Validate Signature**
```bash
# Validate the signature
./scripts/vault/validate_hmac_approval.sh audit/approval_signed.json
```

4. **Create Evidence**
```bash
# Generate REVIEW_OK evidence
./scripts/automated_audit_pipeline.sh audit/approval_signed.json
```

## Security Features

### HMAC-SHA256 Approval System

- **Cryptographic Security**: SHA256 hashing with secret key
- **Replay Protection**: Timestamp-based signatures
- **Key Management**: Environment variables or Vault integration
- **Audit Trail**: Complete signature validation history

### Evidence Collection

- **Automated Collection**: Scripts gather all relevant artifacts
- **Data Masking**: Sensitive information automatically redacted
- **Compression**: Evidence packaged in tamper-evident archives
- **Integrity Checks**: SHA256 checksums for all evidence files

### Deployment Safeguards

- **Canary Deployments**: Gradual rollout with health checks
- **Rollback Automation**: One-click reversion capabilities
- **Traffic Management**: Load balancer integration for safe rollouts
- **Monitoring Integration**: Real-time health and performance metrics

## File Structure

```
audit/
├── approval_request_*.json          # Approval requests
├── approval_request_*.signed.json   # Signed approvals
├── REVIEW_OK.json                   # Approval evidence
├── evidence_*.tar.gz               # Evidence packages
├── audit_summary_*.json            # Audit reports
└── *_masked.json                   # Sanitized artifacts

scripts/
├── automated_audit_pipeline.sh     # Main pipeline script
└── vault/
    ├── generate_hmac_approval.sh       # Original signer
    ├── generate_hmac_approval_fast.sh  # Optimized signer
    └── validate_hmac_approval.sh       # Signature validator

services/
├── neuras/                        # 10 specialized AI services
├── controller/                    # Canary deployment controller
├── middleware/finops_guard.py     # Cost control middleware
└── make_adapter/                  # Workflow automation

scenarios/                         # 50 Make.com automation scenarios
```

## Configuration

### Environment Variables

```bash
# HMAC approval key (hex format)
export VAULT_APPROVAL_KEY="a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef"

# Vault configuration (optional)
export VAULT_ADDR="https://vault.example.com"
export VAULT_TOKEN="your-vault-token"
```

### Key Management

The system supports multiple key sources:

1. **Environment Variable**: `VAULT_APPROVAL_KEY`
2. **Vault Secret**: `secret/econeura/approval_key`
3. **Interactive Prompt**: Manual key entry (fallback)

## API Endpoints

### Controller Service

```bash
# Health check
GET /health

# Canary deployment status
GET /api/v1/canary/status

# Promote canary to production
POST /api/v1/canary/promote

# Rollback deployment
POST /api/v1/canary/rollback
```

### FinOps Middleware

```bash
# Cost monitoring
GET /api/v1/costs/current

# Budget alerts
GET /api/v1/costs/alerts

# Usage analytics
GET /api/v1/costs/analytics
```

## Monitoring & Alerts

### Health Checks

- Service availability monitoring
- Dependency health validation
- Performance metric collection
- Automated alert generation

### Audit Logging

- Complete operation traceability
- Security event logging
- Compliance evidence collection
- Automated report generation

## Troubleshooting

### Common Issues

1. **HMAC Validation Fails**
   - Verify key matches between generation and validation
   - Check file encoding (should be UTF-8)
   - Ensure payload format is consistent

2. **Evidence Collection Errors**
   - Check file permissions in audit directory
   - Verify jq and base64 are installed
   - Ensure sufficient disk space for evidence packages

3. **Deployment Issues**
   - Validate canary health checks pass
   - Check rollback procedures are configured
   - Verify traffic splitting is working correctly

### Debug Mode

Enable verbose logging:

```bash
export DEBUG_AUDIT=1
./scripts/automated_audit_pipeline.sh
```

## Compliance & Security

### Security Standards

- **Cryptographic Security**: HMAC-SHA256 implementation
- **Key Management**: Secure key storage and rotation
- **Audit Trails**: Complete operation logging
- **Access Control**: Role-based approval system

### Compliance Features

- **Evidence Preservation**: Tamper-evident audit logs
- **Data Masking**: Automatic PII redaction
- **Timestamp Authority**: UTC timestamps with timezone
- **Chain of Custody**: Complete artifact traceability

## Development

### Adding New Services

1. Create service directory under `services/neuras/`
2. Implement FastAPI application with OpenAPI spec
3. Add health checks and monitoring
4. Update deployment configurations

### Extending Audit System

1. Add new evidence collectors in `scripts/`
2. Update validation logic in approval scripts
3. Extend monitoring in controller service
4. Add new compliance checks

## Production Deployment

### Prerequisites

- Python 3.8+
- jq command-line JSON processor
- base64 encoding support
- Git for version control

### Deployment Steps

1. **Security Setup**
   ```bash
   # Configure approval key
   export VAULT_APPROVAL_KEY="production-key-here"

   # Run security audit
   ./scripts/automated_audit_pipeline.sh
   ```

2. **Service Deployment**
   ```bash
   # Deploy controller service
   cd services/controller
   pip install -r requirements.txt
   python main.py

   # Deploy Neura services
   # (deployment scripts in services/ directories)
   ```

3. **Canary Rollout**
   ```bash
   # Start canary deployment
   curl -X POST http://controller:8000/api/v1/canary/start

   # Monitor health
   curl http://controller:8000/api/v1/canary/status

   # Promote to production
   curl -X POST http://controller:8000/api/v1/canary/promote
   ```

## Support

For issues and questions:

1. Check the troubleshooting section above
2. Review audit logs in `audit/` directory
3. Validate system health checks
4. Contact security team for approval issues

## Version History

- **v1.0.0**: Initial release with HMAC approval system
- Complete audit evidence chain
- Canary deployment controller
- FinOps cost monitoring middleware
- 10 specialized Neura services
- 50 Make.com automation scenarios

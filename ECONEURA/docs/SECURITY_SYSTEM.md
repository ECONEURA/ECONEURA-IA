# ECONEURA-IA Security System Documentation

## Overview
ECONEURA-IA implements a comprehensive security auditing and mitigation system with Vault-based approval workflows for secure operations.

## Architecture

### Core Components
- **Security Scanning**: Automated detection of security-sensitive code and configurations
- **Risk Classification**: Intelligent categorization of security findings
- **Approval Workflows**: Vault-based token validation for mitigation operations
- **Audit Logging**: Complete traceability of security operations
- **CI/CD Integration**: Automated security scanning in development pipelines

### Directory Structure
```
ECONEURA/
├── scripts/
│   ├── validate_env.sh          # Environment validation
│   ├── scan-secrets-basic.sh    # Basic security scanning
│   ├── approve_check.sh         # Vault approval validation
│   └── safe-mitigate.sh         # Secure mitigation with approval
├── audit/                       # Security artifacts and logs
└── workflows/                   # CI/CD integration
    └── scan-econeura.yml       # GitHub Actions workflow
```

## Security Scripts

### 1. Environment Validation (`validate_env.sh`)
Validates the development environment and required security tools.

```bash
./ECONEURA/scripts/validate_env.sh
```

**Features:**
- Tool detection (git, jq, curl, etc.)
- Environment configuration validation
- Security prerequisites checking

### 2. Basic Security Scanning (`scan-secrets-basic.sh`)
Performs comprehensive security scanning using git grep patterns.

```bash
./ECONEURA/scripts/scan-secrets-basic.sh
```

**Capabilities:**
- 9103+ potential security-sensitive references detected
- Pattern-based scanning for secrets, keys, tokens
- Risk classification and reporting
- JSON output for integration

### 3. Approval Validation (`approve_check.sh`)
Validates mitigation approval tokens using HashiCorp Vault.

```bash
./ECONEURA/scripts/approve_check.sh <trace_id> <approval_token>
```

**Security Features:**
- Vault integration for secure token storage
- Token validation with audit logging
- Graceful failure when Vault unavailable

### 4. Safe Mitigation (`safe-mitigate.sh`)
Executes security mitigation with mandatory approval validation.

```bash
./ECONEURA/scripts/safe-mitigate.sh <issue_id> <trace_id> <approval_token>
```

**Workflow:**
1. Validates approval token via Vault
2. Blocks mitigation if approval fails
3. Executes mitigation operations
4. Logs all actions to audit trail

## Vault Integration

### Configuration
Set the following environment variables for production use:

```bash
export VAULT_ADDR="https://your-vault-server.com"
export VAULT_TOKEN="your-vault-token"
```

### Secret Structure
Store approval tokens in Vault at:
```
secret/econeura/approval_token
```

Example Vault secret:
```json
{
  "data": {
    "approval_token": "your_secure_approval_token"
  }
}
```

## CI/CD Integration

### GitHub Actions Workflow
Automated security scanning is configured in `.github/workflows/scan-econeura.yml`:

- Triggers on push/PR to main branch
- Runs security validation and scanning
- Generates security reports
- Fails build on critical findings

## Usage Examples

### Complete Security Workflow

1. **Environment Setup:**
```bash
./ECONEURA/scripts/validate_env.sh
```

2. **Security Scanning:**
```bash
./ECONEURA/scripts/scan-secrets-basic.sh > security_report.json
```

3. **Approval Token Generation:**
```bash
# Generate secure approval token
APPROVAL_TOKEN=$(openssl rand -hex 32)
echo "Approval Token: $APPROVAL_TOKEN"
```

4. **Store in Vault:**
```bash
vault kv put secret/econeura/approval_token approval_token="$APPROVAL_TOKEN"
```

5. **Execute Mitigation:**
```bash
./ECONEURA/scripts/safe-mitigate.sh "SEC-001" "trace_12345" "$APPROVAL_TOKEN"
```

## Testing

### Mock Testing
For development and testing without Vault:

```bash
# Create mock Vault
mkdir test_vault
echo '{"data": {"approval_token": "test_token"}}' > test_vault/approval_token.json

# Test approval workflow
./test_approve_check.sh "trace_123" "test_token"
./test_safe_mitigate.sh "SEC-001" "trace_123" "test_token"
```

## Security Features

### Risk Mitigation
- **Zero-trust approach**: All mitigation requires explicit approval
- **Audit trail**: Complete logging of all security operations
- **Token-based access**: Secure approval validation via Vault
- **Fail-safe design**: Operations blocked when approval fails

### Compliance
- **Traceability**: Every action is logged with timestamps
- **Non-repudiation**: Approval tokens prevent denial of actions
- **Access control**: Mitigation requires authorized approval tokens

## Monitoring & Alerts

### Log Files
- `audit/mitigation.log`: Successful mitigation operations
- `audit/security_scan.log`: Security scanning results
- `audit/approval.log`: Approval validation attempts

### Metrics
- Security findings count
- Mitigation success/failure rates
- Approval validation statistics

## Troubleshooting

### Common Issues

1. **Vault Connection Failed:**
   - Verify `VAULT_ADDR` and `VAULT_TOKEN` environment variables
   - Check Vault server connectivity
   - Ensure proper network access

2. **Approval Token Invalid:**
   - Verify token matches Vault-stored value
   - Check token format and encoding
   - Review approval workflow logs

3. **Permission Denied:**
   - Ensure scripts have execute permissions
   - Check file system permissions for audit directory
   - Verify user has access to required tools

### Debug Mode
Enable verbose logging by setting:
```bash
export DEBUG_SECURITY=1
```

## Future Enhancements

### Planned Features
- Advanced AI-powered risk analysis
- Real-time security monitoring
- Automated remediation workflows
- Integration with security information systems
- Multi-cloud secret management

### Integration Points
- Microsoft 365 security integration
- WhatsApp security notifications
- Make.com workflow automation
- Prometheus metrics collection

## Support

For issues or questions regarding the security system:
1. Check audit logs in `audit/` directory
2. Review script execution with debug mode
3. Validate Vault configuration
4. Consult security team for approval token issues

---

**Version:** 1.0.0
**Last Updated:** 2025-01-20
**Security Classification:** Internal Use Only
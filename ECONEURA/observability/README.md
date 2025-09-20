# ECONEURA Security Observability

This directory contains the complete observability stack for the ECONEURA security system.

## Components

### Metrics Collection (`metrics_lib.sh`)
- Prometheus-compatible metrics in text format
- Counters, gauges, and histograms for security events
- Integration with existing security scripts

### Monitoring Stack
- **Prometheus**: Metrics collection and alerting
- **Alertmanager**: Alert routing and notification
- **Grafana**: Dashboards and visualization
- **Node Exporter**: System metrics

## Quick Start

1. **Start the monitoring stack:**
   ```bash
   cd /workspaces/ECONEURA-IA/ECONEURA
   docker-compose -f docker-compose.monitoring.yml up -d
   ```

2. **Access services:**
   - Grafana: http://localhost:3000 (admin/admin)
   - Prometheus: http://localhost:9090
   - Alertmanager: http://localhost:9093

3. **Import dashboard:**
   - The security dashboard will be automatically provisioned
   - Or manually import `grafana/dashboard.json`

## Metrics Exposed

### Security Findings
- `econeura_findings_total{tool="trufflehog|gitleaks"}` - Total findings by tool
- `econeura_findings_high` - High risk findings
- `econeura_findings_medium` - Medium risk findings
- `econeura_findings_low` - Low risk findings

### Mitigation Metrics
- `econeura_mitigations_executed` - Successful mitigations
- `econeura_mitigations_blocked` - Blocked mitigations
- `econeura_mttr_seconds` - Mean time to resolution (histogram)

### Approval Metrics
- `econeura_approvals_total` - Total approval requests
- `econeura_approvals_validated` - Validated approvals
- `econeura_approvals_rejected` - Rejected approvals

### System Health
- `econeura_up` - System health status (1=up, 0=down)
- `econeura_scan_duration_seconds` - Scan duration (histogram)

## Alerting

### Critical Alerts
- High risk findings detected
- System health degraded
- Security scan service down

### Warning Alerts
- Low mitigation success rate (< 80%)
- High approval rejection rate (> 30%)
- Slow security scans (> 5 minutes)

## Integration

To integrate metrics into your security scripts:

```bash
source /path/to/ECONEURA/scripts/metrics_lib.sh

# Record a finding
record_scan_metrics "trufflehog" 5 2 1 0

# Record mitigation
record_mitigation_metrics "success" "api_key_rotation"

# Record approval
record_approval_metrics "validated" "hmac"
```

## Configuration

### Prometheus
- Scrape interval: 30s for security metrics
- Retention: 200 hours
- Alert rules: `prometheus/alert_rules.yml`

### Alertmanager
- SMTP configuration for email alerts
- Slack integration for notifications
- PagerDuty for critical alerts

### Grafana
- Auto-provisioned datasources and dashboards
- Security-focused dashboard with key metrics
- Refresh interval: 30 seconds

## Security Considerations

- All services run in isolated Docker network
- Grafana admin password should be changed in production
- Alertmanager SMTP credentials should use secrets
- Consider HTTPS for production deployments

## Troubleshooting

### Common Issues

1. **Metrics not appearing in Prometheus:**
   - Check if security scripts are sourcing `metrics_lib.sh`
   - Verify Prometheus can reach the metrics endpoint
   - Check Prometheus logs for scrape errors

2. **Grafana dashboard not loading:**
   - Ensure dashboard JSON is valid
   - Check Grafana provisioning configuration
   - Verify file permissions

3. **Alerts not firing:**
   - Validate alert rule expressions
   - Check Alertmanager configuration
   - Verify notification channels

### Logs
```bash
# View Prometheus logs
docker logs econeura-prometheus

# View Grafana logs
docker logs econeura-grafana

# View Alertmanager logs
docker logs econeura-alertmanager
```

## Production Deployment

For production:

1. Use external Prometheus/Alertmanager instances
2. Configure proper authentication
3. Set up HTTPS certificates
4. Use managed Grafana (Grafana Cloud)
5. Configure backup and retention policies
6. Set up proper alerting channels (PagerDuty, Slack, email)
# ECONEURA Incident Response Runbook

## Overview
This runbook provides step-by-step procedures for incident response and resolution in the ECONEURA system.

## Owners
- **Primary**: On-call Engineer (oncall@econeura.dev)
- **Secondary**: DevOps Team (devops@econeura.dev)
- **Escalation**: CTO (cto@econeura.dev)
- **Emergency**: +1-555-ECONEURA (24/7)

## Incident Severity Levels

### P1 - Critical
- Complete service outage
- Data loss or corruption
- Security breach
- **Response Time**: 15 minutes
- **Resolution Time**: 4 hours

### P2 - High
- Significant service degradation
- Core functionality unavailable
- Performance issues affecting users
- **Response Time**: 1 hour
- **Resolution Time**: 24 hours

### P3 - Medium
- Minor service issues
- Non-critical functionality affected
- **Response Time**: 4 hours
- **Resolution Time**: 72 hours

### P4 - Low
- Cosmetic issues
- Enhancement requests
- **Response Time**: 24 hours
- **Resolution Time**: 1 week

## Incident Response Process

### 1. Initial Response (0-15 minutes)

#### Acknowledge Incident
```bash
# Create incident in PagerDuty
curl -X POST https://api.pagerduty.com/incidents \
  -H "Authorization: Token token=$PAGERDUTY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "incident": {
      "type": "incident",
      "title": "ECONEURA Service Outage",
      "service": {
        "id": "$SERVICE_ID",
        "type": "service_reference"
      },
      "priority": {
        "id": "$PRIORITY_ID",
        "type": "priority_reference"
      },
      "body": {
        "type": "incident_body",
        "details": "Initial incident report"
      }
    }
  }'
```

#### Assess Impact
```bash
# Check service health
curl -f https://api.econeura.dev/health || echo "API DOWN"

# Check database connectivity
pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER || echo "DB DOWN"

# Check application logs
kubectl logs -l app=econeura-api --tail=100

# Check system resources
kubectl top nodes
kubectl top pods
```

#### Notify Stakeholders
```bash
# Send Slack notification
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"🚨 INCIDENT: ECONEURA Service Outage - Investigating"}' \
  $SLACK_WEBHOOK_URL

# Send email notification
echo "ECONEURA Service Outage - Investigating" | mail -s "P1 Incident Alert" \
  stakeholders@econeura.dev
```

### 2. Investigation (15-60 minutes)

#### Gather Information
```bash
# Check application metrics
kubectl exec -it deployment/econeura-api -- curl localhost:9090/metrics

# Check database performance
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;
"

# Check system logs
journalctl -u econeura-api --since "1 hour ago" | tail -100

# Check network connectivity
kubectl get svc
kubectl get endpoints
```

#### Identify Root Cause
```bash
# Check for recent deployments
kubectl rollout history deployment/econeura-api

# Check resource usage
kubectl describe nodes
kubectl describe pods -l app=econeura-api

# Check for errors in logs
kubectl logs -l app=econeura-api --tail=1000 | grep -i error

# Check database locks
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
SELECT 
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query,
  state
FROM pg_stat_activity 
WHERE state = 'active' 
ORDER BY duration DESC;
"
```

### 3. Resolution (1-4 hours)

#### Implement Fix
```bash
# For deployment issues - rollback
kubectl rollout undo deployment/econeura-api

# For database issues - restart connection pool
kubectl delete pods -l app=econeura-api

# For resource issues - scale up
kubectl scale deployment econeura-api --replicas=5

# For configuration issues - update config
kubectl patch configmap econeura-config --patch '{"data":{"key":"value"}}'
kubectl rollout restart deployment/econeura-api
```

#### Verify Fix
```bash
# Test service endpoints
curl -f https://api.econeura.dev/health
curl -f https://api.econeura.dev/v1/ping

# Check application metrics
kubectl exec -it deployment/econeura-api -- curl localhost:9090/metrics

# Monitor for 10 minutes
for i in {1..10}; do
  echo "Check $i/10"
  curl -f https://api.econeura.dev/health || echo "Still failing"
  sleep 60
done
```

### 4. Post-Incident (4-24 hours)

#### Update Stakeholders
```bash
# Send resolution notification
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"✅ RESOLVED: ECONEURA Service Restored"}' \
  $SLACK_WEBHOOK_URL

# Update incident status
curl -X PUT https://api.pagerduty.com/incidents/$INCIDENT_ID \
  -H "Authorization: Token token=$PAGERDUTY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "incident": {
      "status": "resolved",
      "resolution": "Service restored after rollback"
    }
  }'
```

#### Document Incident
```bash
# Create incident report
cat > incident_report_$(date +%Y%m%d_%H%M%S).md << EOF
# Incident Report - $(date)

## Summary
Brief description of the incident

## Timeline
- 10:00 AM - Incident detected
- 10:15 AM - Investigation started
- 11:30 AM - Root cause identified
- 12:00 PM - Fix implemented
- 12:15 PM - Service restored

## Root Cause
Detailed explanation of the root cause

## Resolution
Steps taken to resolve the incident

## Prevention
Actions to prevent similar incidents

## Lessons Learned
Key takeaways from this incident
EOF
```

## Common Incident Scenarios

### Database Connection Issues
```bash
# Check connection pool
kubectl exec -it deployment/econeura-api -- netstat -an | grep :5432

# Restart database connections
kubectl delete pods -l app=econeura-api

# Check database status
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1;"
```

### High Memory Usage
```bash
# Check memory usage
kubectl top pods -l app=econeura-api

# Check for memory leaks
kubectl exec -it deployment/econeura-api -- curl localhost:9090/metrics | grep memory

# Restart pods if necessary
kubectl rollout restart deployment/econeura-api
```

### API Rate Limiting
```bash
# Check rate limit metrics
kubectl exec -it deployment/econeura-api -- curl localhost:9090/metrics | grep rate_limit

# Adjust rate limits
kubectl patch configmap econeura-config --patch '{"data":{"RATE_LIMIT":"1000"}}'
kubectl rollout restart deployment/econeura-api
```

### SSL Certificate Issues
```bash
# Check certificate expiration
openssl x509 -in /etc/ssl/certs/econeura.crt -text -noout | grep "Not After"

# Renew certificate
certbot renew --nginx

# Restart nginx
kubectl rollout restart deployment/nginx-ingress
```

## Monitoring and Alerting

### Key Metrics to Monitor
```bash
# Application health
curl -f https://api.econeura.dev/health

# Database connections
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT count(*) FROM pg_stat_activity;"

# Response times
kubectl exec -it deployment/econeura-api -- curl localhost:9090/metrics | grep response_time

# Error rates
kubectl exec -it deployment/econeura-api -- curl localhost:9090/metrics | grep error_rate
```

### Alert Thresholds
- Response time > 2 seconds
- Error rate > 5%
- Database connections > 80% of max
- Memory usage > 90%
- CPU usage > 80%

## Communication Templates

### Initial Alert
```
🚨 INCIDENT ALERT
Service: ECONEURA API
Severity: P1 - Critical
Status: Investigating
Impact: Complete service outage
ETA: TBD
```

### Status Update
```
📊 INCIDENT UPDATE
Service: ECONEURA API
Status: Investigating
Progress: Root cause identified - database connection pool exhausted
ETA: 30 minutes
```

### Resolution
```
✅ INCIDENT RESOLVED
Service: ECONEURA API
Resolution: Restarted database connection pool
Duration: 2 hours 15 minutes
Post-mortem: Scheduled for tomorrow
```

## Escalation Procedures

### When to Escalate
- Incident duration > 2 hours
- Multiple services affected
- Data loss suspected
- Security breach confirmed

### Escalation Contacts
```bash
# Escalate to CTO
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"🚨 ESCALATION: P1 Incident - 2+ hours unresolved"}' \
  $CTO_SLACK_WEBHOOK

# Call emergency line
echo "Calling emergency line..." && sleep 1
# +1-555-ECONEURA
```

## Tools and Resources

### Monitoring Tools
- **PagerDuty**: Incident management
- **Grafana**: Metrics visualization
- **Prometheus**: Metrics collection
- **ELK Stack**: Log aggregation

### Access Information
```bash
# Kubernetes access
kubectl config use-context econeura-prod

# Database access
export PGPASSWORD=$DB_PASSWORD
psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# AWS access
aws configure list
aws sts get-caller-identity
```

## Post-Incident Review

### Blameless Post-Mortem Process
1. **Timeline**: Document exact sequence of events
2. **Root Cause**: Identify technical and process causes
3. **Impact**: Quantify business and user impact
4. **Actions**: Define specific improvement actions
5. **Follow-up**: Schedule and track action completion

### Improvement Actions
- Update monitoring and alerting
- Improve documentation
- Enhance automation
- Conduct training sessions
- Update runbooks

## Contact Information

- **On-call Engineer**: Check PagerDuty
- **DevOps Team**: devops@econeura.dev
- **Platform Team**: platform@econeura.dev
- **Emergency**: +1-555-ECONEURA (24/7)
- **Slack**: #incidents channel

## Last Updated
2024-01-15

## Review Schedule
Monthly review by On-call Team

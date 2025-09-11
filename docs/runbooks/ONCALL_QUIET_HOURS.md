# ECONEURA On-call Quiet Hours Runbook

## Overview
This runbook defines procedures for managing on-call quiet hours and escalation policies in the ECONEURA system.

## Owners
- **Primary**: On-call Manager (oncall-manager@econeura.dev)
- **Secondary**: DevOps Team Lead (devops-lead@econeura.dev)
- **Escalation**: CTO (cto@econeura.dev)

## Quiet Hours Policy

### Standard Quiet Hours
- **Weekdays**: 10:00 PM - 8:00 AM (Local Time)
- **Weekends**: Friday 10:00 PM - Monday 8:00 AM
- **Holidays**: As defined in company calendar

### Time Zones
- **Primary**: UTC-5 (EST/EDT)
- **Secondary**: UTC-8 (PST/PDT)
- **Coverage**: 24/7 with time zone rotation

## On-call Schedule

### Rotation Schedule
```bash
# Current on-call schedule (auto-generated)
# Week 1: Primary (EST), Secondary (PST)
# Week 2: Primary (PST), Secondary (EST)
# Week 3: Primary (EST), Secondary (PST)
# Week 4: Primary (PST), Secondary (EST)

# Check current on-call
curl -X GET https://api.pagerduty.com/oncalls \
  -H "Authorization: Token token=$PAGERDUTY_TOKEN" \
  -H "Accept: application/vnd.pagerduty+json;version=2"
```

### Schedule Management
```bash
# Update on-call schedule
curl -X PUT https://api.pagerduty.com/schedules/$SCHEDULE_ID \
  -H "Authorization: Token token=$PAGERDUTY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "schedule": {
      "name": "ECONEURA On-call",
      "time_zone": "America/New_York",
      "description": "Primary on-call rotation"
    }
  }'
```

## Escalation Policies

### P1 - Critical (Always On-call)
- **Immediate**: Page on-call engineer
- **5 minutes**: Escalate to secondary
- **15 minutes**: Escalate to manager
- **30 minutes**: Escalate to CTO

### P2 - High (Quiet Hours: 30 min delay)
- **Quiet Hours**: Wait 30 minutes, then page
- **Business Hours**: Immediate page
- **Escalation**: 2 hours to manager

### P3 - Medium (Quiet Hours: 4 hour delay)
- **Quiet Hours**: Wait 4 hours, then page
- **Business Hours**: Immediate page
- **Escalation**: 24 hours to manager

### P4 - Low (No quiet hours override)
- **Always**: Wait until business hours
- **Escalation**: 72 hours to manager

## Quiet Hours Configuration

### PagerDuty Configuration
```bash
# Set quiet hours for escalation policy
curl -X PUT https://api.pagerduty.com/escalation_policies/$ESCALATION_POLICY_ID \
  -H "Authorization: Token token=$PAGERDUTY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "escalation_policy": {
      "name": "ECONEURA Escalation",
      "escalation_rules": [
        {
          "escalation_delay_in_minutes": 0,
          "targets": [
            {
              "id": "$ONCALL_USER_ID",
              "type": "user_reference"
            }
          ]
        },
        {
          "escalation_delay_in_minutes": 30,
          "targets": [
            {
              "id": "$SECONDARY_USER_ID",
              "type": "user_reference"
            }
          ]
        }
      ]
    }
  }'
```

### Business Hours Override
```bash
# Override quiet hours for critical incidents
curl -X POST https://api.pagerduty.com/incidents \
  -H "Authorization: Token token=$PAGERDUTY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "incident": {
      "type": "incident",
      "title": "CRITICAL: Override quiet hours",
      "service": {
        "id": "$SERVICE_ID",
        "type": "service_reference"
      },
      "priority": {
        "id": "$P1_PRIORITY_ID",
        "type": "priority_reference"
      },
      "urgency": "high",
      "body": {
        "type": "incident_body",
        "details": "Critical incident requiring immediate attention"
      }
    }
  }'
```

## On-call Handoff Procedures

### Daily Handoff (8:00 AM)
```bash
# Generate handoff report
cat > handoff_report_$(date +%Y%m%d).md << EOF
# On-call Handoff Report - $(date)

## Incidents Last 24 Hours
- List any incidents and their status

## Active Issues
- Any ongoing investigations or fixes

## Scheduled Maintenance
- Upcoming deployments or maintenance windows

## Notes for Next Shift
- Important context or follow-up items
EOF

# Send handoff report
curl -X POST -H 'Content-type: application/json' \
  --data "{\"text\":\"📋 On-call Handoff Report - $(date)\"}" \
  $SLACK_WEBHOOK_URL
```

### Weekly Handoff (Monday 8:00 AM)
```bash
# Generate weekly summary
cat > weekly_handoff_$(date +%Y%m%d).md << EOF
# Weekly On-call Handoff - $(date)

## Week Summary
- Total incidents: X
- P1 incidents: X
- P2 incidents: X
- Average resolution time: X hours

## Key Issues
- Major incidents and their resolution

## Process Improvements
- Any runbook updates or process changes

## Next Week Focus
- Planned maintenance or deployments
EOF
```

## Emergency Override Procedures

### Override Quiet Hours
```bash
# Emergency override script
#!/bin/bash
# /usr/local/bin/override-quiet-hours.sh

INCIDENT_ID=$1
REASON=$2

if [ -z "$INCIDENT_ID" ] || [ -z "$REASON" ]; then
  echo "Usage: $0 <incident_id> <reason>"
  exit 1
fi

# Update incident urgency
curl -X PUT https://api.pagerduty.com/incidents/$INCIDENT_ID \
  -H "Authorization: Token token=$PAGERDUTY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"incident\": {
      \"urgency\": \"high\",
      \"body\": {
        \"type\": \"incident_body\",
        \"details\": \"Quiet hours overridden: $REASON\"
      }
    }
  }"

# Notify on-call engineer
curl -X POST -H 'Content-type: application/json' \
  --data "{\"text\":\"🚨 QUIET HOURS OVERRIDE: Incident $INCIDENT_ID - $REASON\"}" \
  $SLACK_WEBHOOK_URL

echo "Quiet hours overridden for incident $INCIDENT_ID"
```

### Emergency Contact Procedures
```bash
# Emergency contact script
#!/bin/bash
# /usr/local/bin/emergency-contact.sh

SEVERITY=$1
MESSAGE=$2

case $SEVERITY in
  "P1")
    # Call primary on-call
    echo "Calling primary on-call engineer..."
    # Add actual phone call logic here
    ;;
  "P2")
    # Page primary on-call
    echo "Paging primary on-call engineer..."
    curl -X POST https://api.pagerduty.com/incidents \
      -H "Authorization: Token token=$PAGERDUTY_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"incident\": {
          \"type\": \"incident\",
          \"title\": \"$MESSAGE\",
          \"urgency\": \"high\"
        }
      }"
    ;;
  *)
    echo "Invalid severity level"
    exit 1
    ;;
esac
```

## Monitoring and Compliance

### Quiet Hours Compliance Check
```bash
# Check if incidents were properly delayed during quiet hours
curl -X GET "https://api.pagerduty.com/incidents?since=$(date -d '1 day ago' +%Y-%m-%d)&until=$(date +%Y-%m-%d)" \
  -H "Authorization: Token token=$PAGERDUTY_TOKEN" \
  -H "Accept: application/vnd.pagerduty+json;version=2" | \
  jq '.incidents[] | select(.created_at | strptime("%Y-%m-%dT%H:%M:%S") | .hour < 8 or .hour > 22)'
```

### On-call Response Time Monitoring
```bash
# Generate response time report
cat > response_time_report_$(date +%Y%m%d).md << EOF
# On-call Response Time Report - $(date)

## Response Time Metrics
- Average P1 response: X minutes
- Average P2 response: X minutes
- Average P3 response: X minutes

## Compliance
- Quiet hours violations: X
- Escalation delays: X
- Override usage: X

## Recommendations
- Areas for improvement
EOF
```

## Training and Documentation

### On-call Training Checklist
- [ ] PagerDuty setup and configuration
- [ ] Incident response procedures
- [ ] Escalation policies
- [ ] Quiet hours procedures
- [ ] Emergency override procedures
- [ ] Handoff procedures
- [ ] Monitoring and alerting tools

### Documentation Updates
```bash
# Update runbook version
sed -i "s/Last Updated: .*/Last Updated: $(date +%Y-%m-%d)/" docs/runbooks/ONCALL_QUIET_HOURS.md

# Commit changes
git add docs/runbooks/ONCALL_QUIET_HOURS.md
git commit -m "Update on-call quiet hours runbook - $(date +%Y-%m-%d)"
```

## Holiday and Vacation Coverage

### Holiday Schedule
```bash
# Check company holidays
curl -X GET "https://api.pagerduty.com/schedules/$SCHEDULE_ID/overrides" \
  -H "Authorization: Token token=$PAGERDUTY_TOKEN" \
  -H "Accept: application/vnd.pagerduty+json;version=2"

# Add holiday override
curl -X POST https://api.pagerduty.com/schedules/$SCHEDULE_ID/overrides \
  -H "Authorization: Token token=$PAGERDUTY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "override": {
      "start": "2024-12-25T00:00:00-05:00",
      "end": "2024-12-26T00:00:00-05:00",
      "user": {
        "id": "$HOLIDAY_COVERAGE_USER_ID",
        "type": "user_reference"
      }
    }
  }'
```

### Vacation Coverage
```bash
# Request vacation coverage
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"🏖️ Vacation Coverage Request: [Dates] - [Coverage needed]"}' \
  $SLACK_WEBHOOK_URL

# Update schedule for vacation
curl -X POST https://api.pagerduty.com/schedules/$SCHEDULE_ID/overrides \
  -H "Authorization: Token token=$PAGERDUTY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "override": {
      "start": "2024-01-20T00:00:00-05:00",
      "end": "2024-01-27T00:00:00-05:00",
      "user": {
        "id": "$VACATION_COVERAGE_USER_ID",
        "type": "user_reference"
      }
    }
  }'
```

## Metrics and Reporting

### Weekly On-call Metrics
```bash
# Generate weekly metrics
cat > weekly_metrics_$(date +%Y%m%d).md << EOF
# Weekly On-call Metrics - $(date)

## Incident Volume
- Total incidents: X
- P1: X (X%)
- P2: X (X%)
- P3: X (X%)
- P4: X (X%)

## Response Times
- P1 average: X minutes
- P2 average: X minutes
- P3 average: X minutes

## Quiet Hours Compliance
- Incidents during quiet hours: X
- Proper delays applied: X
- Overrides used: X

## On-call Engineer Feedback
- Workload assessment
- Process improvements
- Tool recommendations
EOF
```

## Contact Information

- **On-call Manager**: oncall-manager@econeura.dev
- **DevOps Team Lead**: devops-lead@econeura.dev
- **CTO**: cto@econeura.dev
- **Emergency**: +1-555-ECONEURA (24/7)
- **Slack**: #oncall channel

## Last Updated
2024-01-15

## Review Schedule
Monthly review by On-call Manager
